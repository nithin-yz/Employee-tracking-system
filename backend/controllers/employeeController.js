const { validationResult } = require('express-validator');
const User = require('../models/User');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (HR Admin)
const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, department, role, search } = req.query;
    
    let query = {};
    
    if (department) {
      query.department = department;
    }
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      employees,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private (HR Admin)
const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (HR Admin)
const createEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role, department, position, hourlyRate, salary } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Create user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      position,
      hourlyRate,
      salary
    });

    await user.save();
    await user.populate('manager', 'firstName lastName');

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (HR Admin)
const updateEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, role, department, position, hourlyRate, salary, isActive } = req.body;

    const employee = await User.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update fields
    employee.firstName = firstName || employee.firstName;
    employee.lastName = lastName || employee.lastName;
    employee.email = email || employee.email;
    employee.role = role || employee.role;
    employee.department = department || employee.department;
    employee.position = position || employee.position;
    employee.hourlyRate = hourlyRate !== undefined ? hourlyRate : employee.hourlyRate;
    employee.salary = salary !== undefined ? salary : employee.salary;
    employee.isActive = isActive !== undefined ? isActive : employee.isActive;

    await employee.save();
    await employee.populate('manager', 'firstName lastName');

    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete employee (deactivate)
// @route   DELETE /api/employees/:id
// @access  Private (HR Admin)
const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Soft delete - set isActive to false
    employee.isActive = false;
    await employee.save();

    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
