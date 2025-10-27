const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  timesheets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timesheet'
  }],
  totalRegularHours: {
    type: Number,
    default: 0
  },
  totalOvertimeHours: {
    type: Number,
    default: 0
  },
  regularPay: {
    type: Number,
    default: 0
  },
  overtimePay: {
    type: Number,
    default: 0
  },
  grossPay: {
    type: Number,
    default: 0
  },
  deductions: {
    tax: {
      type: Number,
      default: 0
    },
    insurance: {
      type: Number,
      default: 0
    },
    retirement: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  netPay: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'calculated', 'approved', 'paid'],
    default: 'calculated'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['direct_deposit', 'check', 'cash'],
    default: 'direct_deposit'
  },
  bankDetails: {
    accountNumber: String,
    routingNumber: String,
    bankName: String
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate payroll amounts
payrollSchema.pre('save', function(next) {
  // Calculate regular pay
  this.regularPay = this.totalRegularHours * this.employee.hourlyRate;
  
  // Calculate overtime pay (1.5x rate)
  this.overtimePay = this.totalOvertimeHours * (this.employee.hourlyRate * 1.5);
  
  // Calculate gross pay
  this.grossPay = this.regularPay + this.overtimePay;
  
  // Calculate total deductions
  this.deductions.total = this.deductions.tax + this.deductions.insurance + 
                         this.deductions.retirement + this.deductions.other;
  
  // Calculate net pay
  this.netPay = this.grossPay - this.deductions.total;
  
  next();
});

// Index for efficient queries
payrollSchema.index({ employee: 1, 'payPeriod.startDate': 1, 'payPeriod.endDate': 1 });
payrollSchema.index({ status: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);
