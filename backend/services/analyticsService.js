//Authored - Aswin
const natural = require('natural');
const Response = require('../models/Response');
const mongoose = require('mongoose');

const { SentimentAnalyzer, PorterStemmer, WordTokenizer } = natural;
// Better handling of negations/intensifiers than 'afinn'
const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'pattern');
const tokenizer = new WordTokenizer();

// Stopwords: DON'T remove negations ('not','no') or typical sentiment carriers
const DEFAULT_STOPWORDS = new Set([
  'the','a','an','and','or','but','of','to','in','on','for','with','at','by','from',
  'is','are','was','were','be','been','it','this','that','these','those','as','if',
  // intentionally keeping: 'not','no'
  'so','we','you','they','he','she','i','me','my','our','your','their',
  'do','did','does','doing','have','has','had','having','can','could','should',
  'would','will','just','about','into','over','under','than','then','there','here'
]);

function normalizeTokens(text, extraStopwords = []) {
  const extra = new Set(extraStopwords.map(s => s.toLowerCase()));
  const tokens = tokenizer.tokenize(text || '');
  return tokens
    .map(t => t.toLowerCase())
    .map(t => t.replace(/[^a-z0-9']/g, ''))
    .filter(t => t.length >= 2) // allow 2-char words like 'ok'
    .filter(t => !DEFAULT_STOPWORDS.has(t) && !extra.has(t));
}

function scoreToLabel(score) {
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

function createSummary(analysis, style = 'report') {
  const { overallSentiment, topKeywords, details } = analysis || {};
  const topics = (topKeywords || []).slice(0, 5).map(k => k.term);
  const topicsText = topics.length ? topics.join(', ') : 'no dominant keywords';

  const scoreTxt = (overallSentiment && Number.isFinite(overallSentiment.score))
    ? overallSentiment.score.toFixed(2)
    : '0.00';
  const labelTxt = (overallSentiment && overallSentiment.label) || 'neutral';
  const answers = (details && details.answersCount) || 0;

  if (answers === 0) {
    return 'No answers found for this survey; not enough data to summarize.';
  }

  if (style === 'narrative') {
    return `Most responses indicate a ${labelTxt} overall tone (score ${scoreTxt}). Respondents most often mentioned ${topicsText}. This summary is based on ${answers} answers across all responses.`;
  }

  // default: 'report'
  return `Overall sentiment: ${labelTxt} (score ${scoreTxt}). Top keywords: ${topicsText}. Based on ${answers} answers.`;
}

/**
 * Analyze a survey:
 * - keyword frequency (stemming)
 * - overall sentiment (weighted sum with mild normalization)
 *
 * @param {String|ObjectId} surveyId
 * @param {Object} opts
 * @param {number}   [opts.topN=20]
 * @param {string[]} [opts.extraStopwords]
 * @param {'report'|'narrative'} [opts.summaryStyle='report']
 * @returns {Promise<{topKeywords:Array, overallSentiment:{score:number,label:string}, details:{answersCount:number,tokens:number}, summary:string}>}
 */
async function analyzeSurvey(surveyId, opts = {}) {
  const { topN = 20, extraStopwords = [], summaryStyle = 'report' } = opts;

  const docs = await Response.find(
    { surveyId },
    { 'responses.answer': 1 },
    { lean: true }
  );

  let totalScore = 0;
  let totalTokens = 0;
  let answerCount = 0;

  const freqByStem = new Map(); // stem -> { count, forms: Map<form,count> }

  for (const doc of docs) {
    for (const r of (doc.responses || [])) {
      const answer = r.answer || '';
      if (!answer.trim()) continue;

      const tokens = normalizeTokens(answer, extraStopwords);

      // sentiment
      const s = analyzer.getSentiment(tokens);
      totalScore += s;
      totalTokens += Math.max(tokens.length, 1);
      answerCount += 1;

      // keywords
      for (const tok of tokens) {
        const stem = PorterStemmer.stem(tok);
        if (!freqByStem.has(stem)) {
          freqByStem.set(stem, { count: 0, forms: new Map() });
        }
        const entry = freqByStem.get(stem);
        entry.count += 1;
        entry.forms.set(tok, (entry.forms.get(tok) || 0) + 1);
      }
    }
  }

  const keywordArray = Array.from(freqByStem.entries()).map(([stem, data]) => {
    let bestForm = stem, bestCount = 0;
    for (const [form, c] of data.forms.entries()) {
      if (c > bestCount) { bestForm = form; bestCount = c; }
    }
    return { term: bestForm, stem, count: data.count };
  }).sort((a, b) => b.count - a.count);

  // Mild normalization: divide by sqrt(totalTokens)
  const norm = totalTokens > 0 ? Math.sqrt(totalTokens) : 1;
  const overall = answerCount > 0 ? (totalScore / norm) : 0;

  const analysis = {
    topKeywords: keywordArray.slice(0, topN),
    overallSentiment: {
      score: Number(overall.toFixed(3)),
      label: scoreToLabel(overall)
    },
    details: {
      answersCount: answerCount,
      tokens: totalTokens
    }
  };

  const summary = createSummary(analysis, summaryStyle);

  return { ...analysis, summary };
}

/**
 * Build a time-series over responses for a single survey.
 * Groups by a specified interval and returns counts and average completion time.
 *
 * @param {String|ObjectId} surveyId
 * @param {Object} opts
 * @param {'hour'|'day'|'week'|'month'} [opts.interval='day']
 * @param {string} [opts.timezone='UTC'] IANA timezone, e.g., 'UTC', 'America/New_York'
 * @param {Date|string} [opts.start]
 * @param {Date|string} [opts.end]
 * @returns {Promise<Array<{periodStart:Date,responseCount:number,avgCompletionTime:number}>>}
 */
async function timeSeriesForSurvey(surveyId, opts = {}) {
  const { interval = 'day', timezone = 'UTC', start, end } = opts;

  let surveyObjectId = null;
  try {
    surveyObjectId = new mongoose.Types.ObjectId(surveyId);
  } catch (e) {
    // keep null; we'll fall back to string-based matching
  }

  // Primary match (indexed) if we can cast to ObjectId
  const matchIndexed = surveyObjectId ? { surveyId: surveyObjectId } : null;
  // Flexible match that works whether stored as ObjectId or string
  const matchExpr = {
    $expr: { $eq: [ { $toString: '$surveyId' }, String(surveyId) ] }
  };
  // Build optional date filter
  const dateFilter = {};
  if (start || end) {
    const gte = start ? new Date(start) : null;
    const lte = end ? new Date(end) : null;
    if (gte && !isNaN(gte.getTime())) dateFilter.submittedAt = Object.assign(dateFilter.submittedAt || {}, { $gte: gte });
    if (lte && !isNaN(lte.getTime())) dateFilter.submittedAt = Object.assign(dateFilter.submittedAt || {}, { $lte: lte });
  }

  function buildMatch(useExpr) {
    const base = useExpr || !matchIndexed ? matchExpr : matchIndexed;
    if (Object.keys(dateFilter).length === 0) return base;
    return Object.assign({}, base, dateFilter);
  }

  // (diagnostics removed)

  const unit = ['hour', 'day', 'week', 'month'].includes(interval) ? interval : 'day';

  function buildTruncPipeline(useExpr) {
    return [
      { $match: buildMatch(useExpr) },
      {
        $addFields: {
          _period: {
            $dateTrunc: { date: '$submittedAt', unit, timezone }
          }
        }
      },
      {
        $group: {
          _id: '$_period',
          responseCount: { $sum: 1 },
          avgCompletionTime: { $avg: '$completionTime' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          periodStart: '$_id',
          responseCount: 1,
          avgCompletionTime: { $ifNull: ['$avgCompletionTime', 0] }
        }
      }
    ];
  }

  function buildStringBucketPipeline(useExpr) {
    // Build a period format string and parser to emulate bucketing
    let format = '%Y-%m-01T00:00:00';
    if (unit === 'day') format = '%Y-%m-%dT00:00:00';
    if (unit === 'hour') format = '%Y-%m-%dT%H:00:00';

    // Week: use ISO week; produce a canonical string then parse back
    const addFields = {};
    if (unit === 'week') {
      addFields._periodKey = {
        $concat: [
          { $toString: { $isoWeekYear: { date: '$submittedAt', timezone } } },
          '-W',
          { $toString: { $isoWeek: { date: '$submittedAt', timezone } } },
          '-1' // Monday start
        ]
      };
    } else {
      addFields._periodKey = {
        $dateToString: { format, date: '$submittedAt', timezone }
      };
    }

    const projectPeriod = unit === 'week'
      ? {
          periodStart: {
            $dateFromString: {
              dateString: {
                $concat: [
                  { $substrBytes: ['$_id', 0, 4] },
                  '-W',
                  { $substrBytes: ['$_id', 6, 2] },
                  '-1'
                ]
              },
              timezone
            }
          }
        }
      : {
          periodStart: {
            $dateFromString: { dateString: '$_id', timezone }
          }
        };

    return [
      { $match: buildMatch(useExpr) },
      { $addFields: addFields },
      {
        $group: {
          _id: '$_periodKey',
          responseCount: { $sum: 1 },
          avgCompletionTime: { $avg: '$completionTime' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: Object.assign(
          {
            _id: 0,
            responseCount: 1,
            avgCompletionTime: { $ifNull: ['$avgCompletionTime', 0] }
          },
          projectPeriod
        )
      }
    ];
  }

  try {
    // First try indexed match if possible
    let res = await Response.aggregate(buildTruncPipeline(false));
    if (res && res.length) return res;
    // Retry with expr match if nothing found (handles string IDs)
    res = await Response.aggregate(buildTruncPipeline(true));
    if (res && res.length) return res;
    // If still empty, try fallback pipeline(s)
    res = await Response.aggregate(buildStringBucketPipeline(false));
    if (res && res.length) return res;
    res = await Response.aggregate(buildStringBucketPipeline(true));
    return res;
  } catch (err) {
    // Fallback for older MongoDB versions without $dateTrunc
    let res = await Response.aggregate(buildStringBucketPipeline(false));
    if (res && res.length) return res;
    res = await Response.aggregate(buildStringBucketPipeline(true));
    return res;
  }
}

//poll survey
/**
 * Poll for survey updates.
 * @param {string} surveyId - ID of the survey to check.
 * @param {Date|null} since - Optional cutoff timestamp.
 * @returns {Object} result
 * {
 *   updated: boolean,
 *   lastResponseAt: string|null,
 *   newCount?: number
 * }
 */
async function pollSurveyUpdates(surveyId, since = null) {
  // Find the latest submission timestamp for this survey
  const latest = await Response.findOne({ surveyId })
    .sort({ submittedAt: -1 })
    .select({ submittedAt: 1, _id: 0 })
    .lean();

  if (!latest) {
    return { updated: false, lastResponseAt: null };
  }

  const lastResponseAt = latest.submittedAt;

  // If no "since" was provided → just tell client what the last timestamp is
  if (!since) {
    return { updated: true, lastResponseAt };
  }

  // Count new responses after "since"
  const newCount = await Response.countDocuments({
    surveyId,
    submittedAt: { $gt: since }
  });

  if (newCount > 0) {
    return {
      updated: true,
      lastResponseAt,
      newCount
    };
  }

  return {
    updated: false,
    lastResponseAt
  };
}


/** Count how many submissions after `since` (scoped by surveyId if provided). */
async function countSince({ surveyId, since }) {
  const query = {
    ...(surveyId ? { surveyId } : {}),
    submittedAt: { $gt: since },
  };
  return Response.countDocuments(query);
}


module.exports = { analyzeSurvey, createSummary, timeSeriesForSurvey, pollSurveyUpdates };
