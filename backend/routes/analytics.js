const router = require('express').Router();

const analyticsController = require('../controllers/analyticsController');

const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// Get analytics overview for a specific survey
router.get('/survey/:surveyId/analysis', analyticsController.getSurveyAnalysis);
// Time-series analytics
router.get('/survey/:surveyId/timeseries', analyticsController.getSurveyTimeSeries);
// Lightweight polling for updates
router.get('/survey/:surveyId/poll', analyticsController.pollSurvey);

module.exports = router;