const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET profile - authenticate middleware already applied globally
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT profile - authenticate middleware already applied globally
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;
    
    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    // Check if email is already taken by another user
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2', 
      [email, userId]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already taken' });
    }
    
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING name, email',
      [name, email, userId]
    );
    
    res.json({ 
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;