// Enhanced Dashboard Service with Simple Numerical Analysis
// services/dashboardService.js

const surveyService = require('./surveyService');
const invitationService = require('./invitationService');
const User = require('../models/User');
const Survey = require('../models/Survey');
const Invitation = require('../models/Invitation');
const Response = require('../models/Response');
const natural = require('natural');

// sentiment tools
const { SentimentAnalyzer, PorterStemmer, WordTokenizer } = natural;
const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'pattern');
const tokenizer = new WordTokenizer();

const STOPWORDS = new Set([
  'the','a','an','and','or','but','of','to','in','on','for','with','at','by','from',
  'is','are','was','were','be','been','it','this','that','these','those','as','if',
  'so','we','you','they','he','she','i','me','my','our','your','their','do','did','does','doing',
  'have','has','had','having','can','could','should','would','will','just','about','into','over','under','than','then','there','here'
]);

function normalizeTokens(text) {
  return tokenizer
    .tokenize(text || '')
    .map(t => t.toLowerCase().replace(/[^a-z0-9']/g, ''))
    .filter(t => t.length >= 2 && !STOPWORDS.has(t));
}

function scoreLabel(score) {
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

function likertMap(answer) {
  const a = String(answer || '').toLowerCase();
  if (/very\s*satisfied/.test(a)) return 5;
  if (/satisfied/.test(a)) return 4;
  if (/(not\s*sure|neutral)/.test(a)) return 2.5;
  if (/very\s*dissatisfied/.test(a)) return 0;
  if (/dissatisfied/.test(a)) return 1;
  return null;
}

function analyzerToFive(text) {
  const tokens = normalizeTokens(text);
  const s = analyzer.getSentiment(tokens);
  const label = scoreLabel(s);
  if (label === 'positive') return 5;
  if (label === 'negative') return 0;
  return 2.5;
}

// Simple numerical statistics calculation
const calculateNumericalStats = (values) => {
  if (!values.length) return null;
  
  const numbers = values.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
  if (!numbers.length) return null;
  
  numbers.sort((a, b) => a - b);
  
  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = sum / numbers.length;
  const median = numbers.length % 2 === 0 
    ? (numbers[numbers.length / 2 - 1] + numbers[numbers.length / 2]) / 2
    : numbers[Math.floor(numbers.length / 2)];
  
  // Mode calculation
  const counts = {};
  numbers.forEach(num => counts[num] = (counts[num] || 0) + 1);
  const mode = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  
  return {
    count: numbers.length,
    mean: Math.round(mean * 100) / 100,
    median,
    mode: parseFloat(mode),
    min: numbers[0],
    max: numbers[numbers.length - 1]
  };
};

// Check if responses are numerical
const isNumericalQuestion = (answers) => {
  if (!answers.length) return false;
  
  const numericalCount = answers.filter(answer => {
    const value = String(answer).trim();
    return value && !isNaN(parseFloat(value)) && isFinite(value);
  }).length;
  
  // Consider it numerical if at least 80% of responses are numbers
  return numericalCount >= answers.length * 0.8;
};

// Calculate simple survey analysis (numerical only)
const calculateSurveyAnalysis = async (surveyId) => {
  try {
    // Get all responses for this survey
    const responses = await Response.find({ surveyId })
      .sort({ submittedAt: -1 })
      .lean();
    
    if (!responses.length) {
      return {
        questionAnalysis: [],
        overallMetrics: {
          totalResponses: 0,
          avgCompletionTime: 0
        }
      };
    }

    // Aggregate responses by question
    const questionData = {};
    const completionTimes = [];
    
    responses.forEach(response => {
      if (response.completionTime) {
        completionTimes.push(response.completionTime);
      }
      
      response.responses.forEach(({ questionId, questionText, answer }) => {
        if (!questionData[questionId]) {
          questionData[questionId] = {
            questionId,
            questionText,
            answers: []
          };
        }
        if (answer && String(answer).trim()) {
          questionData[questionId].answers.push(answer);
        }
      });
    });

    // Calculate analysis only for numerical questions (existing)
    const questionAnalysis = Object.values(questionData)
      .map(({ questionId, questionText, answers }) => {
        if (!isNumericalQuestion(answers)) {
          return null; // Skip non-numerical questions for numerical stats
        }
        const statistics = calculateNumericalStats(answers);
        return {
          questionId,
          questionText,
          type: 'numerical',
          responseCount: answers.length,
          statistics
        };
      })
      .filter(q => q && q.statistics);

    // New: sentiment-based 0-5 Question Scores and Key Insights
    const questionScores = Object.values(questionData).map(({ questionId, questionText, answers }) => {
      if (!answers || answers.length === 0) {
        return { questionId, questionText, score: 0, sampleAnswersCount: 0 };
      }
      let total = 0;
      let pos = 0, neu = 0, neg = 0;
      const keywordCounts = new Map();
      for (const ans of answers) {
        // Prefer Likert mappings when available
        const likert = likertMap(ans);
        const score = likert != null ? likert : analyzerToFive(ans);
        total += score;
        const tokens = normalizeTokens(ans);
        tokens.forEach(t => keywordCounts.set(t, (keywordCounts.get(t) || 0) + 1));
        const lbl = scoreLabel(analyzer.getSentiment(normalizeTokens(ans)));
        if (lbl === 'positive') pos++; else if (lbl === 'negative') neg++; else neu++;
      }
      const avg = Number((total / answers.length).toFixed(2));
      // keyword selection
      const top = Array.from(keywordCounts.entries()).sort((a,b)=>b[1]-a[1])[0];
      const topKeyword = top ? top[0] : (questionText.split(/[:?]/)[0] || 'Insights');
      // tone/impact heuristic
      const tone = pos > neg ? 'positive' : (neg > pos ? 'negative' : 'neutral');
      const impact = avg >= 4.2 ? 'high' : avg >= 3 ? 'medium' : 'low';
      const desc = tone === 'positive'
        ? `Many respondents expressed positive feedback about ${topKeyword}.`
        : tone === 'negative'
          ? `Concerns were raised regarding ${topKeyword}.`
          : `Responses were mixed regarding ${topKeyword}.`;
      return {
        questionId,
        questionText,
        score: avg,
        sampleAnswersCount: answers.length,
        _insight: {
          title: topKeyword.charAt(0).toUpperCase() + topKeyword.slice(1),
          description: desc,
          tone,
          impact
        }
      };
    });

    // Build insights list with type-aware rules
    const insights = [];

    // Likert Q1/Q4 style using question text heuristics
    Object.values(questionData).forEach(({ questionId, questionText, answers }) => {
      if (insights.length >= 4) return;
      const qtext = (questionText || '').toLowerCase();
      const likertAnswers = answers.map(a => String(a));
      const counts = { vs:0, s:0, n:0, d:0, vd:0 };
      likertAnswers.forEach(a => {
        const val = String(a).toLowerCase();
        if (val.includes('very dissatisfied')) counts.vd++;
        else if (val.includes('dissatisfied')) counts.d++;
        else if (/(not sure|neutral)/.test(val)) counts.n++;
        else if (val.includes('very satisfied')) counts.vs++;
        else if (val.includes('satisfied')) counts.s++;
      });
      const totalLikert = counts.vs+counts.s+counts.n+counts.d+counts.vd;
      if (totalLikert > 0) {
        const pct = k => Math.round((counts[k] / totalLikert) * 100);
        const negPct = pct('vd') + pct('d');
        const posPct = pct('vs') + pct('s');
        const neuPct = pct('n');
        let title = 'Mixed Satisfaction';
        let tone = 'neutral';
        // Calibrated thresholds so we only call "High Dissatisfaction" when it truly dominates
        if (negPct >= 60) { title = 'High Dissatisfaction'; tone='negative'; }
        else if (negPct >= 30) { title = 'Notable Dissatisfaction'; tone='negative'; }
        else if (posPct >= 60) { title = 'High Satisfaction'; tone='positive'; }
        const impact = negPct >= 40 || posPct >= 60 ? 'high' : (Math.max(negPct,posPct) >= 25 ? 'medium' : 'low');
        const description = title === 'High Dissatisfaction'
          ? 'A majority of respondents expressed dissatisfaction.'
          : title === 'Notable Dissatisfaction'
            ? 'Some respondents expressed dissatisfaction.'
          : title === 'High Satisfaction'
            ? 'Most respondents reported being satisfied.'
            : 'Responses show a mix of satisfaction levels.';
        insights.push({ questionId, title, description, tone, impact, stats: { total: totalLikert } });
        return;
      }

      // Multi-select (methods, options separated by ;)
      if (answers.some(a => String(a).includes(';'))) {
        const optionCounts = new Map();
        answers.forEach(a => String(a).split(';').map(s=>s.trim()).filter(Boolean).forEach(opt => optionCounts.set(opt, (optionCounts.get(opt)||0)+1)));
        const sorted = Array.from(optionCounts.entries()).sort((a,b)=>b[1]-a[1]);
        const total = sorted.reduce((a,[_k,c])=>a+c,0);
        const top = sorted.slice(0,3).map(([opt,_c])=>opt).join(', ');
        insights.push({ questionId, title: `Preference: ${sorted[0][0]}`,
          description: `Common choices include ${top}.`, tone: 'neutral',
          impact: sorted[0][1]/total>=0.5?'high':(sorted[0][1]/total>=0.3?'medium':'low') });
        return;
      }

      // Free text themes with sample quote
      const themeCounts = new Map();
      let quote = null;
      answers.forEach(a => {
        const text = String(a);
        const toks = normalizeTokens(text);
        for (let i=0;i<toks.length-1;i++) {
          const bigram = `${toks[i]} ${toks[i+1]}`;
          themeCounts.set(bigram, (themeCounts.get(bigram)||0)+1);
        }
        if (!quote && /improve|unclear|heavy|issue|problem|bad|poor/.test(text.toLowerCase())) quote = text;
      });
      const theme = Array.from(themeCounts.entries()).sort((a,b)=>b[1]-a[1])[0];
      if (theme) {
        const themeText = theme[0];
        const s = analyzer.getSentiment(normalizeTokens(answers.join(' ')));
        const tone = scoreLabel(s);
        const impact = theme[1] >= 3 ? 'high' : theme[1] === 2 ? 'medium' : 'low';
        const description = tone === 'negative' && quote
          ? `Several comments raise concerns about "${themeText}". Example: “${quote}”.`
          : `Frequent mentions of "${themeText}".`;
        insights.push({ questionId, title: (tone==='negative'?`${themeText} needs improvement`:`${themeText}`), description, tone, impact });
      }
    });

    // Cap to max 4
    const finalInsights = insights.slice(0,4);

    // Calculate overall metrics
    const avgCompletionTime = completionTimes.length > 0 
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;

    const overallMetrics = {
      totalResponses: responses.length,
      avgCompletionTime
    };

    return {
      questionAnalysis,
      questionScores,
      insights: finalInsights,
      overallMetrics
    };

  } catch (error) {
    console.error('Error calculating survey analysis:', error);
    return {
      questionAnalysis: [],
      overallMetrics: {
        totalResponses: 0,
        avgCompletionTime: 0
      }
    };
  }
};

// Get comprehensive homepage data for user (existing function)
exports.getHomepageData = async (userId) => {
  try {
    // Get user info
    const user = await User.findById(userId, 'name email createdAt').lean();
    if (!user) {
      const error = new Error('User not found');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Get user's created surveys with stats
    const createdSurveys = await surveyService.getUserCreatedSurveys(userId);

    // Get user's received invitations
    const receivedInvitations = await invitationService.getUserReceivedInvitations(userId);

    // Calculate user statistics
    const stats = await this.calculateUserStats(userId);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        memberSince: user.createdAt
      },
      createdSurveys,
      receivedInvitations,
      stats
    };
  } catch (error) {
    // Re-throw custom errors, wrap others
    if (error.code) {
      throw error;
    } else {
      const wrappedError = new Error('Failed to load homepage data');
      wrappedError.code = 'HOMEPAGE_LOAD_FAILED';
      wrappedError.originalError = error;
      throw wrappedError;
    }
  }
};

// Calculate comprehensive user statistics (existing function)
exports.calculateUserStats = async (userId) => {
  try {
    // Ensure we have a valid ObjectId
    const mongoose = require('mongoose');
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Count surveys created by user
    const totalSurveysCreated = await Survey.countDocuments({ creatorId: userObjectId });

    // Count invitations received by user
    const totalInvitationsReceived = await Invitation.countDocuments({ userId: userObjectId });

    // Count responses given by user (completed invitations)
    const totalResponsesGiven = await Invitation.countDocuments({ 
      userId: userObjectId, 
      status: 'completed' 
    });

    // Count active vs closed surveys created - using separate queries for reliability
    const activeSurveys = await Survey.countDocuments({ 
      creatorId: userObjectId, 
      status: 'active' 
    });
    
    const closedSurveys = await Survey.countDocuments({ 
      creatorId: userObjectId, 
      status: 'closed' 
    });

    // Get response rate for user's surveys - Simpler approach
    // First, find all surveys created by this user
    const userSurveys = await Survey.find({ creatorId: userObjectId }).select('_id');
    const surveyIds = userSurveys.map(survey => survey._id);
    
    // Then count invitations to those surveys
    let totalSent = 0;
    let totalCompleted = 0;
    
    if (surveyIds.length > 0) {
      totalSent = await Invitation.countDocuments({ 
        surveyId: { $in: surveyIds } 
      });
      
      totalCompleted = await Invitation.countDocuments({ 
        surveyId: { $in: surveyIds },
        status: 'completed'
      });
    }

    const responseStats = { totalSent, totalCompleted };
    const overallResponseRate = responseStats.totalSent > 0 
      ? Math.round((responseStats.totalCompleted / responseStats.totalSent) * 100)
      : 0;

    // Count pending invitations received
    const pendingInvitations = await Invitation.countDocuments({ 
      userId: userObjectId, 
      status: 'sent' 
    });

    return {
      totalSurveysCreated,
      totalInvitationsReceived,
      totalResponsesGiven,
      pendingInvitations,
      activeSurveys,
      closedSurveys,
      overallResponseRate,
      totalInvitationsSent: responseStats.totalSent,
      totalResponsesReceived: responseStats.totalCompleted
    };
  } catch (error) {
    console.error('Error calculating user stats:', error);
    // Return default stats on error
    return {
      totalSurveysCreated: 0,
      totalInvitationsReceived: 0,
      totalResponsesGiven: 0,
      pendingInvitations: 0,
      activeSurveys: 0,
      closedSurveys: 0,
      overallResponseRate: 0,
      totalInvitationsSent: 0,
      totalResponsesReceived: 0
    };
  }
};



// ENHANCED: Get survey dashboard data with simple numerical analysis
exports.getSurveyDashboard = async (surveyId, creatorId) => {
  try {
    // Get survey details with creator verification
    const survey = await surveyService.getSurveyById(surveyId, creatorId);

    // Get invitation statistics
    const invitationStats = await invitationService.getInvitationStats(surveyId);

    // Get detailed invitation list
    const invitations = await invitationService.getSurveyInvitations(surveyId, creatorId);

    // Get recent activity (last 10 invitations)
    const recentInvitations = invitations.slice(0, 10);

    const analysis = await calculateSurveyAnalysis(surveyId);

    // Recent responses for table
    const recentResponsesDocs = await Response.find({ surveyId })
      .sort({ submittedAt: -1 })
      .limit(10)
      .populate('respondentId', 'name email')
      .lean();

    // Fill missing respondent emails via invitation.userId
    const missingInviteIds = recentResponsesDocs
      .filter(d => (!d.respondentId || !d.respondentId.email) && d.invitationId)
      .map(d => d.invitationId);
    let inviteUserMap = new Map();
    if (missingInviteIds.length) {
      const invites = await Invitation.find({ _id: { $in: missingInviteIds } })
        .populate('userId', 'name email')
        .select({ _id: 1, userId: 1 })
        .lean();
      invites.forEach(inv => inviteUserMap.set(String(inv._id), inv.userId));
    }

    const respondedUserIds = new Set(recentResponsesDocs.map(d => String(d.respondentId?._id || '')));

    const recentResponses = recentResponsesDocs.map(doc => {
      const text = (doc.responses || []).map(r => r.answer || '').join(' ');
      const tokens = normalizeTokens(text);
      const s = analyzer.getSentiment(tokens);
      const label = scoreLabel(s);
      const fallbackUser = inviteUserMap.get(String(doc.invitationId));

      // derive satisfaction level from a Likert answer (try Q1 first, then any answer)
      let satisfactionLevel = null;
      const likertResp = (doc.responses || []).find(r => String(r.questionId).toLowerCase() === 'q1') || (doc.responses || [])[0];
      const ans = likertResp?.answer ? String(likertResp.answer) : '';
      if (/very\s*dissatisfied/i.test(ans)) satisfactionLevel = 'Very Dissatisfied';
      else if (/dissatisfied/i.test(ans)) satisfactionLevel = 'Dissatisfied';
      else if (/(not\s*sure|neutral)/i.test(ans)) satisfactionLevel = 'Neutral';
      else if (/very\s*satisfied/i.test(ans)) satisfactionLevel = 'Very Satisfied';
      else if (/satisfied/i.test(ans)) satisfactionLevel = 'Satisfied';
      // fallback: scan all answers for any likert keyword
      if (!satisfactionLevel && Array.isArray(doc.responses)) {
        for (const r of doc.responses) {
          const a = String(r.answer || '');
          if (/very\s*dissatisfied/i.test(a)) { satisfactionLevel = 'Very Dissatisfied'; break; }
          if (/dissatisfied/i.test(a)) { satisfactionLevel = 'Dissatisfied'; break; }
          if (/(not\s*sure|neutral)/i.test(a)) { satisfactionLevel = 'Neutral'; break; }
          if (/very\s*satisfied/i.test(a)) { satisfactionLevel = 'Very Satisfied'; break; }
          if (/satisfied/i.test(a)) { satisfactionLevel = 'Satisfied'; break; }
        }
      }

      return {
        id: doc._id,
        respondent: {
          name: (doc.respondentId?.name || fallbackUser?.name || 'Respondent'),
          email: (doc.respondentId?.email || fallbackUser?.email || '')
        },
        submittedAt: doc.submittedAt,
        completionTime: doc.completionTime || 0,
        sentiment: { label, score: Number(s.toFixed ? s.toFixed(3) : s) },
        satisfactionLevel: satisfactionLevel,
        status: 'Completed'
      };
    });

    // Include pending invites (not completed yet)
    const allInvites = await Invitation.find({ surveyId })
      .populate('userId', 'name email')
      .select({ status: 1, userId: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();

    const pending = allInvites
      .filter(inv => inv.status === 'sent')
      .filter(inv => !respondedUserIds.has(String(inv.userId?._id || '')))
      .slice(0, Math.max(0, 10 - recentResponses.length))
      .map(inv => ({
        id: String(inv._id),
        respondent: { name: inv.userId?.name || 'Invited User', email: inv.userId?.email || '' },
        submittedAt: inv.createdAt,
        completionTime: 0,
        sentiment: { label: 'neutral', score: 0 },
        satisfactionLevel: '--',
        status: 'Not Completed'
      }));

    const recentCombined = [...recentResponses, ...pending].slice(0, 10);

    return {
      survey,
      stats: {
        questionCount: survey.questions.length,
        ...invitationStats
      },
      invitations: recentInvitations,
      analysis,
      recentResponses: recentCombined,
      lastUpdated: new Date()
    };
  } catch (error) {
    if (error.code) {
      throw error;
    } else {
      const wrappedError = new Error('Failed to load survey dashboard');
      wrappedError.code = 'DASHBOARD_LOAD_FAILED';
      wrappedError.originalError = error;
      throw wrappedError;
    }
  }
};

exports.calculateSurveyAnalysis = calculateSurveyAnalysis;

const cache = {};
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Optimized polling stats for dashboard with cross-survey aggregation and caching.
 * Returns user stats + per-survey response/score aggregation.
 */
exports.getUserDashboardPollingStats = async (userId) => {
  const cacheKey = `dashboard_polling_${userId}`;
  const now = Date.now();

  // Serve from cache if fresh
  if (cache[cacheKey] && (now - cache[cacheKey].timestamp < CACHE_TTL)) {
    return cache[cacheKey].data;
  }

  // 1. Get overall user stats (reuse your existing function)
  const userStats = await exports.calculateUserStats(userId);

  // 2. Cross-survey aggregation: For each survey created by user, get response count and average score
  const mongoose = require('mongoose');
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Find all surveys created by this user
  const surveys = await Survey.find({ creatorId: userObjectId }).select('_id title').lean();
  const surveyIds = surveys.map(s => s._id);

  let surveyAggregates = [];
  if (surveyIds.length > 0) {
    // Aggregate responses for each survey (response count, avg score if numerical)
    surveyAggregates = await Response.aggregate([
      { $match: { surveyId: { $in: surveyIds } } },
      {
        $group: {
          _id: '$surveyId',
          responseCount: { $sum: 1 },
          avgScore: { $avg: '$responses.score' } // assumes 'score' field in responses array
        }
      }
    ]);
  }

  // Map aggregates to survey info
  const surveyStats = surveys.map(survey => {
    const agg = surveyAggregates.find(a => String(a._id) === String(survey._id));
    return {
      surveyId: survey._id,
      title: survey.title,
      responseCount: agg ? agg.responseCount : 0,
      avgScore: agg && agg.avgScore ? Math.round(agg.avgScore * 100) / 100 : null
    };
  });

  const result = {
    userStats,
    surveyStats,
    lastUpdated: new Date()
  };

  // Cache result
  cache[cacheKey] = { data: result, timestamp: now };
  return result;
};

/**
 * Enhanced cross-survey aggregation for dashboard:
 * - Per-survey stats (responses, avg completion time)
 * - Overall completion rate
 * - Response trends (last 14 days)
 */
exports.getCrossSurveyAggregation = async (userId) => {
  const mongoose = require('mongoose');
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Find all surveys created by this user
  const surveys = await Survey.find({ creatorId: userObjectId }).select('_id title createdAt').lean();
  const surveyIds = surveys.map(s => s._id);

  let surveyAggregates = [];
  let overallCompletionRate = 0;
  let responseTrends = [];

  if (surveyIds.length > 0) {
    // Per-survey stats
    surveyAggregates = await Response.aggregate([
      { $match: { surveyId: { $in: surveyIds } } },
      {
        $group: {
          _id: '$surveyId',
          responseCount: { $sum: 1 },
          avgCompletionTime: { $avg: '$completionTime' }
        }
      }
    ]);

    // Overall completion rate
    const totalInvitations = await Invitation.countDocuments({ surveyId: { $in: surveyIds } });
    const totalCompleted = await Invitation.countDocuments({ surveyId: { $in: surveyIds }, status: 'completed' });
    overallCompletionRate = totalInvitations > 0 ? Math.round((totalCompleted / totalInvitations) * 100) : 0;

    // Response trends (last 14 days)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    responseTrends = await Response.aggregate([
      { $match: { surveyId: { $in: surveyIds }, submittedAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  // Map aggregates to survey info
  const surveyStats = surveys.map(survey => {
    const agg = surveyAggregates.find(a => String(a._id) === String(survey._id));
    return {
      surveyId: survey._id,
      title: survey.title,
      responseCount: agg ? agg.responseCount : 0,
      avgCompletionTime: agg && agg.avgCompletionTime ? Math.round(agg.avgCompletionTime) : null
    };
  });

  return {
    surveyStats,
    overallCompletionRate,
    responseTrends,
    lastUpdated: new Date()
  };
};