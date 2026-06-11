const mongoose = require('mongoose');

const learningRoadmapsSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  skill: {
    type: String,
    required: true
  },
  roadmap: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

learningRoadmapsSchema.index({ resumeId: 1, skill: 1 }, { unique: true });

const LearningRoadmaps = mongoose.model('LearningRoadmaps', learningRoadmapsSchema);
module.exports = LearningRoadmaps;
