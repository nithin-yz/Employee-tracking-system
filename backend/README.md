# Employee Time Tracking & Payroll System

A comprehensive MERN stack application for tracking employee work hours with approval workflow and payroll calculations.

## Features

### Employee Portal
- **Clock In/Out**: Digital punch-in system with GPS-based validation
- **Timesheet Management**: View daily/weekly work logs
- **Leave Requests**: Apply for leave (sick, vacation, etc.) with manager approval
- **Break Management**: Track break times during work hours

### Manager Dashboard
- **Timesheet Approval**: Review and approve/reject team timesheets
- **Team Management**: View team schedules and attendance
- **Leave Approval**: Approve/reject leave requests from team members

### HR Admin Panel
- **Employee Management**: Add/edit employee records, assign roles, set wages
- **Payroll Processing**: Calculate salaries based on approved hours, overtime, and deductions
- **Reports**: Generate comprehensive reports for attendance, payroll, and leave records

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **moment.js** for date handling

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Material-UI** for UI components
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Recharts** for data visualization
- **Axios** for HTTP requests

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/employee-tracking
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

3. Start the backend server:
```bash
npm run server
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Full Stack Development

To run both backend and frontend simultaneously:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Timesheets
- `POST /api/timesheets/clock-in` - Clock in employee
- `PUT /api/timesheets/clock-out` - Clock out employee
- `PUT /api/timesheets/break-start` - Start break
- `PUT /api/timesheets/break-end` - End break
- `GET /api/timesheets/my-timesheets` - Get user's timesheets
- `GET /api/timesheets/team-timesheets` - Get team timesheets (managers)
- `PUT /api/timesheets/:id/approve` - Approve timesheet
- `PUT /api/timesheets/:id/reject` - Reject timesheet

### Leave Management
- `POST /api/leaves` - Create leave request
- `GET /api/leaves/my-leaves` - Get user's leave requests
- `GET /api/leaves/team-leaves` - Get team leave requests (managers)
- `PUT /api/leaves/:id/approve` - Approve leave request
- `PUT /api/leaves/:id/reject` - Reject leave request
- `DELETE /api/leaves/:id` - Cancel leave request

### Employee Management
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create new employee (HR only)
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Deactivate employee

### Payroll
- `POST /api/payroll/calculate` - Calculate payroll
- `POST /api/payroll` - Create payroll record
- `GET /api/payroll` - Get payroll records
- `GET /api/payroll/:id` - Get payroll by ID
- `PUT /api/payroll/:id/approve` - Approve payroll
- `PUT /api/payroll/:id/pay` - Mark payroll as paid

### Reports
- `GET /api/reports/attendance` - Get attendance report
- `GET /api/reports/leave` - Get leave report
- `GET /api/reports/payroll` - Get payroll report
- `GET /api/reports/dashboard` - Get dashboard statistics
- `GET /api/reports/export/:type` - Export report data

## User Roles

### Employee
- Clock in/out and manage breaks
- View personal timesheets
- Request and track leave
- View personal payroll information

### Manager
- All employee features
- Approve/reject team timesheets
- Approve/reject team leave requests
- View team reports and analytics

### HR Admin
- All manager features
- Manage employee records
- Process payroll
- Access comprehensive reports
- System administration

## Database Models

### User
- Personal information (name, email, phone, address)
- Role-based access (employee, manager, hr_admin)
- Employment details (department, position, hire date)
- Compensation (hourly rate, salary)
- Manager relationship

### Timesheet
- Employee reference
- Date and time tracking (clock in/out, breaks)
- Calculated hours (regular, overtime)
- Approval workflow
- Location tracking (optional)

### Leave
- Employee reference
- Leave type and dates
- Reason and emergency contact
- Approval workflow
- Status tracking

### Payroll
- Employee reference
- Pay period and timesheets
- Calculated amounts (gross, deductions, net)
- Processing status
- Payment details

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=7d
```

### Build for Production
```bash
# Build frontend
cd client
npm run build

# Start production server
cd ..
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
