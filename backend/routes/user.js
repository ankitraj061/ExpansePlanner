// routes/user.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authenticate = require('../middleware/authenticate');

// GET profile
router.get('/profile', authenticate, async (req, res) => {
  
  try {
    const userId = req.user.id;
    const result = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT profile
router.put('/profile', authenticate, async (req, res) => {
  
  try {
    const userId = req.user.id;
    const { name, email } = req.body;
    await pool.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [name, email, userId]);
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
