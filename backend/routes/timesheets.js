const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getTimesheets,
  getTimesheetById,
  createTimesheet,
  updateTimesheet,
  approveTimesheet,
  rejectTimesheet,
  getTeamTimesheets,
  getApprovedTimesheetsForPayroll,
  debugTimesheets
} = require('../controllers/timesheetController');

const router = express.Router();

// @route   GET /api/timesheets
// @desc    Get all timesheets
// @access  Private
router.get('/', auth, getTimesheets);

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

// @route   GET /api/timesheets/:id
// @desc    Get timesheet by ID
// @access  Private
router.get('/:id', auth, getTimesheetById);

// @route   POST /api/timesheets
// @desc    Create timesheet
// @access  Private
router.post('/', auth, [
  body('date').isISO8601().withMessage('Please provide a valid date'),
  body('clockIn').notEmpty().withMessage('Clock in time is required'),
  body('clockOut').notEmpty().withMessage('Clock out time is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], createTimesheet);

// @route   PUT /api/timesheets/:id
// @desc    Update timesheet
// @access  Private
router.put('/:id', auth, [
  body('date').optional().isISO8601().withMessage('Please provide a valid date'),
  body('clockIn').optional().notEmpty().withMessage('Clock in time cannot be empty'),
  body('clockOut').optional().notEmpty().withMessage('Clock out time cannot be empty'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], updateTimesheet);

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

module.exports = router;