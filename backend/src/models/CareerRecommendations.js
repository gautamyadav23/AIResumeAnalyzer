const mongoose = require('mongoose');

const careerRecommendationsSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
    unique: true
  },
  roles: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CareerRecommendations = mongoose.model('CareerRecommendations', careerRecommendationsSchema);
module.exports = CareerRecommendations;
