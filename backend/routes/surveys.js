const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const surveyController = require('../controllers/surveyController');

// All survey routes require authentication
router.use(requireAuth);

// Survey management routes
router.post('/create', 
  surveyController.uploadMiddleware,
  surveyController.createSurvey
);

router.get('/created', surveyController.getUserCreatedSurveys);

router.get('/:surveyId', surveyController.getSurveyDetails);

router.patch('/:surveyId/status', surveyController.updateSurveyStatus);

// Survey invitation management
router.post('/:surveyId/invitations', 
  require('../controllers/invitationController').sendInvitations
);

router.get('/:surveyId/invitations', 
  require('../controllers/invitationController').getSurveyInvitations
);

router.get('/:surveyId/invitations/stats', 
  require('../controllers/invitationController').getInvitationStats
);

//save survey response
//author: Aswin
router.post('/respond', surveyController.saveSurveyResponse);

module.exports = router;