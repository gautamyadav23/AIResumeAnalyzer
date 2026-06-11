const mongoose = require('mongoose');

const resumeInsightsSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
    unique: true
  },
  insights: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ResumeInsights = mongoose.model('ResumeInsights', resumeInsightsSchema);
module.exports = ResumeInsights;
