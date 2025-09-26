//Survey Response Service
//Author: Aswin and Suong Ngo

const Response = require('../models/Response');
const Invitation = require('../models/Invitation');
const mongoose = require('mongoose');
const activityService = require('./activityService'); // Add this at the top
const Survey = require('../models/Survey'); // For survey title in activity
const User = require('../models/User'); // Add this at the top if not already

// Function to save a survey response
async function saveSurveyResponse(data) {
  try {
    console.log('Received response data:', JSON.stringify(data));
    
    // Validate required fields
    if (!data.surveyId) {
      throw new Error('Survey ID is required');
    }

    if (!data.responses || !Array.isArray(data.responses) || data.responses.length === 0) {
      throw new Error('Survey responses are required');
    }

    // Make sure we're working with valid ObjectIds
    try {
      // Convert surveyId to valid ObjectId
      if (data.surveyId && typeof data.surveyId === 'string') {
        data.surveyId = mongoose.Types.ObjectId.createFromHexString(data.surveyId);
      } else if (!mongoose.Types.ObjectId.isValid(data.surveyId)) {
        // Use a valid placeholder ObjectId if needed
        data.surveyId = new mongoose.Types.ObjectId('000000000000000000000000');
      }
      
      // Convert respondentId to valid ObjectId or use placeholder
      if (data.respondentId && typeof data.respondentId === 'string') {
        if (mongoose.Types.ObjectId.isValid(data.respondentId)) {
          data.respondentId = mongoose.Types.ObjectId.createFromHexString(data.respondentId);
        } else {
          data.respondentId = new mongoose.Types.ObjectId('000000000000000000000000');
        }
      } else {
        data.respondentId = new mongoose.Types.ObjectId('000000000000000000000000');
      }

      // Convert invitationId to valid ObjectId or use placeholder
      if (data.invitationId && typeof data.invitationId === 'string') {
        if (mongoose.Types.ObjectId.isValid(data.invitationId)) {
          data.invitationId = mongoose.Types.ObjectId.createFromHexString(data.invitationId);
        } else {
          // If it's not valid, create a unique ObjectId based on timestamp
          data.invitationId = new mongoose.Types.ObjectId();
        }
      } else {
        data.invitationId = new mongoose.Types.ObjectId();
      }
    } catch (err) {
      console.error('Error converting IDs to ObjectId:', err);
      // Fallback to new ObjectIds if conversion fails
      data.surveyId = new mongoose.Types.ObjectId(data.surveyId || '000000000000000000000000');
      data.respondentId = new mongoose.Types.ObjectId('000000000000000000000000');
      data.invitationId = new mongoose.Types.ObjectId();
    }
    
    // Log the prepared data
    console.log('Prepared response data:', JSON.stringify({
      surveyId: data.surveyId.toString(),
      respondentId: data.respondentId.toString(),
      invitationId: data.invitationId.toString()
    }));
    
    // Create and save the response
    const response = new Response(data);
    await response.save();
    console.log('Response saved successfully with ID:', response._id);

    // Update invitation status to 'completed' if invitationId is valid
    if (data.invitationId && mongoose.Types.ObjectId.isValid(data.invitationId)) {
      try {
        const updateResult = await Invitation.findByIdAndUpdate(
          data.invitationId,
          {
            status: 'completed',
            completedAt: new Date()
          },
          { new: true }
        );
        if (updateResult) {
          console.log('Invitation status updated to completed for invitation ID:', data.invitationId.toString());
        } else {
          console.log('Invitation not found for ID:', data.invitationId.toString());
          // Try to find invitation by surveyId and respondentId
          await Invitation.findOneAndUpdate(
            {
              surveyId: data.surveyId,
              userId: data.respondentId,
              status: 'sent'
            },
            {
              status: 'completed',
              completedAt: new Date()
            },
            { new: true }
          );
        }
      } catch (invitationUpdateError) {
        console.error('Error updating invitation status:', invitationUpdateError);
        // Try alternative method
        await Invitation.findOneAndUpdate(
          {
            surveyId: data.surveyId,
            userId: data.respondentId,
            status: 'sent'
          },
          {
            status: 'completed',
            completedAt: new Date()
          },
          { new: true }
        );
      }
    } else {
      // If no valid invitationId, try to find invitation by surveyId and respondentId
      await Invitation.findOneAndUpdate(
        {
          surveyId: data.surveyId,
          userId: data.respondentId,
          status: 'sent'
        },
        {
          status: 'completed',
          completedAt: new Date()
        },
        { new: true }
      );
    }
    
    // Log activity for response submitted
    try {
      // Fetch survey for title (optional, for better activity message)
      let surveyTitle = '';
      if (data.surveyId) {
        const survey = await Survey.findById(data.surveyId).select('title');
        surveyTitle = survey ? survey.title : '';
      }
      // Fetch respondent's username
      let username = '';
      if (data.respondentId) {
        const user = await User.findById(data.respondentId).select('name');
        username = user ? user.name : '';
      }
      await activityService.logActivity({
        userId: data.respondentId,
        surveyId: data.surveyId,
        type: 'response_submitted',
        message: `${username} submitted survey response${surveyTitle ? ` to "${surveyTitle}"` : ''}`
      });
    } catch (activityErr) {
      console.error('Failed to log activity for response:', activityErr);
    }
    return response;
  } catch (error) {
    console.error('Error saving survey response:', error);
    throw new Error('Error saving survey response: ' + error.message);
  }
}

// Helper function to update invitation status by surveyId and userId
async function updateInvitationBySurveyAndUser(surveyId, userId) {
  try {
    const invitation = await Invitation.findOneAndUpdate(
      { 
        surveyId: surveyId,
        userId: userId,
        status: 'sent' // Only update if still 'sent'
      },
      { 
        status: 'completed',
        completedAt: new Date()
      },
      { new: true }
    );
    
    if (invitation) {
      console.log('Invitation status updated to completed for survey:', surveyId.toString(), 'user:', userId.toString());
    } else {
      console.log('No pending invitation found for survey:', surveyId.toString(), 'user:', userId.toString());
    }
  } catch (error) {
    console.error('Error updating invitation by survey and user:', error);
    // Don't throw error - this is a best-effort update
  }
}

module.exports = {
  saveSurveyResponse,
  updateInvitationBySurveyAndUser
};