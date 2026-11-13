const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const { errorResponse } = require('./utils/response');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const auditRoutes = require('./routes/auditRoutes');
const academicRoutes = require('./routes/academicRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const examRoutes = require('./routes/examRoutes');
const feeRoutes = require('./routes/feeRoutes');
const guardianRoutes = require('./routes/guardianRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'School Management System API',
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/guardian', guardianRoutes);
app.use('/api/reports', reportRoutes);

// Serve Frontend Static Build if available
const path = require('path');
const frontendDist = path.join(__dirname, '../../frontend/dist');
const fs = require('fs');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Catch-all 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  return errorResponse(res, `Endpoint ${req.method} ${req.originalUrl} not found`, 404);
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
