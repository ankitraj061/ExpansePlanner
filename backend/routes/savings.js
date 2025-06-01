// backend/routes/savings.js
const express = require('express');
const { pool } = require('../db'); // Use your existing pool
const router = express.Router();
//routes/savings.js
// Get all savings goals for a user
router.get('/goals/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        id,
        name,
        target_amount,
        current_amount,
        created_at,
        updated_at
       FROM savings_goals 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    const goals = result.rows.map(goal => ({
      id: goal.id,
      name: goal.name,
      targetAmount: parseFloat(goal.target_amount),
      currentAmount: parseFloat(goal.current_amount),
      createdAt: goal.created_at.toISOString().split('T')[0],
      updatedAt: goal.updated_at
    }));

    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error fetching savings goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch savings goals'
    });
  }
});

// Create a new savings goal
router.post('/goals', async (req, res) => {
  try {
    const { userId, name, targetAmount } = req.body;

    // Validation
    if (!userId || !name || !targetAmount) {
      return res.status(400).json({
        success: false,
        message: 'User ID, name, and target amount are required'
      });
    }

    if (targetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be greater than 0'
      });
    }

    const result = await pool.query(
      'INSERT INTO savings_goals (user_id, name, target_amount) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, targetAmount]
    );

    const goal = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      targetAmount: parseFloat(result.rows[0].target_amount),
      currentAmount: parseFloat(result.rows[0].current_amount),
      createdAt: result.rows[0].created_at.toISOString().split('T')[0]
    };

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: goal
    });
  } catch (error) {
    console.error('Error creating savings goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create savings goal'
    });
  }
});

// Add money to savings goal
router.post('/goals/:goalId/add', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { goalId } = req.params;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Update savings goal
    await client.query(
      'UPDATE savings_goals SET current_amount = current_amount + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [amount, goalId]
    );

    // Add transaction record
    await client.query(
      'INSERT INTO savings_transactions (savings_goal_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
      [goalId, amount, 'deposit', description || `Added ₹${amount} to savings`]
    );

    // Get updated goal
    const result = await client.query(
      'SELECT * FROM savings_goals WHERE id = $1',
      [goalId]
    );

    await client.query('COMMIT');

    const updatedGoal = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      targetAmount: parseFloat(result.rows[0].target_amount),
      currentAmount: parseFloat(result.rows[0].current_amount),
      createdAt: result.rows[0].created_at.toISOString().split('T')[0]
    };

    res.json({
      success: true,
      message: `₹${amount} added successfully`,
      data: updatedGoal
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding to savings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to savings'
    });
  } finally {
    client.release();
  }
});

// Delete savings goal
router.delete('/goals/:goalId', async (req, res) => {
  try {
    const { goalId } = req.params;

    // Get goal info before deleting
    const goalResult = await pool.query(
      'SELECT name FROM savings_goals WHERE id = $1',
      [goalId]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    // Delete goal (transactions will be deleted due to CASCADE)
    await pool.query(
      'DELETE FROM savings_goals WHERE id = $1',
      [goalId]
    );

    res.json({
      success: true,
      message: `Savings goal "${goalResult.rows[0].name}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting savings goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete savings goal'
    });
  }
});

// Get savings transactions for a goal
router.get('/goals/:goalId/transactions', async (req, res) => {
  try {
    const { goalId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT 
        id,
        amount,
        transaction_type,
        description,
        created_at
       FROM savings_transactions 
       WHERE savings_goal_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [goalId, parseInt(limit), parseInt(offset)]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM savings_transactions WHERE savings_goal_id = $1',
      [goalId]
    );

    res.json({
      success: true,
      data: {
        transactions: result.rows.map(row => ({
          id: row.id,
          amount: parseFloat(row.amount),
          transactionType: row.transaction_type,
          description: row.description,
          createdAt: row.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// Get savings summary
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_goals,
        COALESCE(SUM(current_amount), 0) as total_saved,
        COALESCE(SUM(target_amount), 0) as total_target,
        SUM(CASE WHEN current_amount >= target_amount THEN 1 ELSE 0 END) as completed_goals
       FROM savings_goals 
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];
    const summary = {
      totalGoals: parseInt(row.total_goals),
      totalSaved: parseFloat(row.total_saved || 0),
      totalTarget: parseFloat(row.total_target || 0),
      completedGoals: parseInt(row.completed_goals),
      averageProgress: row.total_target > 0 
        ? ((row.total_saved / row.total_target) * 100).toFixed(1)
        : 0
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching savings summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch savings summary'
    });
  }
});

module.exports = router;

// Get all savings goals for a user
router.get('/goals/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [rows] = await pool.execute(
      `SELECT 
        id,
        name,
        target_amount,
        current_amount,
        created_at,
        updated_at
       FROM savings_goals 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    const goals = rows.map(goal => ({
      id: goal.id,
      name: goal.name,
      targetAmount: parseFloat(goal.target_amount),
      currentAmount: parseFloat(goal.current_amount),
      createdAt: goal.created_at.toISOString().split('T')[0],
      updatedAt: goal.updated_at
    }));

    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error fetching savings goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch savings goals'
    });
  }
});

// Create a new savings goal
router.post('/goals', async (req, res) => {
  try {
    const { userId, name, targetAmount } = req.body;

    // Validation
    if (!userId || !name || !targetAmount) {
      return res.status(400).json({
        success: false,
        message: 'User ID, name, and target amount are required'
      });
    }

    if (targetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be greater than 0'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO savings_goals (user_id, name, target_amount) VALUES (?, ?, ?)',
      [userId, name, targetAmount]
    );

    // Fetch the created goal
    const [rows] = await pool.execute(
      'SELECT * FROM savings_goals WHERE id = ?',
      [result.insertId]
    );

    const goal = {
      id: rows[0].id,
      name: rows[0].name,
      targetAmount: parseFloat(rows[0].target_amount),
      currentAmount: parseFloat(rows[0].current_amount),
      createdAt: rows[0].created_at.toISOString().split('T')[0]
    };

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: goal
    });
  } catch (error) {
    console.error('Error creating savings goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create savings goal'
    });
  }
});

