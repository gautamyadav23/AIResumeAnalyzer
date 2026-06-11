const mongoose = require('mongoose');

const interviewQuestionsSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  company: {
    type: String,
    required: true
  },
  questions: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate caches
interviewQuestionsSchema.index({ resumeId: 1, company: 1 }, { unique: true });

const InterviewQuestions = mongoose.model('InterviewQuestions', interviewQuestionsSchema);
module.exports = InterviewQuestions;
