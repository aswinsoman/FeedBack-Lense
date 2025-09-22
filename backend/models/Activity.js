const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  surveyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey' },
  type: { type: String, enum: ['invitation_sent', 'response_submitted', 'survey_completed'], required: true },
  message: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);