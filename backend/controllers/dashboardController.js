// Dashboard controller: homepage data, analytics, user statistics
const dashboardService = require('../services/dashboardService');

exports.getHomepage = async (req, res) => {
  try {
    const userId = req.userId;
    
    const homepageData = await dashboardService.getHomepageData(userId);
    
    return res.json({
      success: true,
      data: homepageData
    });

  } catch (error) {
    console.error('Get homepage data error:', error);
    
    if (error.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.code === 'HOMEPAGE_LOAD_FAILED') {
      return res.status(500).json({ error: 'Failed to load homepage data' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get individual survey dashboard with analytics
exports.getSurveyDashboard = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const userId = req.userId;

    // Validate survey ID format
    if (!surveyId || !surveyId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid survey ID' });
    }

    const dashboardData = await dashboardService.getSurveyDashboard(surveyId, userId);
    
    return res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get survey dashboard error:', error);
    
    if (error.code === 'SURVEY_NOT_FOUND') {
      return res.status(404).json({ error: 'Survey not found' });
    }
    if (error.code === 'ACCESS_DENIED') {
      return res.status(403).json({ error: 'Access denied: not survey creator' });
    }
    if (error.code === 'DASHBOARD_LOAD_FAILED') {
      return res.status(500).json({ error: 'Failed to load survey dashboard' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user statistics only
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.userId;
    
    const stats = await dashboardService.calculateUserStats(userId);
    
    return res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    return res.status(500).json({ error: 'Failed to load user statistics' });
  }
};

// Get summary data for dashboard widgets
exports.getQuickSummary = async (req, res) => {
  try {
    const userId = req.userId;
    
    const stats = await dashboardService.calculateUserStats(userId);
    
    const surveyService = require('../services/surveyService');
    const invitationService = require('../services/invitationService');
    
    const recentSurveys = await surveyService.getUserCreatedSurveys(userId);
    const recentInvitations = await invitationService.getUserReceivedInvitations(userId);
    
    const latestSurveys = recentSurveys.slice(0, 3);
    const latestInvitations = recentInvitations.slice(0, 3);
    
    return res.json({
      success: true,
      summary: {
        stats,
        latest: {
          surveys: latestSurveys,
          invitations: latestInvitations
        }
      }
    });

  } catch (error) {
    console.error('Get quick summary error:', error);
    return res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
};

exports.pollUserDashboardStats = async (req, res) => {
  console.log(req.user);
  try {
    // Use req.user._id if available, otherwise fallback to req.userId or null
    const userId = req.user && req.user._id ? req.user._id.toString() : req.userId || null;

    const stats = await dashboardService.getUserDashboardPollingStats(userId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard polling stats' });
  }
};

exports.getCrossSurveyAggregation = async (req, res) => {
  try {
    const userId = req.user && req.user._id ? req.user._id.toString() : req.userId || null;
    const data = await dashboardService.getCrossSurveyAggregation(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cross-survey aggregation' });
  }
};