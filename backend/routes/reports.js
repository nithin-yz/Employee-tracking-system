const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getDashboardData,
  exportReport
} = require('../controllers/reportController');

const router = express.Router();

// @route   GET /api/reports/attendance
// @desc    Get attendance report
// @access  Private
router.get('/attendance', auth, getAttendanceReport);

// @route   GET /api/reports/leave
// @desc    Get leave report
// @access  Private
router.get('/leave', auth, getLeaveReport);

// @route   GET /api/reports/payroll
// @desc    Get payroll report
// @access  Private (HR Admin)
router.get('/payroll', auth, getPayrollReport);

// @route   GET /api/reports/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/dashboard', auth, getDashboardData);

// @route   GET /api/reports/export/:type
// @desc    Export report data
// @access  Private
router.get('/export/:type', auth, exportReport);

module.exports = router;