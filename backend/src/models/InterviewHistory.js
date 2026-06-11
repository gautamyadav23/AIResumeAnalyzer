const mongoose = require('mongoose');

const interviewHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Interview history must belong to a user']
  },
  company: {
    type: String,
    required: [true, 'Please provide the company name']
  },
  interviewType: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text'
  },
  date: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    required: [true, 'Please provide the overall score']
  },
  categoryScores: {
    technical: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
    hr: { type: Number, default: 0 },
    communication: { type: Number, default: 0 }
  },
  weakAreas: {
    type: [String],
    default: []
  },
  strengths: {
    type: [String],
    default: []
  },
  recommendations: {
    type: [String],
    default: []
  }
});

const InterviewHistory = mongoose.model('InterviewHistory', interviewHistorySchema);

module.exports = InterviewHistory;
