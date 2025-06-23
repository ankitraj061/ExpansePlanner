const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/transactions/:userId - Get combined transaction history
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify that the requesting user matches the userId or has appropriate permissions
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Query to combine income and expenses with UNION ALL
    const query = `
      SELECT 
        id,
        'income' as type,
        amount,
        description,
        date,
        income_type,
        NULL as category,
        created_at
      FROM income 
      WHERE user_id = $1
      
      UNION ALL
      
      SELECT 
        id,
        'expense' as type,
        amount,
        description,
        date,
        NULL as income_type,
        category,
        created_at
      FROM expenses 
      WHERE user_id = $1
      
      ORDER BY date DESC, created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query, [userId]);
    
    // Transform the data to ensure consistent structure
    const transactions = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      amount: parseFloat(row.amount),
      description: row.description,
      date: row.date,
      category: row.category,
      income_type: row.income_type,
      created_at: row.created_at
    }));

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
});

// GET /api/transactions/:userId/summary - Get financial summary
router.get('/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get total income
    const incomeResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_income FROM income WHERE user_id = $1',
      [userId]
    );

    // Get total expenses
    const expenseResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE user_id = $1',
      [userId]
    );

    const totalIncome = parseFloat(incomeResult.rows[0].total_income);
    const totalExpenses = parseFloat(expenseResult.rows[0].total_expenses);
    const netBalance = totalIncome - totalExpenses;

    res.json({
      totalIncome,
      totalExpenses,
      netBalance
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ message: 'Server error while fetching summary' });
  }
});

// GET /api/transactions/:userId/recent - Get recent transactions (last 10)
router.get('/:userId/recent', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = `
      SELECT 
        id,
        'income' as type,
        amount,
        description,
        date,
        income_type,
        NULL as category,
        created_at
      FROM income 
      WHERE user_id = $1
      
      UNION ALL
      
      SELECT 
        id,
        'expense' as type,
        amount,
        description,
        date,
        NULL as income_type,
        category,
        created_at
      FROM expenses 
      WHERE user_id = $1
      
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const result = await pool.query(query, [userId]);
    
    const transactions = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      amount: parseFloat(row.amount),
      description: row.description,
      date: row.date,
      category: row.category,
      income_type: row.income_type,
      created_at: row.created_at
    }));

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({ message: 'Server error while fetching recent transactions' });
  }
});

// GET /api/transactions/:userId/monthly - Get monthly breakdown
router.get('/:userId/monthly', async (req, res) => {
  try {
    const { userId } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = `
      WITH monthly_data AS (
        SELECT 
          EXTRACT(MONTH FROM date) as month,
          EXTRACT(YEAR FROM date) as year,
          'income' as type,
          SUM(amount) as total
        FROM income 
        WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
        GROUP BY EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)
        
        UNION ALL
        
        SELECT 
          EXTRACT(MONTH FROM date) as month,
          EXTRACT(YEAR FROM date) as year,
          'expense' as type,
          SUM(amount) as total
        FROM expenses 
        WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
        GROUP BY EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)
      )
      SELECT 
        month,
        year,
        SUM(CASE WHEN type = 'income' THEN total ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN total ELSE 0 END) as expenses,
        SUM(CASE WHEN type = 'income' THEN total ELSE -total END) as net
      FROM monthly_data
      GROUP BY month, year
      ORDER BY month
    `;

    const result = await pool.query(query, [userId, year]);
    
    const monthlyData = result.rows.map(row => ({
      month: parseInt(row.month),
      year: parseInt(row.year),
      income: parseFloat(row.income || 0),
      expenses: parseFloat(row.expenses || 0),
      net: parseFloat(row.net || 0)
    }));

    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    res.status(500).json({ message: 'Server error while fetching monthly data' });
  }
});

module.exports = router;