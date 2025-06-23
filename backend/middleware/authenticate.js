// middleware/authenticate.js
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const authenticate = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ 
      authenticated: false,
      message: 'Unauthorized: No token provided' 
    });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optional: Verify user still exists in database (recommended for security)
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        authenticated: false,
        message: 'User not found' 
      });
    }

    // Attach user info to request object
    req.user = decoded;
    req.userInfo = result.rows[0]; // Full user info if needed
    
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    
    // Handle different types of JWT errors
    let message = 'Token expired or invalid. Please login again.';
    
    if (err.name === 'TokenExpiredError') {
      message = 'Token has expired. Please login again.';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token. Please login again.';
    } else if (err.name === 'NotBeforeError') {
      message = 'Token not active yet.';
    }
    
    return res.status(401).json({ 
      authenticated: false,
      message: message 
    });
  }
};

// Optional: Middleware for routes that can work with or without authentication
const optionalAuth = async (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rows.length > 0) {
      req.user = decoded;
      req.userInfo = result.rows[0];
    } else {
      req.user = null;
    }
  } catch (err) {
    console.log('Optional auth failed:', err.message);
    req.user = null;
  }
  
  next();
};

module.exports = { authenticate, optionalAuth };

// If you want to keep the default export as well for backward compatibility:
module.exports.default = authenticate;