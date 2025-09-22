// Enhanced Dashboard Service with Simple Numerical Analysis
// services/dashboardService.js

const surveyService = require('./surveyService');
const invitationService = require('./invitationService');
const User = require('../models/User');
const Survey = require('../models/Survey');
const Invitation = require('../models/Invitation');
const Response = require('../models/Response');

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

    // Calculate analysis only for numerical questions
    const questionAnalysis = Object.values(questionData)
      .map(({ questionId, questionText, answers }) => {
        if (!isNumericalQuestion(answers)) {
          return null; // Skip non-numerical questions
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
      .filter(q => q && q.statistics); // Only include questions with valid statistics

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

    return {
      survey,
      stats: {
        questionCount: survey.questions.length,
        ...invitationStats
      },
      invitations: recentInvitations,
      analysis, 
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