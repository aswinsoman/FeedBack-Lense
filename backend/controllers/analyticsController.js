// controllers/surveyAnalysis.controller.js
const { analyzeSurvey } = require('../services/analyticsService');
const { timeSeriesForSurvey } = require('../services/analyticsService');
const { pollSurveyUpdates } = require('../services/analyticsService');

exports.getSurveyAnalysis = async (req, res, next) => {
  try {
    const { surveyId } = req.params;
    const topN = req.query.topN ? parseInt(req.query.topN, 10) : 20;

    const analysis = await analyzeSurvey(surveyId, { topN });

    return res.status(200).json({
      success: true,
      surveyId,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing survey:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze survey',
      error: error.message
    });
  }
};

exports.getSurveyTimeSeries = async (req, res, next) => {
  try {
    const { surveyId } = req.params;
    const { interval = 'day', tz = 'UTC', start, end } = req.query;

    const data = await timeSeriesForSurvey(surveyId, {
      interval,
      timezone: tz,
      start,
      end
    });

    return res.status(200).json({
      success: true,
      surveyId,
      interval,
      timezone: tz,
      data
    });
  } catch (error) {
    console.error('Error building time series:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to build time series',
      error: error.message
    });
  }
};

//poll survey 

exports.pollSurvey = async (req, res, next) => {
  // helper: prefer header, then query; support ISO or epoch ms
  const parseSince = (req) => {
    const hdr = req.get('If-Modified-Since');
    const q = req.query.since;
    const raw = hdr || q;
    if (!raw) return null;

    // epoch ms?
    if (/^\d+$/.test(String(raw))) {
      const d = new Date(Number(raw));
      return isNaN(d.getTime()) ? null : d;
    }

    // ISO or RFC 1123
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  try {
    const { surveyId } = req.params;
    if (!surveyId) {
      return res.status(400).json({ error: 'surveyId param is required' });
    }

    const sinceDate = parseSince(req);

    // Your service should return:
    // { updated: boolean, lastResponseAt: string|undefined, newCount?: number, ... }
    const result = await pollSurveyUpdates(surveyId, sinceDate);

    // If we've never had any responses yet
    if (!result?.lastResponseAt) {
      res.set('Last-Modified', new Date(0).toUTCString());
      return res.status(204).send();
    }

    // Always advertise server-side latest
    const lastAt = new Date(result.lastResponseAt);
    res.set('Last-Modified', lastAt.toUTCString());
    // (optional but helpful for intermediaries)
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    // If client is already up-to-date -> 304 with no body
    if (sinceDate && sinceDate >= lastAt) {
      return res.status(304).send();
    }

    // If service says nothing new (e.g., called without a since)
    if (!result.updated) {
      // Keep payload tiny
      return res.status(200).json({
        updated: false,
        lastResponseAt: lastAt.toISOString()
      });
    }

    // There are updates — return a small summary
    return res.status(200).json({
      updated: true,
      lastResponseAt: lastAt.toISOString(),
      newCount: result.newCount ?? undefined
      // add other tiny fields if you decide (e.g., latestIds)
    });
  } catch (error) {
    console.error('Error polling survey:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to poll survey updates',
      error: error.message
    });
  }
};

