const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { pool, initDB } = require('./db');
require('dotenv').config();
const userRoutes = require('./routes/user');
const jwt = require('jsonwebtoken');
const incomeRoutes = require('./routes/income');
const expensesRoutes = require('./routes/expenses');
const moneyReceivedRoutes = require('./routes/moneyReceived');
const moneyGivenRoutes = require('./routes/moneyGiven');
const savingsRoutes = require('./routes/savings');
const transactionsRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use('/api/user', userRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/money-received', moneyReceivedRoutes);
app.use('/api/money-given', moneyGivenRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/transactions', transactionsRoutes);


// Init DB table
initDB();

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
  { id: user.id },                 // Payload
  process.env.JWT_SECRET,         // Secret key
  { expiresIn: '1h' }             // Token validity
);

    res.status(200).json({ message: 'Login successful', token: token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

app.listen(PORT,'0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

