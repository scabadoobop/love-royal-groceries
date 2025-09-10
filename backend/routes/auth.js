const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../database/connection');
const { generateToken } = require('../middleware/auth');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');
const crypto = require('crypto');

const router = express.Router();

// Validate household key and get household info
router.post('/validate-key', [
  body('keyCode').trim().isLength({ min: 6, max: 20 }).withMessage('Key code must be 6-20 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { keyCode } = req.body;

    const result = await query(
      'SELECT id, name, key_code FROM households WHERE key_code = $1 AND is_active = true',
      [keyCode.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid household key' });
    }

    const household = result.rows[0];
    res.json({ 
      valid: true, 
      household: { 
        id: household.id, 
        name: household.name 
      } 
    });
  } catch (error) {
    console.error('Key validation error:', error);
    res.status(500).json({ error: 'Server error during key validation' });
  }
});

// Register new user (household key optional)
// If householdKey is provided, user joins existing household.
// If not, a new household is created and the user becomes admin.
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('householdKey').optional().trim().isLength({ min: 6, max: 20 }).withMessage('Household key must be 6-20 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, householdKey } = req.body;

    // Check if username or email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user (and household if needed) in a single transaction
    const result = await transaction(async (client) => {
      let targetHouseholdId = null;
      let targetHouseholdName = null;
      let userRole = 'member';

      if (householdKey) {
        // Try to join existing household via key
        const householdResult = await client.query(
          'SELECT id, name FROM households WHERE key_code = $1 AND is_active = true',
          [householdKey.toUpperCase()]
        );

        if (householdResult.rows.length === 0) {
          throw new Error('INVALID_HOUSEHOLD_KEY');
        }
        targetHouseholdId = householdResult.rows[0].id;
        targetHouseholdName = householdResult.rows[0].name;
      } else {
        // Create a new household with a generated key (kept internal)
        const generatedKey = crypto.randomBytes(6).toString('hex').toUpperCase();
        targetHouseholdName = `${username}'s Household`;
        const hh = await client.query(
          'INSERT INTO households (name, key_code) VALUES ($1, $2) RETURNING id',
          [targetHouseholdName, generatedKey]
        );
        targetHouseholdId = hh.rows[0].id;
        userRole = 'admin';
      }

      const userResult = await client.query(
        'INSERT INTO users (username, email, password_hash, household_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, household_id, role, created_at',
        [username, email, passwordHash, targetHouseholdId, userRole]
      );

      return { user: userResult.rows[0], householdName: targetHouseholdName };
    });

    // Generate JWT token
    const token = generateToken(result.id);

    // Send welcome email (optional)
    try {
      await sendWelcomeEmail(email, username, result.householdName || 'Your Household');
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        householdId: result.user.household_id,
        role: result.user.role
      }
    });

  } catch (error) {
    if (error && error.message === 'INVALID_HOUSEHOLD_KEY') {
      return res.status(400).json({ error: 'Invalid household key' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find user by username or email
    const result = await query(
      'SELECT id, username, email, password_hash, household_id, role, is_active, last_login FROM users WHERE (username = $1 OR email = $1) AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        householdId: user.household_id,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Request password reset
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const result = await query(
      'SELECT id, username FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    // Send reset email
    try {
      await sendPasswordResetEmail(email, user.username, resetToken);
    } catch (emailError) {
      console.error('Password reset email failed:', emailError);
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    res.json({ message: 'If the email exists, a reset link has been sent' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

// Reset password with token
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    const result = await query(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

// Get current user profile
router.get('/profile', require('../middleware/auth').authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT u.id, u.username, u.email, u.role, u.created_at, h.name as household_name FROM users u JOIN households h ON u.household_id = h.id WHERE u.id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

module.exports = router;
