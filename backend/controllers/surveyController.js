// Survey controller: validates requests, delegates to service layer
const surveyService = require('../services/surveyService');
const multer = require('multer');

// Configure multer for CSV file upload 
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024, 
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
}).single('csvFile');

// Middleware wrapper for multer with error handling
exports.uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large (max 1MB)' });
      }
      if (err.message === 'Only CSV files are allowed') {
        return res.status(400).json({ error: 'Only CSV files are allowed' });
      }
      return res.status(400).json({ error: 'File upload error' });
    }
    next();
  });
};

// Create new survey from uploaded CSV
exports.createSurvey = async (req, res) => {
  try {
    const { title, csvData } = req.body;
    const userId = req.userId;

    // Validate inputs
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Survey title is required' });
    }

    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ 
        error: 'CSV data is required and must be an array of objects' 
      });
    }

    // Get original filename (if uploaded via file)
    const originalFilename = req.file ? req.file.originalname : 'manual_input.csv';

    // Create survey via service
    const survey = await surveyService.createSurvey({
      title: title.trim(),
      creatorId: userId,
      csvData,
      originalFilename
    });

    return res.status(201).json({
      message: 'Survey created successfully',
      survey
    });

  } catch (error) {
    console.error('Survey creation error:', error);
    
    // Handle known business logic errors
    if (error.code === 'MISSING_TITLE') {
      return res.status(400).json({ error: 'Survey title is required' });
    }
    if (error.code === 'TITLE_TOO_LONG') {
      return res.status(400).json({ error: 'Survey title too long (max 100 characters)' });
    }
    if (error.code === 'INVALID_CSV_DATA') {
      return res.status(400).json({ error: 'Invalid CSV data format' });
    }
    if (error.code === 'MISSING_CSV_COLUMN') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 'MAX_QUESTIONS_EXCEEDED') {
      return res.status(400).json({ error: 'Maximum 20 questions allowed per survey' });
    }
    if (error.code === 'DUPLICATE_QUESTION_IDS') {
      return res.status(400).json({ error: 'Question IDs must be unique within the survey' });
    }
    if (error.code === 'INCOMPLETE_CSV_ROW') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 'QUESTION_TEXT_TOO_LONG') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 'CREATOR_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(500).json({ error: 'Survey creation failed' });
  }
};

// Get surveys created by the authenticated user
exports.getUserCreatedSurveys = async (req, res) => {
  try {
    const userId = req.userId;
    
    const surveys = await surveyService.getUserCreatedSurveys(userId);
    
    return res.json({
      surveys,
      count: surveys.length
    });

  } catch (error) {
    console.error('Get created surveys error:', error);
    return res.status(500).json({ error: 'Failed to load surveys' });
  }
};

// Get single survey details (creator verification)
exports.getSurveyDetails = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const userId = req.userId;

    if (!surveyId || !surveyId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid survey ID' });
    }

    const survey = await surveyService.getSurveyById(surveyId, userId);
    
    return res.json({ survey });

  } catch (error) {
    console.error('Get survey details error:', error);
    
    if (error.code === 'SURVEY_NOT_FOUND') {
      return res.status(404).json({ error: 'Survey not found' });
    }
    if (error.code === 'ACCESS_DENIED') {
      return res.status(403).json({ error: 'Access denied: not survey creator' });
    }

    return res.status(500).json({ error: 'Failed to load survey details' });
  }
};

// Get survey for public access (via invitation token)
exports.getSurveyForResponse = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { token } = req.query;

    if (!surveyId || !surveyId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid survey ID' });
    }

    if (!token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // This will be handled by invitation service
    const invitationService = require('../services/invitationService');
    const accessData = await invitationService.validateInvitationAccess(
      surveyId, 
      token, 
      req.userId
    );

    return res.json(accessData);

  } catch (error) {
    console.error('Get survey for response error:', error);
    
    if (error.code === 'INVALID_TOKEN') {
      return res.status(401).json({ error: 'Invalid or expired invitation token' });
    }
    if (error.code === 'SURVEY_INACTIVE') {
      return res.status(410).json({ error: 'This survey is no longer active' });
    }
    if (error.code === 'ACCESS_DENIED') {
      return res.status(403).json({ error: 'This invitation was sent to a different user' });
    }
    if (error.code === 'ALREADY_COMPLETED') {
      return res.status(409).json({ error: 'You have already completed this survey' });
    }

    return res.status(500).json({ error: 'Failed to access survey' });
  }
};

// Update survey status (close/activate)
exports.updateSurveyStatus = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    if (!surveyId || !surveyId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid survey ID' });
    }

    if (!status || !['active', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "active" or "closed"' });
    }

    // Verify ownership first
    await surveyService.getSurveyById(surveyId, userId);

    // Update status
    const Survey = require('../models/Survey');
    await Survey.findByIdAndUpdate(surveyId, { status });

    return res.json({ 
      message: 'Survey status updated successfully',
      surveyId,
      status 
    });

  } catch (error) {
    console.error('Update survey status error:', error);
    
    if (error.code === 'SURVEY_NOT_FOUND') {
      return res.status(404).json({ error: 'Survey not found' });
    }
    if (error.code === 'ACCESS_DENIED') {
      return res.status(403).json({ error: 'Access denied: not survey creator' });
    }

    return res.status(500).json({ error: 'Failed to update survey status' });
  }
};

//save survey response
//author: Aswin and Suong Ngo
exports.saveSurveyResponse = async (req, res) => {
  try {
    const surveyResponseService = require('../services/surveyResponse');
    const responseData = req.body;
    
    console.log('Received response data in controller:', JSON.stringify(responseData));
    
    // Additional validation at controller level
    if (!responseData.surveyId) {
      return res.status(400).json({ error: 'Survey ID is required' });
    }
    
    if (!responseData.responses || !Array.isArray(responseData.responses) || responseData.responses.length === 0) {
      return res.status(400).json({ error: 'At least one response is required' });
    }

    // Get user ID from auth if available
    if (req.userId) {
      console.log('Using authenticated user ID:', req.userId);
      responseData.respondentId = req.userId;
    }

    // Process response data
    try {
      const savedResponse = await surveyResponseService.saveSurveyResponse(responseData);
      console.log('Response saved successfully:', savedResponse._id);
      
      return res.status(201).json({ 
        message: 'Survey response submitted successfully',
        success: true,
        response: {
          id: savedResponse._id,
          surveyId: savedResponse.surveyId,
          submittedAt: savedResponse.submittedAt
        }
      });
    } catch (saveError) {
      console.error('Error saving response:', saveError);
      throw saveError;
    }
  } catch (error) {
    console.error('Save survey response error:', error);
    
    // Handle specific errors with appropriate status codes
    if (error.message.includes('duplicate key')) {
      return res.status(409).json({ error: 'You have already submitted a response for this invitation' });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error: ' + error.message,
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to save survey response: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
