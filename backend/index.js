const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { pool, initDB } = require('./db');
require('dotenv').config();

// Import authentication middleware
const { authenticate } = require('./middleware/authenticate');

// Route imports
const userRoutes = require('./routes/user');
const incomeRoutes = require('./routes/income');
const expensesRoutes = require('./routes/expenses');
const moneyReceivedRoutes = require('./routes/moneyReceived');
const moneyGivenRoutes = require('./routes/moneyGiven');
const savingsRoutes = require('./routes/savings');
const transactionsRoutes = require('./routes/transactions');
const insightsRoute = require('./routes/insights');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: 'http://localhost:8080',  // Replace with your frontend domain
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Init DB tables
initDB();

// Public routes (no authentication required)
// Signup Route
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Extended to 24 hours for better UX
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// Logout Route
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// Authentication check endpoint (this was missing!)
app.get('/api/middleware/authenticate', async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ authenticated: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists in database
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ authenticated: false, message: 'User not found' });
    }

    const user = result.rows[0];
    
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ authenticated: false, message: 'Invalid token' });
  }
});

// Apply authentication middleware to all protected routes
app.use('/api/user', authenticate, userRoutes);
app.use('/api/income',  incomeRoutes);
app.use('/api/expenses', authenticate, expensesRoutes);
app.use('/api/money-received', authenticate, moneyReceivedRoutes);
app.use('/api/money-given', authenticate, moneyGivenRoutes);
app.use('/api/savings', authenticate, savingsRoutes);
app.use('/api/transactions', authenticate, transactionsRoutes);
app.use('/api/insights', authenticate, insightsRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

module.exports = app;