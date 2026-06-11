const mongoose = require('mongoose');

const resumeChatsSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
    unique: true
  },
  messages: [
    {
      role: {
        type: String,
        required: true,
        enum: ['user', 'assistant']
      },
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ResumeChats = mongoose.model('ResumeChats', resumeChatsSchema);
module.exports = ResumeChats;
