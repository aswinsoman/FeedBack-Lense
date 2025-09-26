const mongoose = require('mongoose');

// Survey schema for storing CSV-based surveys
const surveySchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 100 
  },
  creatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  questions: [{
    questionId: { 
      type: String, 
      required: true 
    },
    questionText: { 
      type: String, 
      required: true, 
      maxlength: 200 
    },
    // Optional question type for rendering (defaults to 'text' on frontend if absent)
    type: {
      type: String,
      enum: ['text', 'likert', 'multiple-choice'],
      required: false
    },
    // Optional options for multiple-choice questions
    options: {
      type: [String],
      required: false,
      default: undefined
    }
  }],
  csvMetadata: {
    originalFilename: { 
      type: String, 
      required: true 
    },
    uploadedAt: { 
      type: Date, 
      default: Date.now 
    },
    rowCount: { 
      type: Number, 
      required: true 
    }
  },
  status: { 
    type: String, 
    enum: ['active', 'closed'], 
    default: 'active' 
  },
  endDate: {
    type: Date,
    default: null // Optional end date for surveys
  }
}, { 
  timestamps: true 
});

// Index for faster queries
surveySchema.index({ creatorId: 1, createdAt: -1 });
surveySchema.index({ status: 1 });

// Validation: Max 20 questions per survey
surveySchema.pre('save', function(next) {
  if (this.questions.length > 20) {
    const error = new Error('Maximum 20 questions allowed per survey');
    error.code = 'MAX_QUESTIONS_EXCEEDED';
    return next(error);
  }
  
  // Ensure question IDs are unique within survey
  const questionIds = this.questions.map(q => q.questionId);
  const uniqueIds = [...new Set(questionIds)];
  if (questionIds.length !== uniqueIds.length) {
    const error = new Error('Question IDs must be unique within survey');
    error.code = 'DUPLICATE_QUESTION_IDS';
    return next(error);
  }
  
  // Auto-close survey if end date has passed
  if (this.endDate && new Date() > this.endDate && this.status === 'active') {
    console.log(`Auto-closing survey ${this._id} - end date reached`);
    this.status = 'closed';
  }
  
  next();
});

// Method to check if survey is expired
surveySchema.methods.isExpired = function() {
  return this.endDate && new Date() > this.endDate;
};

// Method to get effective status (considering end date)
surveySchema.methods.getEffectiveStatus = function() {
  if (this.isExpired()) {
    return 'expired';
  }
  return this.status;
};

// Virtual for days remaining until end date
surveySchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const timeDiff = this.endDate - now;
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return daysDiff > 0 ? daysDiff : 0;
});

module.exports = mongoose.model('Survey', surveySchema);