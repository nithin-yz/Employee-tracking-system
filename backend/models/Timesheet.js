const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  clockIn: {
    type: Date,
    required: true
  },
  clockOut: {
    type: Date,
    default: null
  },
  breakStart: {
    type: Date,
    default: null
  },
  breakEnd: {
    type: Date,
    default: null
  },
  totalHours: {
    type: Number,
    default: 0
  },
  regularHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate total hours when clock out
timesheetSchema.pre('save', function(next) {
  if (this.clockOut && this.clockIn) {
    const totalMs = this.clockOut - this.clockIn;
    const breakMs = this.breakStart && this.breakEnd ? this.breakEnd - this.breakStart : 0;
    this.totalHours = (totalMs - breakMs) / (1000 * 60 * 60); // Convert to hours
    
    // Calculate regular and overtime hours (assuming 8 hours is regular)
    if (this.totalHours > 8) {
      this.regularHours = 8;
      this.overtimeHours = this.totalHours - 8;
    } else {
      this.regularHours = this.totalHours;
      this.overtimeHours = 0;
    }
  }
  next();
});

// Index for efficient queries
timesheetSchema.index({ employee: 1, date: 1 });
timesheetSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('Timesheet', timesheetSchema);
