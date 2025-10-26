const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Password utilities
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT utilities
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
};

// Date utilities
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const getDateRange = (startDate, endDate) => {
  return {
    $gte: new Date(startDate),
    $lte: new Date(endDate)
  };
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    start: startOfMonth.toISOString().split('T')[0],
    end: endOfMonth.toISOString().split('T')[0]
  };
};

const getLastMonthRange = () => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  return {
    start: lastMonth.toISOString().split('T')[0],
    end: endOfLastMonth.toISOString().split('T')[0]
  };
};

// Calculation utilities
const calculateHours = (clockIn, clockOut, breakStart = null, breakEnd = null) => {
  const clockInTime = new Date(clockIn);
  const clockOutTime = new Date(clockOut);
  
  let totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
  let breakHours = 0;

  if (breakStart && breakEnd) {
    const breakStartTime = new Date(breakStart);
    const breakEndTime = new Date(breakEnd);
    breakHours = (breakEndTime - breakStartTime) / (1000 * 60 * 60);
    totalHours -= breakHours;
  }

  const regularHours = Math.min(totalHours, 8);
  const overtimeHours = Math.max(totalHours - 8, 0);

  return {
    totalHours,
    regularHours,
    overtimeHours,
    breakHours
  };
};

const calculatePay = (regularHours, overtimeHours, hourlyRate) => {
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * (hourlyRate * 1.5);
  const grossPay = regularPay + overtimePay;

  return {
    regularPay,
    overtimePay,
    grossPay
  };
};

const calculateDeductions = (grossPay, customDeductions = {}) => {
  const deductions = {
    tax: customDeductions.tax || grossPay * 0.15,
    insurance: customDeductions.insurance || grossPay * 0.05,
    retirement: customDeductions.retirement || grossPay * 0.03,
    other: customDeductions.other || 0,
    total: 0
  };
  
  deductions.total = deductions.tax + deductions.insurance + 
                    deductions.retirement + deductions.other;

  return deductions;
};

// Validation utilities
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

// Response utilities
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, message = 'Server error', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors
  });
};

module.exports = {
  // Password utilities
  hashPassword,
  comparePassword,
  
  // JWT utilities
  generateToken,
  verifyToken,
  
  // Date utilities
  formatDate,
  getDateRange,
  getCurrentMonthRange,
  getLastMonthRange,
  
  // Calculation utilities
  calculateHours,
  calculatePay,
  calculateDeductions,
  
  // Validation utilities
  isValidEmail,
  isValidObjectId,
  
  // Response utilities
  successResponse,
  errorResponse,
  validationErrorResponse
};
