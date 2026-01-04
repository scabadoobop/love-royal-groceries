const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const userResult = await query(
      'SELECT id, username, email, household_id, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    if (!user.is_active) {
      return res.status(401).json({ error: 'User account is disabled' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Check if user is household admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Check if user belongs to the household
const requireHouseholdAccess = async (req, res, next) => {
  const householdId = req.params.householdId || req.body.householdId;
  
  if (!householdId) {
    return res.status(400).json({ error: 'Household ID required' });
  }

  if (req.user.household_id !== householdId) {
    return res.status(403).json({ error: 'Access denied to this household' });
  }

  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token (for future implementation)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireHouseholdAccess,
  generateToken,
  generateRefreshToken
};
