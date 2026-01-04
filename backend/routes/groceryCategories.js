const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// List categories
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, created_at FROM grocery_categories WHERE household_id = $1 ORDER BY name ASC',
      [req.user.household_id]
    );
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
});

// Create category (admin)
router.post('/', [requireAdmin, body('name').trim().isLength({ min: 1, max: 50 })], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name } = req.body;
    const result = await query(
      'INSERT INTO grocery_categories (household_id, name) VALUES ($1, $2) RETURNING id, name, created_at',
      [req.user.household_id, name]
    );
    res.status(201).json({ category: result.rows[0] });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Server error creating category' });
  }
});

// Delete category (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM grocery_categories WHERE id = $1 AND household_id = $2 RETURNING id',
      [id, req.user.household_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Server error deleting category' });
  }
});

module.exports = router;

