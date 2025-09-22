const activityService = require('../services/activityService');

exports.getSurveyActivity = async (req, res) => {
  const { surveyId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  try {
    const feed = await activityService.getSurveyActivityFeed(surveyId, page, limit);
    res.json(feed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load survey activity' });
  }
};