const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getLeaves,
  createLeave,
  approveLeave,
  rejectLeave,
  deleteLeave,
  getTeamLeaves,
  getTeamCalendar
} = require('../controllers/leaveController');

const router = express.Router();

// @route   GET /api/leaves/team-leaves
// @desc    Get team leaves (managers only)
// @access  Private (Manager, HR Admin)
router.get('/team-leaves', auth, authorize('manager', 'hr_admin'), getTeamLeaves);

// @route   GET /api/leaves/calendar
// @desc    Get team calendar (approved leaves)
// @access  Private (Manager, HR Admin)
router.get('/calendar', auth, authorize('manager', 'hr_admin'), getTeamCalendar);

// @route   GET /api/leaves/my-leaves
// @desc    Get current user's leave requests
// @access  Private
router.get('/my-leaves', auth, getLeaves);

// @route   POST /api/leaves
// @desc    Create leave request
// @access  Private
router.post('/', auth, [
  body('leaveType').isIn(['sick', 'vacation', 'personal', 'maternity', 'paternity', 'bereavement', 'other']).withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('Please provide a valid start date'),
  body('endDate').isISO8601().withMessage('Please provide a valid end date'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('totalDays').optional().isNumeric().withMessage('Total days must be a number')
], createLeave);

// @route   PUT /api/leaves/:id/approve
// @desc    Approve leave request
// @access  Private (Manager, HR Admin)
router.put('/:id/approve', auth, authorize('manager', 'hr_admin'), approveLeave);

// @route   PUT /api/leaves/:id/reject
// @desc    Reject leave request
// @access  Private (Manager, HR Admin)
router.put('/:id/reject', auth, authorize('manager', 'hr_admin'), [
  body('rejectionReason').notEmpty().withMessage('Rejection reason is required')
], rejectLeave);

// @route   DELETE /api/leaves/:id
// @desc    Delete leave request
// @access  Private
router.delete('/:id', auth, deleteLeave);

module.exports = router;