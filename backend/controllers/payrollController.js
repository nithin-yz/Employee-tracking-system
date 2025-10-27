const { validationResult } = require('express-validator');
const Payroll = require('../models/Payroll');
const Timesheet = require('../models/Timesheet');
const User = require('../models/User');

// @desc    Get all payrolls
// @route   GET /api/payroll
// @access  Private (HR Admin)
const getPayrolls = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, employeeId } = req.query;
    
    let query = {};
    
    if (employeeId) {
      query.employee = employeeId;
    }
    
    if (startDate && endDate) {
      query['payPeriod.startDate'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payrolls = await Payroll.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('timesheets')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payroll.countDocuments(query);

    res.json({
      payrolls,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get payroll by ID
// @route   GET /api/payroll/:id
// @access  Private (HR Admin)
const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('timesheets');
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    res.json(payroll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create payroll record for employee using ALL approved timesheets
// @route   POST /api/payroll
// @access  Private (HR Admin)
const createPayroll = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId, deductions = {}, notes } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get ALL approved timesheets for this employee (no date range)
    const timesheets = await Timesheet.find({
      employee: employeeId,
      status: 'approved'
    });

    console.log(`Found ${timesheets.length} approved timesheets for employee ${employeeId}`);
    timesheets.forEach(ts => {
      console.log(`- Date: ${ts.date}, Hours: ${ts.totalHours}, Status: ${ts.status}`);
    });

    if (timesheets.length === 0) {
      return res.status(400).json({ message: 'No approved timesheets found for this employee' });
    }

    // Calculate totals
    const totalRegularHours = timesheets.reduce((sum, ts) => sum + (ts.regularHours || 0), 0);
    const totalOvertimeHours = timesheets.reduce((sum, ts) => sum + (ts.overtimeHours || 0), 0);
    const regularPay = totalRegularHours * employee.hourlyRate;
    const overtimePay = totalOvertimeHours * (employee.hourlyRate * 1.5);
    const grossPay = regularPay + overtimePay;

    // Use provided deductions or calculate defaults
    const finalDeductions = {
      tax: deductions.tax || grossPay * 0.15,
      insurance: deductions.insurance || grossPay * 0.05,
      retirement: deductions.retirement || grossPay * 0.03,
      other: deductions.other || 0,
      total: 0
    };
    finalDeductions.total = finalDeductions.tax + finalDeductions.insurance + 
                           finalDeductions.retirement + finalDeductions.other;

    const netPay = grossPay - finalDeductions.total;

    // Calculate pay period based on timesheet dates
    const timesheetDates = timesheets.map(ts => new Date(ts.date));
    const payPeriodStart = new Date(Math.min(...timesheetDates));
    const payPeriodEnd = new Date(Math.max(...timesheetDates));

    const payroll = new Payroll({
      employee: employeeId,
      payPeriod: {
        startDate: payPeriodStart,
        endDate: payPeriodEnd
      },
      timesheets: timesheets.map(ts => ts._id),
      totalRegularHours,
      totalOvertimeHours,
      regularPay,
      overtimePay,
      grossPay,
      deductions: finalDeductions,
      netPay,
      notes,
      status: 'calculated'
    });

    await payroll.save();
    await payroll.populate('employee', 'firstName lastName employeeId');

    res.status(201).json(payroll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update payroll
// @route   PUT /api/payroll/:id
// @access  Private (HR Admin)
const updatePayroll = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { deductions, notes, status } = req.body;

    const payroll = await Payroll.findById(req.params.id);
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    // Update fields
    if (deductions) {
      payroll.deductions = { ...payroll.deductions, ...deductions };
      payroll.deductions.total = payroll.deductions.tax + payroll.deductions.insurance + 
                                payroll.deductions.retirement + payroll.deductions.other;
      payroll.netPay = payroll.grossPay - payroll.deductions.total;
    }
    
    if (notes !== undefined) {
      payroll.notes = notes;
    }
    
    if (status) {
      payroll.status = status;
    }

    await payroll.save();
    await payroll.populate('employee', 'firstName lastName employeeId department');

    res.json(payroll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete payroll
// @route   DELETE /api/payroll/:id
// @access  Private (HR Admin)
const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    await Payroll.findByIdAndDelete(req.params.id);

    res.json({ message: 'Payroll deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll
};
