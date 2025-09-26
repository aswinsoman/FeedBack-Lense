// Invitation business logic: token generation, invitation management, validation
const Invitation = require('../models/Invitation');
const Survey = require('../models/Survey');
const User = require('../models/User');
const Response = require('../models/Response');
const activityService = require('./activityService'); // Add at the top if not present

// Send invitations to multiple users
exports.sendInvitations = async ({ surveyId, creatorId, userEmails }) => {
  // Validate survey exists and creator owns it
  let survey = await Survey.findById(surveyId);
  if (!survey) {
    survey = await Survey.findOne({ surveyCode: surveyId });
    console.log(survey);
  }

  if (!survey) {
    throw new Error('Survey not found');
  }

  if (survey.creatorId.toString() !== creatorId.toString()) {
    const error = new Error('Access denied: not survey creator');
    error.code = 'ACCESS_DENIED';
    throw error;
  }

  if (survey.status !== 'active') {
    const error = new Error('Cannot send invitations to inactive survey');
    error.code = 'SURVEY_INACTIVE';
    throw error;
  }

  // Validate email array
  if (!Array.isArray(userEmails) || userEmails.length === 0) {
    const error = new Error('User emails array is required');
    error.code = 'MISSING_USER_EMAILS';
    throw error;
  }

  // Process each email
  const results = await Promise.all(
    userEmails.map(async (email) => {
      try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        
        if (!user) {
          return {
            email,
            success: false,
            error: 'User not found - user must be registered'
          };
        }

        // Prevent creator from inviting themselves
        if (user._id.toString() === creatorId.toString()) {
          return {
            email,
            success: false,
            error: 'Cannot invite yourself'
          };
        }

        // // Check for existing invitation
        // const existingInvitation = await Invitation.findOne({
        //   surveyId,
        //   userId: user._id
        // });
        //
        // if (existingInvitation) {
        //   return {
        //     email,
        //     success: false,
        //     error: 'User already invited to this survey'
        //   };
        // }



        // Create invitation
        const invitation = await Invitation.create({
          surveyId,
          creatorId,
          userId: user._id,
          status: 'sent'
        });

        // Log activity for invitation sent
        await activityService.logActivity({
          userId: user._id,
          surveyId,
          type: 'invitation_sent',
          message: `You were invited to survey "${survey.title}"`
        });

        return {
          email,
          success: true,
          invitationId: invitation._id,
          inviteLink: invitation.inviteLink,
          recipientName: user.name
        };

      } catch (error) {
        return {
          email,
          success: false,
          error: error.message
        };
      }
    })
  );

  // Summary statistics
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    summary: {
      total: userEmails.length,
      successful,
      failed
    },
    results
  };
};

