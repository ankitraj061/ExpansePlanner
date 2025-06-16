const express = require('express');
const { pool } = require('../db'); // Updated import to match your schema
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// @route   POST /api/money-received
// @desc    Add a new money received entry
// @access  Private
router.post('/', authenticate, async (req, res) => {
  const { person, amount, description, date } = req.body; // Changed from person_name to person
  const userId = req.user.id;

  if (!person || !amount || !date) {
    return res.status(400).json({ message: 'Person, amount, and date are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO money_received (user_id, person_name, amount, description, date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, person_name AS person, amount, description, date, created_at`,
      [userId, person, parseFloat(amount), description || null, date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting money received entry:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/money-received
// @desc    Get all money received entries for the logged-in user
// @access  Private
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, person_name AS person, amount, description, date, created_at
       FROM money_received
       WHERE user_id = $1
       ORDER BY date DESC, created_at DESC`,
      [userId]
    );
   

    // Ensure we always return an array
    res.json(result.rows || []);
  } catch (err) {
    console.error('Error fetching money received entries:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   DELETE /api/money-received/:id
// @desc    Delete a specific money received entry
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  const userId = req.user.id;
  const entryId = req.params.id;

  // Validate that entryId is a number
  if (isNaN(entryId)) {
    return res.status(400).json({ message: 'Invalid entry ID' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM money_received
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [parseInt(entryId), userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Entry not found or not authorized' });
    }

    res.json({ message: 'Entry deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting money received entry:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/money-received/total
// @desc    Get total money received for the logged-in user
// @access  Private
router.get('/total', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM money_received
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ total: parseFloat(result.rows[0].total) });
  } catch (err) {
    console.error('Error calculating total money received:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;