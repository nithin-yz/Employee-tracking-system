const { validationResult } = require('express-validator');
const Timesheet = require('../models/Timesheet');
const User = require('../models/User');

// @desc    Get all timesheets
// @route   GET /api/timesheets
// @access  Private
const getTimesheets = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, status, employeeId } = req.query;
    
    let query = {};
    
    // If not HR admin, only show own timesheets
    if (req.user.role !== 'hr_admin') {
      query.employee = req.user.id;
    } else if (employeeId) {
      query.employee = employeeId;
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }

    const timesheets = await Timesheet.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Timesheet.countDocuments(query);

    res.json({
      timesheets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get timesheet by ID
// @route   GET /api/timesheets/:id
// @access  Private
const getTimesheetById = async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName');
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check authorization
    if (req.user.role !== 'hr_admin' && timesheet.employee._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this timesheet' });
    }

    res.json(timesheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create timesheet
// @route   POST /api/timesheets
// @access  Private
const createTimesheet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, clockIn, clockOut, breakStart, breakEnd, notes } = req.body;

    // Calculate hours
    const clockInTime = new Date(`${date}T${clockIn}`);
    const clockOutTime = new Date(`${date}T${clockOut}`);
    const breakStartTime = breakStart ? new Date(`${date}T${breakStart}`) : null;
    const breakEndTime = breakEnd ? new Date(`${date}T${breakEnd}`) : null;

    let totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
    let breakHours = 0;

    if (breakStartTime && breakEndTime) {
      breakHours = (breakEndTime - breakStartTime) / (1000 * 60 * 60);
      totalHours -= breakHours;
    }

    const regularHours = Math.min(totalHours, 8);
    const overtimeHours = Math.max(totalHours - 8, 0);

    const timesheet = new Timesheet({
      employee: req.user.id,
      date: new Date(date),
      clockIn: clockInTime,
      clockOut: clockOutTime,
      breakStart: breakStartTime,
      breakEnd: breakEndTime,
      totalHours,
      regularHours,
      overtimeHours,
      breakHours,
      notes,
      status: 'pending'
    });

    await timesheet.save();
    await timesheet.populate('employee', 'firstName lastName employeeId department');

    res.status(201).json(timesheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update timesheet
// @route   PUT /api/timesheets/:id
// @access  Private
const updateTimesheet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, clockIn, clockOut, breakStart, breakEnd, notes } = req.body;

    const timesheet = await Timesheet.findById(req.params.id);
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check authorization
    if (req.user.role !== 'hr_admin' && timesheet.employee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this timesheet' });
    }

    // Calculate hours
    const clockInTime = new Date(`${date}T${clockIn}`);
    const clockOutTime = new Date(`${date}T${clockOut}`);
    const breakStartTime = breakStart ? new Date(`${date}T${breakStart}`) : null;
    const breakEndTime = breakEnd ? new Date(`${date}T${breakEnd}`) : null;

    let totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
    let breakHours = 0;

    if (breakStartTime && breakEndTime) {
      breakHours = (breakEndTime - breakStartTime) / (1000 * 60 * 60);
      totalHours -= breakHours;
    }

    const regularHours = Math.min(totalHours, 8);
    const overtimeHours = Math.max(totalHours - 8, 0);

    // Update fields
    timesheet.date = new Date(date);
    timesheet.clockIn = clockInTime;
    timesheet.clockOut = clockOutTime;
    timesheet.breakStart = breakStartTime;
    timesheet.breakEnd = breakEndTime;
    timesheet.totalHours = totalHours;
    timesheet.regularHours = regularHours;
    timesheet.overtimeHours = overtimeHours;
    timesheet.breakHours = breakHours;
    timesheet.notes = notes;

    await timesheet.save();
    await timesheet.populate('employee', 'firstName lastName employeeId department');

    res.json(timesheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve timesheet
// @route   PUT /api/timesheets/:id/approve
// @access  Private (Manager, HR Admin)
const approveTimesheet = async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Manager can approve any timesheet (one manager for all employees)
    console.log('Manager approving timesheet:', timesheet._id);

    timesheet.status = 'approved';
    timesheet.approvedBy = req.user.id;
    timesheet.approvedAt = new Date();

    await timesheet.save();
    await timesheet.populate('employee', 'firstName lastName employeeId department');
    await timesheet.populate('approvedBy', 'firstName lastName');

    res.json(timesheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject timesheet
// @route   PUT /api/timesheets/:id/reject
// @access  Private (Manager, HR Admin)
const rejectTimesheet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const timesheet = await Timesheet.findById(req.params.id);
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Manager can reject any timesheet (one manager for all employees)
    console.log('Manager rejecting timesheet:', timesheet._id);

    timesheet.status = 'rejected';
    timesheet.approvedBy = req.user.id;
    timesheet.approvedAt = new Date();
    timesheet.rejectionReason = req.body.rejectionReason;

    await timesheet.save();
    await timesheet.populate('employee', 'firstName lastName employeeId department');
    await timesheet.populate('approvedBy', 'firstName lastName');

    res.json(timesheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get team timesheets (managers only)
// @route   GET /api/timesheets/team-timesheets
// @access  Private (Manager, HR Admin)
const getTeamTimesheets = async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // If manager, show all pending timesheets (one manager for all employees)
    if (req.user.role === 'manager') {
      console.log('Manager accessing all pending timesheets');
      console.log('Manager user:', req.user);
      query.status = 'pending'; // Only show pending timesheets
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Only apply status filter if not already set by manager role
    if (status && !query.status) {
      query.status = status;
    }

    console.log('Final timesheets query:', query);
    const timesheets = await Timesheet.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('Found timesheets:', timesheets.length);
    const total = await Timesheet.countDocuments(query);
    console.log('Total timesheets matching query:', total);

    res.json({
      timesheets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get approved timesheets ready for payroll
// @route   GET /api/timesheets/approved-for-payroll
// @access  Private (HR Admin)
const getApprovedTimesheetsForPayroll = async (req, res) => {
  try {
    console.log('Approved for payroll endpoint called by:', req.user.role);
    
    // Get all payroll records to find which timesheets are already processed
    const Payroll = require('../models/Payroll');
    const existingPayrolls = await Payroll.find({});
    
    // Extract all timesheet IDs that are already in payroll records
    const processedTimesheetIds = existingPayrolls.flatMap(payroll => payroll.timesheets || []);
    
    console.log('Processed timesheet IDs:', processedTimesheetIds);
    
    // Find approved timesheets that are NOT already in payroll records
    const timesheets = await Timesheet.find({ 
      status: 'approved',
      _id: { $nin: processedTimesheetIds } // Exclude timesheets already processed
    })
      .populate('employee', 'firstName lastName hourlyRate department')
      .sort({ date: -1 });

    console.log('Found approved timesheets ready for payroll:', timesheets.length);
    res.json({ timesheets });
  } catch (error) {
    console.error('Error in approved-for-payroll endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Debug timesheets endpoint
// @route   GET /api/timesheets/debug
// @access  Private (HR Admin)
const debugTimesheets = async (req, res) => {
  try {
    const allTimesheets = await Timesheet.find({})
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ date: -1 });
    
    console.log('All timesheets in database:', allTimesheets.length);
    
    // Get only pending timesheets
    const pendingTimesheets = await Timesheet.find({ status: 'pending' })
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ date: -1 });
    
    console.log('Pending timesheets in database:', pendingTimesheets.length);
    
    res.json({
      allTimesheets: allTimesheets.length,
      pendingTimesheets: pendingTimesheets.length,
      allTimesheetsData: allTimesheets,
      pendingTimesheetsData: pendingTimesheets
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getTimesheets,
  getTimesheetById,
  createTimesheet,
  updateTimesheet,
  approveTimesheet,
  rejectTimesheet,
  getTeamTimesheets,
  getApprovedTimesheetsForPayroll,
  debugTimesheets
};
