const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getTimesheets,
  approveTimesheet,
  rejectTimesheet,
  getTeamTimesheets,
  getApprovedTimesheetsForPayroll,
  debugTimesheets,
  getCurrentStatus,
  clockIn,
  clockOut,
  breakStart,
  breakEnd
} = require('../controllers/timesheetController');

const router = express.Router();

// @route   GET /api/timesheets/team-timesheets
// @desc    Get team timesheets (managers only)
// @access  Private (Manager, HR Admin)
router.get('/team-timesheets', auth, authorize('manager', 'hr_admin'), getTeamTimesheets);

// @route   GET /api/timesheets/approved-for-payroll
// @desc    Get approved timesheets ready for payroll processing
// @access  Private (HR Admin)
router.get('/approved-for-payroll', auth, authorize('hr_admin'), getApprovedTimesheetsForPayroll);

// @route   GET /api/timesheets/debug
// @desc    Debug timesheets endpoint
// @access  Private (HR Admin)
router.get('/debug', auth, authorize('hr_admin'), debugTimesheets);

// @route   GET /api/timesheets/my-timesheets
// @desc    Get current user's timesheets
// @access  Private
router.get('/my-timesheets', auth, getTimesheets);

// @route   GET /api/timesheets/current-status
// @desc    Get current clock status for employee
// @access  Private
router.get('/current-status', auth, getCurrentStatus);

// @route   PUT /api/timesheets/:id/approve
// @desc    Approve timesheet
// @access  Private (Manager, HR Admin)
router.put('/:id/approve', auth, authorize('manager', 'hr_admin'), approveTimesheet);

// @route   PUT /api/timesheets/:id/reject
// @desc    Reject timesheet
// @access  Private (Manager, HR Admin)
router.put('/:id/reject', auth, authorize('manager', 'hr_admin'), [
  body('rejectionReason').notEmpty().withMessage('Rejection reason is required')
], rejectTimesheet);

// @route   POST /api/timesheets/clock-in
// @desc    Clock in for the day
// @access  Private
router.post('/clock-in', auth, clockIn);

// @route   PUT /api/timesheets/clock-out
// @desc    Clock out for the day
// @access  Private
router.put('/clock-out', auth, clockOut);

// @route   PUT /api/timesheets/break-start
// @desc    Start break
// @access  Private
router.put('/break-start', auth, breakStart);

// @route   PUT /api/timesheets/break-end
// @desc    End break
// @access  Private
router.put('/break-end', auth, breakEnd);

module.exports = router;