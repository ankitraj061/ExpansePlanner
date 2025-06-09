const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDB = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);
    console.log('✅ Users table is ready');

    // Create income table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS income (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        income_type VARCHAR(50) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Income table is ready');

    await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      category VARCHAR(50) NOT NULL, -- food, travel, education, furniture, party, clothes, other
      description TEXT,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
    console.log('✅ Expenses table is ready');

    await pool.query(`
    CREATE TABLE IF NOT EXISTS money_received (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      person_name VARCHAR(100) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      date DATE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
    console.log('✅ Money Received table is ready');

    await pool.query(`
    CREATE TABLE IF NOT EXISTS money_given (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      person_name VARCHAR(100) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      date DATE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
    console.log('✅ Money Given table is ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        target_amount DECIMAL(15, 2) NOT NULL,
        current_amount DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Savings Goals table is ready');

    // Create savings_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS savings_transactions (
        id SERIAL PRIMARY KEY,
        savings_goal_id INTEGER REFERENCES savings_goals(id) ON DELETE CASCADE,
        amount DECIMAL(15, 2) NOT NULL,
        transaction_type VARCHAR(20) DEFAULT 'deposit' CHECK (transaction_type IN ('deposit', 'withdrawal')),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Savings Transactions table is ready');

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_savings_goals_created_at ON savings_goals(created_at);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_savings_transactions_goal_id ON savings_transactions(savings_goal_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_savings_transactions_created_at ON savings_transactions(created_at);
    `);
    console.log('✅ Savings indexes created');

    // Create trigger function for updating updated_at timestamp
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for savings_goals
    await pool.query(`
      DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON savings_goals;
      CREATE TRIGGER update_savings_goals_updated_at 
          BEFORE UPDATE ON savings_goals 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Savings triggers created');

  } catch (err) {
    console.error('❌ Error initializing DB:', err);
  }
};

module.exports = { pool, initDB };
