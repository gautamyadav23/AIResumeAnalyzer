const mongoose = require('mongoose');

const jobAnalysisSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  jobDescriptionHash: {
    type: String,
    required: true
  },
  analysis: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index to search cached matching analyses fast
jobAnalysisSchema.index({ resumeId: 1, jobDescriptionHash: 1 }, { unique: true });

const JobAnalysis = mongoose.model('JobAnalysis', jobAnalysisSchema);
module.exports = JobAnalysis;
