// models/Backup.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BackupSchema = new Schema({
  filename: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restoredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastRestored: {
    type: Date,
    default: null
  },
  size: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Backup', BackupSchema);