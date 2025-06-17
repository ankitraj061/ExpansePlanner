const { pool } = require('../db');

const getUserTransactions = async (userId) => {
  console.log("Getting Insights for User ID:", userId);
  try {
    const result = await pool.query(
      `
      SELECT amount, category, date
      FROM expenses
      WHERE user_id = $1
      ORDER BY date DESC
      `,
      [userId]
    );
    console.log("Transactions fetched successfully:", result.rows.length);
    return result.rows;
  } catch (err) {
    console.error("❌ Error in getUserTransactions:", err);
    throw err;
  }
};

module.exports = { getUserTransactions };
