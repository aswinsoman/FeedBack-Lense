const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const activityController = require('../controllers/activityController');

router.use(requireAuth);

// View activity feed for a survey
router.get('/survey/:surveyId', activityController.getSurveyActivity);

module.exports = router;