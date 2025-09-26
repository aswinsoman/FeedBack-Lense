const mongoose = require('mongoose');

// Response schema for storing survey submissions
const responseSchema = new mongoose.Schema({
  surveyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Survey', 
    required: true 
  },
  respondentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  invitationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Invitation', 
    required: true 
  },
  responses: [{
    questionId: { 
      type: String, 
      required: true 
    },
    questionText: { 
      type: String, 
      required: true 
    },
    answer: { 
      type: String, 
      required: true, 
      maxlength: 500 
    },
    answeredAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  completionTime: { 
    type: Number, 
    required: true 
  }, // seconds taken to complete
  submittedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for analytics queries
responseSchema.index({ surveyId: 1, submittedAt: -1 });
responseSchema.index({ respondentId: 1 });

// Ensure one response per invitation
responseSchema.index({ invitationId: 1 }, { unique: true });

module.exports = mongoose.model('Response', responseSchema);