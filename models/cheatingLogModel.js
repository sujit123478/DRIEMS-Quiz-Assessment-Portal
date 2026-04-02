const mongoose = require('mongoose');

const cheatingLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'exams',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CheatingLog = mongoose.model('cheatinglogs', cheatingLogSchema);
module.exports = CheatingLog;
