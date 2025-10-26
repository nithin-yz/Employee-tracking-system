# Deployment Guide

## Quick Start

### 1. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/employee-tracking
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

### 3. Start Development Servers
```bash
# Option 1: Start both servers with one command
npm run dev

# Option 2: Start servers separately
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
cd client
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Production Deployment

### Heroku Deployment

1. **Create Heroku App**
```bash
heroku create your-app-name
```

2. **Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_atlas_connection_string
heroku config:set JWT_SECRET=your_production_jwt_secret
```

3. **Deploy**
```bash
git add .
git commit -m "Deploy to production"
git push heroku main
```

### Vercel Deployment (Frontend Only)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy Frontend**
```bash
cd client
vercel --prod
```

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update MONGODB_URI in your environment variables

## Testing the Application

### 1. Register Test Users

**HR Admin:**
- Email: admin@company.com
- Password: admin123
- Role: hr_admin

**Manager:**
- Email: manager@company.com
- Password: manager123
- Role: manager

**Employee:**
- Email: employee@company.com
- Password: employee123
- Role: employee

### 2. Test Features

1. **Employee Features:**
   - Clock in/out
   - Take breaks
   - View timesheets
   - Request leave

2. **Manager Features:**
   - Approve timesheets
   - Approve leave requests
   - View team reports

3. **HR Admin Features:**
   - Manage employees
   - Process payroll
   - Generate reports

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MONGODB_URI in .env file
   - Ensure MongoDB is running locally or Atlas connection is correct

2. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes on the port

3. **CORS Issues**
   - Check axios baseURL in client/src/main.tsx
   - Ensure backend CORS is configured

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check for TypeScript errors
   - Update dependencies

### Logs and Debugging

```bash
# View backend logs
npm run server

# View frontend logs
cd client
npm run dev

# Check production logs (Heroku)
heroku logs --tail
```

## Security Considerations

1. **Environment Variables**
   - Never commit .env files
   - Use strong JWT secrets in production
   - Secure MongoDB connection strings

2. **Authentication**
   - Implement rate limiting
   - Add password complexity requirements
   - Use HTTPS in production

3. **Data Protection**
   - Encrypt sensitive data
   - Implement proper access controls
   - Regular security audits

## Performance Optimization

1. **Database Indexing**
   - Add indexes for frequently queried fields
   - Optimize aggregation queries

2. **Caching**
   - Implement Redis for session storage
   - Cache frequently accessed data

3. **Frontend Optimization**
   - Code splitting
   - Lazy loading
   - Image optimization

## Monitoring and Maintenance

1. **Health Checks**
   - Implement API health endpoints
   - Monitor database connections
   - Set up error tracking

2. **Backup Strategy**
   - Regular database backups
   - Code repository backups
   - Environment configuration backups

3. **Updates**
   - Keep dependencies updated
   - Security patches
   - Feature updates