// Get invitations received by user
// Get invitations received by user
exports.getUserReceivedInvitationsList = async (userId) => {
  try {
    console.log('Searching for invitations with userId:', userId);

    const invitations = await Invitation.find({creatorId: userId })
        .populate('surveyId', 'title status createdAt')
        .populate('creatorId', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    console.log('Found invitations:', invitations.length);

    return invitations.map(invitation => ({
      id: invitation._id,
      surveyTitle: invitation.surveyId?.title || 'Unknown Survey',
      creatorName: invitation.creatorId?.name || 'Unknown Creator',
      status: invitation.status,
      createdAt: invitation.createdAt,
      completedAt: invitation.completedAt,
      surveyLink: invitation.inviteLink,
      surveyStatus: invitation.surveyId?.status || 'unknown'
    }));
  } catch (error) {
    console.error('Error in getUserReceivedInvitationsList:', error);
    throw error;
  }
};


exports.getUserReceivedInvitationsListFromUser = async (userId) => {
  try {
    console.log('Searching for invitations with userId:', userId);

    const invitations = await Invitation.find({userId: userId })
        .populate('surveyId', 'title status createdAt')
        .populate('creatorId', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    console.log('Found invitations:', invitations.length);

    return invitations.map(invitation => ({
      id: invitation._id,
      surveyTitle: invitation.surveyId?.title || 'Unknown Survey',
      creatorName: invitation.creatorId?.name || 'Unknown Creator',
      status: invitation.status,
      createdAt: invitation.createdAt,
      completedAt: invitation.completedAt,
      surveyLink: invitation.inviteLink,
      surveyStatus: invitation.surveyId?.status || 'unknown'
    }));
  } catch (error) {
    console.error('Error in getUserReceivedInvitationsList:', error);
    throw error;
  }
};

exports.getUserReceivedInvitations = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      type = 'received', // 'received', 'sent', or 'all'
      status, // filter by invitation status
      surveyStatus, // filter by survey status
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (type === 'received') {
      filter.userId = userId;
    } else if (type === 'sent') {
      filter.creatorId = userId;
    } else if (type === 'all') {
      // For admin purposes, might need additional authorization
      filter.$or = [{ userId }, { creatorId: userId }];
    }

    // Add status filters if provided
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get invitations with pagination and filtering
    const invitations = await Invitation.find(filter)
        .populate('surveyId', 'title status createdAt')
        .populate('creatorId', 'name email')
        .populate('userId', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    // Get total count for pagination
    const totalCount = await Invitation.countDocuments(filter);

    // Format response
    const formattedInvitations = invitations.map(invitation => ({
      id: invitation._id,
      surveyTitle: invitation.surveyId?.title,
      creatorName: invitation.creatorId?.name,
      recipientName: invitation.userId?.name,
      status: invitation.status,
      createdAt: invitation.createdAt,
      completedAt: invitation.completedAt,
      surveyLink: invitation.inviteLink,
      surveyStatus: invitation.surveyId?.status,
      type: invitation.creatorId?._id.toString() === userId ? 'sent' : 'received'
    }));

    return res.json({
      invitations: formattedInvitations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get invitations error:', error);
    return res.status(500).json({ error: 'Failed to load invitations' });
  }
};

// Get invitations sent for a survey (for dashboard)
exports.getSurveyInvitations = async (surveyId, creatorId) => {
  // Verify survey ownership
  const survey = await Survey.findById(surveyId);
  if (!survey) {
    const error = new Error('Survey not found');
    error.code = 'SURVEY_NOT_FOUND';
    throw error;
  }

  if (survey.creatorId.toString() !== creatorId.toString()) {
    const error = new Error('Access denied: not survey creator');
    error.code = 'ACCESS_DENIED';
    throw error;
  }

  const invitations = await Invitation.find({ surveyId })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return invitations.map(invitation => ({
    id: invitation._id,
    recipientName: invitation.userId.name,
    recipientEmail: invitation.userId.email,
    status: invitation.status,
    sentAt: invitation.createdAt,
    completedAt: invitation.completedAt,
    inviteLink: invitation.inviteLink
  }));
};

// Validate invitation token and get survey access
exports.validateInvitationAccess = async (surveyId, token, userId) => {
  // Find invitation by token and survey
  const invitation = await Invitation.findOne({ 
    surveyId, 
    uniqueToken: token 
  })
  .populate('surveyId', 'title questions status')
  .populate('creatorId', 'name email')
  .lean();

  if (!invitation) {
    const error = new Error('Invalid or expired invitation token');
    error.code = 'INVALID_TOKEN';
    throw error;
  }

  // Check if survey is still active
  if (invitation.surveyId.status !== 'active') {
    const error = new Error('This survey is no longer active');
    error.code = 'SURVEY_INACTIVE';
    throw error;
  }

  // Verify the logged-in user matches the invitation recipient
  if (invitation.userId.toString() !== userId.toString()) {
    const error = new Error('This invitation was sent to a different user');
    error.code = 'ACCESS_DENIED';
    throw error;
  }

  // Check if already completed
  if (invitation.status === 'completed') {
    const error = new Error('You have already completed this survey');
    error.code = 'ALREADY_COMPLETED';
    throw error;
  }

  return {
    invitation: {
      id: invitation._id,
      status: invitation.status,
      createdAt: invitation.createdAt
    },
    survey: {
      id: invitation.surveyId._id,
      title: invitation.surveyId.title,
      questions: invitation.surveyId.questions,
      creatorName: invitation.creatorId.name
    }
  };
};

// Get invitation statistics for dashboard
exports.getInvitationStats = async (surveyId) => {
  // Convert surveyId to ObjectId for aggregation
  const mongoose = require('mongoose');
  const objectId = new mongoose.Types.ObjectId(surveyId);
  
  const stats = await Invitation.aggregate([
    { $match: { surveyId: objectId } },
    { 
      $group: {
        _id: '$surveyId',
        totalInvitations: { $sum: 1 },
        completedInvitations: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingInvitations: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalInvitations: 0,
      completedInvitations: 0,
      pendingInvitations: 0,
      responseRate: 0,
      responseCount: 0,
      completionRateResponses: 0
    };
  }

  const result = stats[0];
  const responseRate = result.totalInvitations > 0 
    ? Math.round((result.completedInvitations / result.totalInvitations) * 100)
    : 0;

  // Count actual responses stored for this survey (independent of invitation status)
  const responseCount = await Response.countDocuments({ surveyId: objectId });
  const completionRateResponses = result.totalInvitations > 0
    ? Math.round((responseCount / result.totalInvitations) * 100)
    : 0;

  return {
    totalInvitations: result.totalInvitations,
    completedInvitations: result.completedInvitations,
    pendingInvitations: result.pendingInvitations,
    responseRate,
    responseCount,
    completionRateResponses
  };
};
