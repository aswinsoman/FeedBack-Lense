require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '2mb' })); 
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// API Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/surveys', require('./routes/surveys'));
app.use('/api/v1/invitations', require('./routes/invitations'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/activity', require('./routes/activity'));

app.use('/api/v1/pdf', require('./routes/pdf'));

//analytics route
app.use('/api/v1/analytics', require('./routes/analytics'));

// Survey access route (for public survey participation via token)
app.use('/survey', require('./routes/surveyAccess'));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'FeedbackLens API',
    version: '1.0.0',
    description: 'Survey creation and feedback management platform',
    endpoints: {
      auth: '/api/v1/auth/*',
      surveys: '/api/v1/surveys/*',
      invitations: '/api/v1/invitations/*',
      dashboard: '/api/v1/dashboard/*',
      pdf: '/api/v1/pdf/*',
      analytics: '/api/v1/analytics/*',
      surveyAccess: '/survey/:surveyId?token=xxx'
    },
    health: '/api/v1/health'
  });
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation error', details: err.message });
  }
  
  // MongoDB errors
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Default error
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`FeedbackLens API running on http://localhost:${port}`);
    console.log(`API Documentation: http://localhost:${port}/api/v1`);
    console.log(`Health Check: http://localhost:${port}/api/v1/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
}

// Export app for testing
module.exports = app;
