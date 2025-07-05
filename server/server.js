const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
const ordersRouter = require('./routes/orders');
const { router: authRouter } = require('./routes/auth');

app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();