const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Invitation schema for survey access tokens
const invitationSchema = new mongoose.Schema({
  surveyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Survey', 
    required: true 
  },
  creatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  uniqueToken: { 
    type: String, 
    required: true, 
    default: function() {
      return uuidv4();
    }
  },
  inviteLink: { 
    type: String 
    // Removed required: true - will be auto-generated
  },
  status: { 
    type: String, 
    enum: ['sent', 'completed'], 
    default: 'sent' 
  },
  completedAt: { 
    type: Date 
  }
}, { 
  timestamps: true 
});

// Indexes for performance
invitationSchema.index({ surveyId: 1 });
invitationSchema.index({ uniqueToken: 1 }, { unique: true });
invitationSchema.index({ userId: 1 });
invitationSchema.index({ creatorId: 1 });

// Compound index to prevent duplicate invitations
invitationSchema.index({ surveyId: 1, userId: 1 }, { unique: true });

// Generate invite link before saving
invitationSchema.pre('save', function(next) {
  // Always generate invite link using the token
  this.inviteLink = `/survey/${this.surveyId}?token=${this.uniqueToken}`;
  next();
});

// Method to mark invitation as completed
invitationSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Invitation', invitationSchema);
