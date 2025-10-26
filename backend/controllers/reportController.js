const Timesheet = require('../models/Timesheet');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const User = require('../models/User');

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

// @desc    Get attendance report
// @route   GET /api/reports/attendance
// @access  Private
const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const timesheets = await Timesheet.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ date: -1 });

    // Filter by department if specified
    let filteredTimesheets = timesheets;
    if (department) {
      filteredTimesheets = timesheets.filter(ts => ts.employee.department === department);
    }

    // Calculate summary
    const summary = {
      totalDays: filteredTimesheets.length,
      totalHours: filteredTimesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0),
      totalRegularHours: filteredTimesheets.reduce((sum, ts) => sum + (ts.regularHours || 0), 0),
      totalOvertimeHours: filteredTimesheets.reduce((sum, ts) => sum + (ts.overtimeHours || 0), 0),
      averageHoursPerDay: filteredTimesheets.length > 0 ? 
        filteredTimesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0) / filteredTimesheets.length : 0
    };

    // Prepare chart data
    const chartData = filteredTimesheets.map(ts => ({
      date: ts.date.toISOString().split('T')[0],
      hours: ts.totalHours || 0
    }));

    res.json({
      timesheets: filteredTimesheets,
      summary,
      chartData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get leave report
// @route   GET /api/reports/leave
// @access  Private
const getLeaveReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    let query = {};
    
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

    const leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ startDate: -1 });

    // Filter by department if specified
    let filteredLeaves = leaves;
    if (department) {
      filteredLeaves = leaves.filter(l => l.employee.department === department);
    }

    // Calculate summary
    const summary = {
      totalLeaves: filteredLeaves.length,
      totalDays: filteredLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0),
      approvedLeaves: filteredLeaves.filter(l => l.status === 'approved').length,
      pendingLeaves: filteredLeaves.filter(l => l.status === 'pending').length,
      rejectedLeaves: filteredLeaves.filter(l => l.status === 'rejected').length
    };

    // Prepare chart data by leave type
    const leaveTypeData = filteredLeaves.reduce((acc, leave) => {
      const type = leave.leaveType;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += leave.totalDays || 0;
      return acc;
    }, {});

    const chartData = Object.entries(leaveTypeData).map(([type, days]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: days
    }));

    res.json({
      leaves: filteredLeaves,
      summary,
      chartData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get payroll report
// @route   GET /api/reports/payroll
// @access  Private (HR Admin)
const getPayrollReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query['payPeriod.startDate'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payrolls = await Payroll.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ createdAt: -1 });

    // Filter by department if specified
    let filteredPayrolls = payrolls;
    if (department) {
      filteredPayrolls = payrolls.filter(p => p.employee.department === department);
    }

    // Calculate summary
    const summary = {
      totalPayrolls: filteredPayrolls.length,
      totalGrossPay: filteredPayrolls.reduce((sum, p) => sum + (p.grossPay || 0), 0),
      totalDeductions: filteredPayrolls.reduce((sum, p) => sum + (p.deductions?.total || 0), 0),
      totalNetPay: filteredPayrolls.reduce((sum, p) => sum + (p.netPay || 0), 0)
    };

    // Prepare chart data
    const chartData = filteredPayrolls.map(payroll => ({
      employee: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      grossPay: payroll.grossPay || 0,
      netPay: payroll.netPay || 0
    }));

    res.json({
      payrolls: filteredPayrolls,
      summary,
      chartData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dashboard data
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const userRole = req.user.role;
    let dashboardData = {};

    if (userRole === 'employee') {
      // Employee dashboard
      const timesheets = await Timesheet.find({ employee: req.user.id })
        .sort({ date: -1 })
        .limit(5);
      
      const leaves = await Leave.find({ employee: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5);

      dashboardData = {
        recentTimesheets: timesheets,
        recentLeaves: leaves,
        totalHoursThisMonth: timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0),
        pendingLeaves: leaves.filter(l => l.status === 'pending').length
      };
    } else if (userRole === 'manager') {
      // Manager dashboard
      const pendingTimesheets = await Timesheet.find({ status: 'pending' })
        .populate('employee', 'firstName lastName employeeId department')
        .sort({ date: -1 })
        .limit(10);

      const pendingLeaves = await Leave.find({ status: 'pending' })
        .populate('employee', 'firstName lastName employeeId department')
        .sort({ createdAt: -1 })
        .limit(10);

      dashboardData = {
        pendingTimesheets,
        pendingLeaves,
        totalPendingTimesheets: pendingTimesheets.length,
        totalPendingLeaves: pendingLeaves.length
      };
    } else if (userRole === 'hr_admin') {
      // HR Admin dashboard
      const totalEmployees = await User.countDocuments({ role: 'employee' });
      const totalPayrolls = await Payroll.countDocuments();
      const totalTimesheets = await Timesheet.countDocuments();
      const totalLeaves = await Leave.countDocuments();

      dashboardData = {
        totalEmployees,
        totalPayrolls,
        totalTimesheets,
        totalLeaves
      };
    }

    res.json(dashboardData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Export report data
// @route   GET /api/reports/export/:type
// @access  Private
const exportReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;

    let data = {};

    switch (type) {
      case 'attendance':
        // Get attendance data (simplified)
        const timesheets = await Timesheet.find({
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }).populate('employee', 'firstName lastName employeeId department');
        
        data = timesheets.map(ts => ({
          employee: `${ts.employee.firstName} ${ts.employee.lastName}`,
          employeeId: ts.employee.employeeId,
          department: ts.employee.department,
          date: ts.date,
          clockIn: ts.clockIn,
          clockOut: ts.clockOut,
          totalHours: ts.totalHours,
          status: ts.status
        }));
        break;

      case 'leave':
        // Get leave data (simplified)
        const leaves = await Leave.find({
          $or: [
            {
              startDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
            },
            {
              endDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
          ]
        }).populate('employee', 'firstName lastName employeeId department');
        
        data = leaves.map(l => ({
          employee: `${l.employee.firstName} ${l.employee.lastName}`,
          employeeId: l.employee.employeeId,
          department: l.employee.department,
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate,
          totalDays: l.totalDays,
          reason: l.reason,
          status: l.status,
          approvedBy: l.approvedBy ? 'Approved' : 'Not Approved'
        }));
        break;

      case 'payroll':
        // Get payroll data (simplified)
        const payrolls = await Payroll.find({
          'payPeriod.startDate': {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }).populate('employee', 'firstName lastName employeeId department');
        
        data = payrolls.map(p => ({
          employee: `${p.employee.firstName} ${p.employee.lastName}`,
          employeeId: p.employee.employeeId,
          department: p.employee.department,
          payPeriod: `${p.payPeriod.startDate} - ${p.payPeriod.endDate}`,
          grossPay: p.grossPay,
          deductions: p.deductions.total,
          netPay: p.netPay,
          status: p.status
        }));
        break;

      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
      res.send(csv);
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getDashboardData,
  exportReport
};
