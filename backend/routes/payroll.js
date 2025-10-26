const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll
} = require('../controllers/payrollController');

const router = express.Router();

// @route   GET /api/payroll
// @desc    Get all payrolls
// @access  Private (HR Admin)
router.get('/', auth, authorize('hr_admin'), getPayrolls);

// @route   GET /api/payroll/:id
// @desc    Get payroll by ID
// @access  Private (HR Admin)
router.get('/:id', auth, authorize('hr_admin'), getPayrollById);

// @route   POST /api/payroll
// @desc    Create payroll record for employee using ALL approved timesheets
// @access  Private (HR Admin)
router.post('/', auth, authorize('hr_admin'), [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('deductions.tax').optional().isNumeric().withMessage('Tax deduction must be a number'),
  body('deductions.insurance').optional().isNumeric().withMessage('Insurance deduction must be a number'),
  body('deductions.retirement').optional().isNumeric().withMessage('Retirement deduction must be a number'),
  body('deductions.other').optional().isNumeric().withMessage('Other deduction must be a number'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], createPayroll);

// @route   PUT /api/payroll/:id
// @desc    Update payroll
// @access  Private (HR Admin)
router.put('/:id', auth, authorize('hr_admin'), [
  body('deductions.tax').optional().isNumeric().withMessage('Tax deduction must be a number'),
  body('deductions.insurance').optional().isNumeric().withMessage('Insurance deduction must be a number'),
  body('deductions.retirement').optional().isNumeric().withMessage('Retirement deduction must be a number'),
  body('deductions.other').optional().isNumeric().withMessage('Other deduction must be a number'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('status').optional().isIn(['calculated', 'paid', 'cancelled']).withMessage('Invalid status')
], updatePayroll);

// @route   DELETE /api/payroll/:id
// @desc    Delete payroll
// @access  Private (HR Admin)
router.delete('/:id', auth, authorize('hr_admin'), deletePayroll);

module.exports = router;