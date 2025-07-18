const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// @route   POST /api/money-given
// @desc    Add a new money given entry
// @access  Private (authenticate middleware already applied globally)
router.post('/', async (req, res) => {
  const { person, amount, description, date } = req.body;
  const userId = req.user.id;

  if (!person || !amount || !date) {
    return res.status(400).json({ message: 'Person, amount, and date are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO money_given (user_id, person_name, amount, description, date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, person_name AS person, amount, description, date, created_at`,
      [userId, person, parseFloat(amount), description || null, date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting money given entry:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/money-given
// @desc    Get all money given entries for the logged-in user
// @access  Private (authenticate middleware already applied globally)
router.get('/', async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, person_name AS person, amount, description, date, created_at
       FROM money_given
       WHERE user_id = $1
       ORDER BY date DESC, created_at DESC`,
      [userId]
    );

    res.json(result.rows || []);
  } catch (err) {
    console.error('Error fetching money given entries:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/money-given/total
// @desc    Get total money given for the logged-in user
// @access  Private (authenticate middleware already applied globally)
// NOTE: This route must come BEFORE the /:id route to avoid conflicts
router.get('/total', async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM money_given
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ total: parseFloat(result.rows[0].total) });
  } catch (err) {
    console.error('Error calculating total money given:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   DELETE /api/money-given/:id
// @desc    Delete a specific money given entry
// @access  Private (authenticate middleware already applied globally)
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const entryId = req.params.id;

  if (isNaN(entryId)) {
    return res.status(400).json({ message: 'Invalid entry ID' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM money_given
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [parseInt(entryId), userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Entry not found or not authorized' });
    }

    res.json({ message: 'Entry deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting money given entry:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;