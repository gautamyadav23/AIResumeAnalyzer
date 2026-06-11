const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Resume must belong to a user']
  },
  fileName: {
    type: String,
    required: [true, 'Please provide the file name']
  },
  filePath: {
    type: String,
    required: [true, 'Please provide the file path']
  },
  extractedText: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['uploaded', 'parsed', 'analyzed'],
    default: 'uploaded'
  },
  parsedData: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    skills: { type: [String], default: [] },
    education: { type: [mongoose.Schema.Types.Mixed], default: [] },
    projects: { type: [mongoose.Schema.Types.Mixed], default: [] },
    certifications: { type: [String], default: [] },
    experience: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  atsScore: {
    type: Number,
    default: 0
  },
  skillsScore: {
    type: Number,
    default: 0
  },
  educationScore: {
    type: Number,
    default: 0
  },
  experienceScore: {
    type: Number,
    default: 0
  },
  formattingScore: {
    type: Number,
    default: 0
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
