const { validationResult } = require('express-validator');
const Leave = require('../models/Leave');
const User = require('../models/User');

// @desc    Get all leaves
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, status, leaveType } = req.query;
    
    let query = {};
    
    // If not HR admin, only show own leaves
    if (req.user.role !== 'hr_admin') {
      query.employee = req.user.id;
    }
    
    if (startDate && endDate) {
      query.$or = [
        {
          startDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
        },
        {
          endDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (leaveType) {
      query.leaveType = leaveType;
    }

    const leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Leave.countDocuments(query);

    res.json({
      leaves,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get leave by ID
// @route   GET /api/leaves/:id
// @access  Private
const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName');
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check authorization
    if (req.user.role !== 'hr_admin' && leave.employee._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this leave request' });
    }

    res.json(leave);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create leave request
// @route   POST /api/leaves
// @access  Private
const createLeave = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { leaveType, startDate, endDate, reason, totalDays } = req.body;

    const leave = new Leave({
      employee: req.user.id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      totalDays,
      status: 'pending'
    });

    await leave.save();
    await leave.populate('employee', 'firstName lastName employeeId department');

    res.status(201).json(leave);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update leave request
// @route   PUT /api/leaves/:id
// @access  Private
const updateLeave = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check authorization
    if (req.user.role !== 'hr_admin' && leave.employee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this leave request' });
    }

    // Update fields
    leave.leaveType = leaveType || leave.leaveType;
    leave.startDate = startDate ? new Date(startDate) : leave.startDate;
    leave.endDate = endDate ? new Date(endDate) : leave.endDate;
    leave.reason = reason || leave.reason;

    await leave.save();
    await leave.populate('employee', 'firstName lastName employeeId department');

    res.json(leave);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve leave request
// @route   PUT /api/leaves/:id/approve
// @access  Private (Manager, HR Admin)
const approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Manager can approve any leave (one manager for all employees)
    console.log('Manager approving leave:', leave._id);

    leave.status = 'approved';
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();

    await leave.save();
    await leave.populate('employee', 'firstName lastName employeeId department');
    await leave.populate('approvedBy', 'firstName lastName');

    res.json(leave);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject leave request
// @route   PUT /api/leaves/:id/reject
// @access  Private (Manager, HR Admin)
const rejectLeave = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Manager can reject any leave (one manager for all employees)
    console.log('Manager rejecting leave:', leave._id);

    leave.status = 'rejected';
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    leave.rejectionReason = req.body.rejectionReason;

    await leave.save();
    await leave.populate('employee', 'firstName lastName employeeId department');
    await leave.populate('approvedBy', 'firstName lastName');

    res.json(leave);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get team leaves (managers only)
// @route   GET /api/leaves/team-leaves
// @access  Private (Manager, HR Admin)
const getTeamLeaves = async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // If manager, show all pending leaves (one manager for all employees)
    if (req.user.role === 'manager') {
      console.log('Manager accessing all pending leaves');
      console.log('Manager user:', req.user);
      query.status = 'pending'; // Only show pending leaves
    }
    
    if (startDate && endDate) {
      query.$or = [
        {
          startDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
        },
        {
          endDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      ];
    }
    
    // Only apply status filter if not already set by manager role
    if (status && !query.status) {
      query.status = status;
    }

    console.log('Final leaves query:', query);
    const leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Leave.countDocuments(query);

    res.json({
      leaves,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get team calendar (approved leaves)
// @route   GET /api/leaves/calendar
// @access  Private (Manager, HR Admin)
const getTeamCalendar = async (req, res) => {
  try {
    let query = { status: 'approved' };
    
    // If manager, show all approved leaves (one manager for all employees)
    if (req.user.role === 'manager') {
      console.log('Manager accessing all approved leaves for calendar');
    }

    const leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ startDate: 1 });

    res.json(leaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  approveLeave,
  rejectLeave,
  getTeamLeaves,
  getTeamCalendar
};
