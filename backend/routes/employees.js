const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const { 
  getEmployees, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee 
} = require('../controllers/employeeController');

const router = express.Router();

// @route   GET /api/employees
// @desc    Get all employees
// @access  Private (HR Admin)
router.get('/', auth, authorize('hr_admin'), getEmployees);

// @route   POST /api/employees
// @desc    Create new employee
// @access  Private (HR Admin)
router.post('/', auth, authorize('hr_admin'), [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['employee', 'manager', 'hr_admin']).withMessage('Invalid role'),
  body('department').notEmpty().withMessage('Department is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('hourlyRate').isNumeric().withMessage('Hourly rate must be a number'),
  body('salary').isNumeric().withMessage('Salary must be a number')
], createEmployee);

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private (HR Admin)
router.put('/:id', auth, authorize('hr_admin'), [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please include a valid email'),
  body('role').optional().isIn(['employee', 'manager', 'hr_admin']).withMessage('Invalid role'),
  body('department').optional().notEmpty().withMessage('Department cannot be empty'),
  body('position').optional().notEmpty().withMessage('Position cannot be empty'),
  body('hourlyRate').optional().isNumeric().withMessage('Hourly rate must be a number'),
  body('salary').optional().isNumeric().withMessage('Salary must be a number')
], updateEmployee);

// @route   DELETE /api/employees/:id
// @desc    Delete employee (deactivate)
// @access  Private (HR Admin)
router.delete('/:id', auth, authorize('hr_admin'), deleteEmployee);

module.exports = router;