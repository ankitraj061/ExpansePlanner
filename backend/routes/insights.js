const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getUserTransactions } = require('../services/transactionService');

// Helper: Group by month and category
const groupByMonthAndCategory = (transactions) => {
  const grouped = {};
  
  transactions.forEach(({ amount, category, date }) => {
    const month = new Date(date).toISOString().slice(0, 7); // e.g. "2025-06"
    if (!grouped[month]) grouped[month] = {};
    if (!grouped[month][category]) grouped[month][category] = 0;
    grouped[month][category] += Math.abs(amount); // Ensure positive amounts for expenses
  });
  
  return grouped;
};

// Helper: Generate Insights
const getInsights = (grouped) => {
  const months = Object.keys(grouped).sort().reverse(); // latest first
  const insights = [];
  
  // Handle case with no data
  if (months.length === 0) {
    return [{
      type: 'info',
      message: 'No transaction data available to generate insights.'
    }];
  }
  
  // Handle case with only one month of data
  if (months.length === 1) {
    const currentMonth = months[0];
    const monthName = new Date(currentMonth + '-01').toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    const totalExpenses = Object.values(grouped[currentMonth]).reduce((sum, amt) => sum + amt, 0);
    const categoryCount = Object.keys(grouped[currentMonth]).length;
    
    return [
      {
        type: 'summary',
        message: `For ${monthName}, you spent a total of ₹${totalExpenses.toFixed(2)} across ${categoryCount} categories.`
      },
      {
        type: 'info',
        message: 'Need at least 2 months of data to provide comparison insights.'
      }
    ];
  }
  
  const [thisMonth, lastMonth] = months;
  const thisMonthName = new Date(thisMonth + '-01').toLocaleDateString('en-US', { month: 'long' });
  const lastMonthName = new Date(lastMonth + '-01').toLocaleDateString('en-US', { month: 'long' });
  
  const thisData = grouped[thisMonth] || {};
  const lastData = grouped[lastMonth] || {};
  
  // Calculate totals for overall comparison
  const thisMonthTotal = Object.values(thisData).reduce((sum, amt) => sum + amt, 0);
  const lastMonthTotal = Object.values(lastData).reduce((sum, amt) => sum + amt, 0);
  
  // Overall spending comparison
  if (lastMonthTotal === 0 && thisMonthTotal > 0) {
    insights.push({
      type: 'alert',
      message: `You started spending this month after no expenses in ${lastMonthName}. Total spent: ₹${thisMonthTotal.toFixed(2)}.`
    });
  } else if (thisMonthTotal === 0 && lastMonthTotal > 0) {
    insights.push({
      type: 'positive',
      message: `Great! You had no expenses this month compared to ₹${lastMonthTotal.toFixed(2)} spent in ${lastMonthName}.`
    });
  } else if (thisMonthTotal > 0 && lastMonthTotal > 0) {
    const overallChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    
    if (overallChange > 10) {
      insights.push({
        type: 'warning',
        message: `Your overall spending increased by ${overallChange.toFixed(1)}% compared to ${lastMonthName} (₹${thisMonthTotal.toFixed(2)} vs ₹${lastMonthTotal.toFixed(2)}).`
      });
    } else if (overallChange < -10) {
      insights.push({
        type: 'positive',
        message: `Great! Your overall spending decreased by ${Math.abs(overallChange.toFixed(1))}% compared to ${lastMonthName} (₹${thisMonthTotal.toFixed(2)} vs ₹${lastMonthTotal.toFixed(2)}).`
      });
    } else {
      insights.push({
        type: 'neutral',
        message: `Your spending remained relatively stable compared to ${lastMonthName} (₹${thisMonthTotal.toFixed(2)} vs ₹${lastMonthTotal.toFixed(2)}).`
      });
    }
  }
  
  // Category-specific insights
  const allCategories = new Set([...Object.keys(thisData), ...Object.keys(lastData)]);
  
  allCategories.forEach(category => {
    const thisAmt = thisData[category] || 0;
    const lastAmt = lastData[category] || 0;
    
    if (lastAmt === 0 && thisAmt > 0) {
      insights.push({
        type: 'info',
        message: `New spending category: You spent ₹${thisAmt.toFixed(2)} on '${category}' this month.`
      });
    } else if (thisAmt === 0 && lastAmt > 0) {
      insights.push({
        type: 'positive',
        message: `You eliminated spending on '${category}' this month (was ₹${lastAmt.toFixed(2)} in ${lastMonthName}).`
      });
    } else if (thisAmt > 0 && lastAmt > 0) {
      const change = ((thisAmt - lastAmt) / lastAmt) * 100;
      
      if (change > 25) {
        insights.push({
          type: 'warning',
          message: `'${category}' expenses increased significantly by ${change.toFixed(1)}% (₹${thisAmt.toFixed(2)} vs ₹${lastAmt.toFixed(2)}).`
        });
      } else if (change < -25) {
        insights.push({
          type: 'positive',
          message: `'${category}' expenses decreased by ${Math.abs(change.toFixed(1))}% (₹${thisAmt.toFixed(2)} vs ₹${lastAmt.toFixed(2)}).`
        });
      }
    }
  });
  
  // If no specific insights were generated, provide a summary
  if (insights.length === 0) {
    insights.push({
      type: 'neutral',
      message: `Your spending patterns are consistent between ${lastMonthName} and ${thisMonthName}.`
    });
  }
  
  return insights;
};

// GET /api/insights
router.get('/', async (req, res) => {
  try {
    // Verify JWT token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ 
        error: "Access token required",
        insights: []
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    // Get user transactions
    const transactions = await getUserTransactions(userId);
    
    // Handle empty transactions
    if (!transactions || transactions.length === 0) {
      return res.json({
        insights: [{
          type: 'info',
          message: 'No transactions found. Start adding expenses to get personalized insights!'
        }],
        summary: {
          totalMonths: 0,
          totalTransactions: 0
        }
      });
    }
    
    // Generate insights
    const grouped = groupByMonthAndCategory(transactions);
    const insights = getInsights(grouped);
    
    // Add summary information
    const summary = {
      totalMonths: Object.keys(grouped).length,
      totalTransactions: transactions.length,
      dateRange: {
        earliest: transactions.reduce((min, t) => t.date < min ? t.date : min, transactions[0].date),
        latest: transactions.reduce((max, t) => t.date > max ? t.date : max, transactions[0].date)
      }
    };
    
    res.json({ 
      insights,
      summary,
      success: true
    });
    
  } catch (err) {
    console.error("Error generating insights:", err.message);
    
    // Handle specific JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: "Invalid access token",
        insights: []
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: "Access token expired",
        insights: []
      });
    }
    
    res.status(500).json({ 
      error: "Failed to generate insights. Please try again later.",
      insights: [],
      success: false
    });
  }
});

module.exports = router;