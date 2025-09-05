const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get household info
router.get('/info', async (req, res) => {
  try {
    const result = await query(
      `SELECT h.id, h.name, h.key_code, h.created_at, 
              COUNT(u.id) as member_count
       FROM households h 
       LEFT JOIN users u ON h.id = u.household_id AND u.is_active = true
       WHERE h.id = $1 
       GROUP BY h.id, h.name, h.key_code, h.created_at`,
      [req.user.household_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json({ household: result.rows[0] });
  } catch (error) {
    console.error('Get household info error:', error);
    res.status(500).json({ error: 'Server error fetching household info' });
  }
});

// Get household members
router.get('/members', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, username, email, role, created_at, last_login
       FROM users 
       WHERE household_id = $1 AND is_active = true 
       ORDER BY created_at ASC`,
      [req.user.household_id]
    );

    res.json({ members: result.rows });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Server error fetching members' });
  }
});

// Generate new household key (admin only)
router.post('/regenerate-key', requireAdmin, async (req, res) => {
  try {
    const newKey = crypto.randomBytes(8).toString('hex').toUpperCase();
    
    const result = await query(
      'UPDATE households SET key_code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING key_code',
      [newKey, req.user.household_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json({ 
      message: 'Household key regenerated successfully',
      newKey: result.rows[0].key_code 
    });
  } catch (error) {
    console.error('Regenerate key error:', error);
    res.status(500).json({ error: 'Server error regenerating key' });
  }
});

// Update household name (admin only)
router.put('/name', [
  requireAdmin,
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Household name required (1-100 characters)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    const result = await query(
      'UPDATE households SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING name',
      [name, req.user.household_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json({ 
      message: 'Household name updated successfully',
      name: result.rows[0].name 
    });
  } catch (error) {
    console.error('Update household name error:', error);
    res.status(500).json({ error: 'Server error updating household name' });
  }
});

module.exports = router;
