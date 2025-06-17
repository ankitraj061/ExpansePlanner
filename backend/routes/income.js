const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Add income
router.post('/', async (req, res) => {
  const { user_id, amount, income_type, description, date } = req.body;
  

  if (!user_id || !amount || !income_type || !description || !date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO income (user_id, amount, income_type, description, date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, amount, income_type, description, date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error inserting income:', error);
    res.status(500).json({ error: 'Failed to add income' });
  }
});

// Get recent incomes for a user (latest 5)
router.get('/:userId/recent', async (req, res) => {
  const { userId } = req.params;
  

  try {
    const result = await pool.query(
      `SELECT * FROM income WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({ error: 'Failed to fetch incomes' });
  }
});

// Get total income for a user
router.get('/total/:userId', async (req, res) => {
  const { userId } = req.params;
  

  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_income FROM income WHERE user_id = $1`,
      [userId]
    );

    res.json({ totalIncome: parseFloat(result.rows[0].total_income) || 0 });
  } catch (error) {
    console.error('Error fetching total income:', error);
    res.status(500).json({ error: 'Failed to fetch total income' });
  }
});


module.exports = router;
