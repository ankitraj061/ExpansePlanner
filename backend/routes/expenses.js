
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Add expense
router.post('/', async (req, res) => {
  const { user_id, amount, category, description, date } = req.body;

  if (!user_id || !amount || !category || !description || !date) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO expenses (user_id, amount, category, description, date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, amount, category, description, date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error inserting expense:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});



router.get('/summary/:userId', async (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const todayResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = $1 AND date = CURRENT_DATE`,
      [userId]
    );
    console.log(todayResult.rows[0].total);

    const weekResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'`,
      [userId]
    );

    const monthResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = $1 AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)`,
      [userId]
    );

    res.json({
      today: parseFloat(todayResult.rows[0].total) || 0,
      week: parseFloat(weekResult.rows[0].total) || 0,
      month: parseFloat(monthResult.rows[0].total) || 0,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Monthly chart data
router.get('/monthly/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(date, 'Mon') AS month,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS expenses
      FROM expenses
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY month, date_trunc('month', date)
      ORDER BY date_trunc('month', date)
    `, [userId]);

    const incomeResult = await pool.query(`
      SELECT 
        TO_CHAR(date, 'Mon') AS month,
        SUM(amount) AS income
      FROM income
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY month, date_trunc('month', date)
      ORDER BY date_trunc('month', date)
    `, [userId]);

    // Merge data by month
    const monthlyData = result.rows.map((row, i) => ({
      month: row.month,
      expenses: parseFloat(row.expenses),
      income: parseFloat(incomeResult.rows[i]?.income || 0),
    }));

    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    res.status(500).json({ error: 'Failed to fetch monthly data' });
  }
});

// Expense categories
router.get('/categories/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(`
      SELECT category, SUM(amount) as value
      FROM expenses
      WHERE user_id = $1
      GROUP BY category
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get recent expenses for a user (latest 5)
//routes/expenses.js

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM expenses WHERE user_id = $1 order by created_at DESC LIMIT 10`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
})

// Get total expenses for a user
router.get('/total/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses WHERE user_id = $1`,
      [userId]
    );
    
    // Convert to number
    res.json({ totalExpenses: parseFloat(result.rows[0].total_expenses) || 0 });
  } catch (error) {
    console.error('Error fetching total expenses:', error);
    res.status(500).json({ error: 'Failed to fetch total expenses' });
  }
});

// Daily expense trend (last 30 days)
router.get('/daily-trend/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await pool.query(`
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '29 days',
          CURRENT_DATE,
          '1 day'::interval
        )::date AS date
      )
      SELECT 
        TO_CHAR(ds.date, 'MM/DD') AS day,
        ds.date,
        COALESCE(SUM(e.amount), 0) AS expenses
      FROM date_series ds
      LEFT JOIN expenses e ON e.date = ds.date AND e.user_id = $1
      GROUP BY ds.date, ds.date
      ORDER BY ds.date
    `, [userId]);

    const dailyData = result.rows.map(row => ({
      day: row.day,
      date: row.date,
      expenses: parseFloat(row.expenses) || 0
    }));

   
    res.json(dailyData);
  } catch (error) {
    console.error('Error fetching daily trend:', error);
    res.status(500).json({ error: 'Failed to fetch daily trend' });
  }
});

// edit expense
router.put('/:expenseId', async (req, res) => {
  const { expenseId } = req.params;
  const { description, amount, category} = req.body;
  if (!description || !amount || !category) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE expenses 
       SET description = $1, amount = $2, category = $3 
       WHERE id = $4 
       RETURNING *`,
      [description, amount, category, expenseId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});


// Delete expense
router.delete('/:expenseId', async (req, res) => {
  const { expenseId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 RETURNING *',
      [expenseId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ 
      message: 'Expense deleted successfully', 
      deletedExpense: result.rows[0] 
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});



module.exports = router;