// Add money to savings goal
router.post('/goals/:goalId/add', async (req, res) => {
  try {
    const { goalId } = req.params;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update savings goal
      await connection.execute(
        'UPDATE savings_goals SET current_amount = current_amount + ?, updated_at = NOW() WHERE id = ?',
        [amount, goalId]
      );

      // Add transaction record
      await connection.execute(
        'INSERT INTO savings_transactions (savings_goal_id, amount, transaction_type, description) VALUES (?, ?, ?, ?)',
        [goalId, amount, 'deposit', description || `Added ₹${amount} to savings`]
      );

      // Get updated goal
      const [rows] = await connection.execute(
        'SELECT * FROM savings_goals WHERE id = ?',
        [goalId]
      );

      await connection.commit();
      connection.release();

      const updatedGoal = {
        id: rows[0].id,
        name: rows[0].name,
        targetAmount: parseFloat(rows[0].target_amount),
        currentAmount: parseFloat(rows[0].current_amount),
        createdAt: rows[0].created_at.toISOString().split('T')[0]
      };

      res.json({
        success: true,
        message: `₹${amount} added successfully`,
        data: updatedGoal
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error adding to savings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to savings'
    });
  }
});

// Delete savings goal
router.delete('/goals/:goalId', async (req, res) => {
  try {
    const { goalId } = req.params;

    // Get goal info before deleting
    const [goalRows] = await pool.execute(
      'SELECT name FROM savings_goals WHERE id = ?',
      [goalId]
    );

    if (goalRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    // Delete goal (transactions will be deleted due to CASCADE)
    await pool.execute(
      'DELETE FROM savings_goals WHERE id = ?',
      [goalId]
    );

    res.json({
      success: true,
      message: `Savings goal "${goalRows[0].name}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting savings goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete savings goal'
    });
  }
});

// Get savings transactions for a goal
router.get('/goals/:goalId/transactions', async (req, res) => {
  try {
    const { goalId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      `SELECT 
        id,
        amount,
        transaction_type,
        description,
        created_at
       FROM savings_transactions 
       WHERE savings_goal_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [goalId, parseInt(limit), parseInt(offset)]
    );

    const [countRows] = await pool.execute(
      'SELECT COUNT(*) as total FROM savings_transactions WHERE savings_goal_id = ?',
      [goalId]
    );

    res.json({
      success: true,
      data: {
        transactions: rows.map(row => ({
          id: row.id,
          amount: parseFloat(row.amount),
          transactionType: row.transaction_type,
          description: row.description,
          createdAt: row.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countRows[0].total,
          totalPages: Math.ceil(countRows[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// Get savings summary
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.execute(
      `SELECT 
        COUNT(*) as total_goals,
        SUM(current_amount) as total_saved,
        SUM(target_amount) as total_target,
        SUM(CASE WHEN current_amount >= target_amount THEN 1 ELSE 0 END) as completed_goals
       FROM savings_goals 
       WHERE user_id = ?`,
      [userId]
    );

    const summary = {
      totalGoals: rows[0].total_goals,
      totalSaved: parseFloat(rows[0].total_saved || 0),
      totalTarget: parseFloat(rows[0].total_target || 0),
      completedGoals: rows[0].completed_goals,
      averageProgress: rows[0].total_target > 0 
        ? ((rows[0].total_saved / rows[0].total_target) * 100).toFixed(1)
        : 0
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching savings summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch savings summary'
    });
  }
});

module.exports = router;