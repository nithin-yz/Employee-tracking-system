# Employee Tracking System

A comprehensive full-stack web application for managing employee timesheets, leave requests, and payroll processing with role-based access control.

## 🚀 Features

### 👥 Role-Based Access Control
- **Employee Portal**: Clock in/out, view timesheets, request time off
- **Manager Dashboard**: Approve timesheets, manage team schedules
- **HR Admin Panel**: Payroll processing, employee management, reports

### 📊 Core Functionality
- **Timesheet Management**: Track daily work hours with clock in/out functionality
- **Leave Management**: Request and approve various types of leave
- **Payroll Processing**: Automated payroll calculation based on approved timesheets
- **Reports & Analytics**: Comprehensive reporting with data visualization
- **Employee Management**: Add, edit, and manage employee information

### 🎨 Modern UI/UX
- Responsive Material-UI design
- Real-time data updates
- Interactive charts and visualizations
- Intuitive navigation with role-based menus

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **React Router DOM** for navigation
- **React Query** for data fetching and caching
- **Recharts** for data visualization
- **Vite** for build tooling

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Express Validator** for input validation
- **bcryptjs** for password hashing
- **MVC Architecture** with controllers and utilities

## 📁 Project Structure

```
Employee-tracking-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── assets/        # Static assets
│   └── package.json
├── backend/               # Node.js backend
│   ├── controllers/       # Business logic controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/           # Utility functions
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nithin-yz/Employee-tracking-system.git
   cd Employee-tracking-system
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   - Create a `.env` file in the backend directory
   - Add your MongoDB connection string and JWT secret:
   ```env
   MONGODB_URI=mongodb://localhost:27017/employee-tracking
   JWT_SECRET=your-secret-key
   PORT=5000
   ```

5. **Start the application**
   
   **Backend (Terminal 1):**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 👤 Default Users

After starting the application, you can register new users with different roles:

- **Employee**: Can clock in/out, view timesheets, request leave
- **Manager**: Can approve timesheets and leave requests
- **HR Admin**: Full access to all features including payroll and reports

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Timesheets
- `GET /api/timesheets` - Get user timesheets
- `POST /api/timesheets` - Create timesheet
- `PUT /api/timesheets/:id/approve` - Approve timesheet (Manager/HR)
- `PUT /api/timesheets/:id/reject` - Reject timesheet (Manager/HR)

### Leave Management
- `GET /api/leaves` - Get user leave requests
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id/approve` - Approve leave (Manager/HR)
- `PUT /api/leaves/:id/reject` - Reject leave (Manager/HR)

### Employee Management
- `GET /api/employees` - Get all employees (HR Admin)
- `POST /api/employees` - Create employee (HR Admin)
- `PUT /api/employees/:id` - Update employee (HR Admin)

### Payroll
- `GET /api/payroll` - Get payroll records (HR Admin)
- `POST /api/payroll` - Create payroll (HR Admin)

### Reports
- `GET /api/reports/attendance` - Attendance report
- `GET /api/reports/leave` - Leave report
- `GET /api/reports/payroll` - Payroll report

## 🔧 Development

### Backend Development
- Uses nodemon for automatic server restarts
- MVC architecture with separate controllers
- Comprehensive error handling and validation
- JWT-based authentication middleware

### Frontend Development
- Hot module replacement with Vite
- TypeScript for type safety
- Material-UI theming and components
- React Query for efficient data management

## 📊 Database Schema

### User Model
- Personal information (name, email, department, position)
- Role-based access (employee, manager, hr_admin)
- Authentication fields (password, employeeId)

### Timesheet Model
- Clock in/out times
- Hours calculation (regular, overtime, break)
- Status tracking (pending, approved, rejected)
- Employee and approver references

### Leave Model
- Leave type and duration
- Start/end dates with total days calculation
- Status and approval workflow
- Reason and rejection notes

### Payroll Model
- Employee and timesheet references
- Pay calculations (regular, overtime, deductions)
- Pay period and status tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nithin YZ**
- GitHub: [@nithin-yz](https://github.com/nithin-yz)

## 🙏 Acknowledgments

- Material-UI team for the excellent component library
- React team for the amazing framework
- MongoDB team for the robust database solution
