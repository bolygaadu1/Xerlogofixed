const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { pool } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const connection = await pool.getConnection();
    
    const [users] = await connection.execute(
      'SELECT * FROM admin_users WHERE username = ?',
      [username]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Verify token endpoint
router.get('/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = { router, verifyToken };