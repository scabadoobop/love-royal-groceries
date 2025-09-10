const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireHouseholdAccess } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all grocery items for user's household
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT gi.*, u.username as created_by_name 
       FROM grocery_items gi 
       LEFT JOIN users u ON gi.created_by = u.id 
       WHERE gi.household_id = $1 
       ORDER BY gi.name ASC`,
      [req.user.household_id]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get groceries error:', error);
    res.status(500).json({ error: 'Server error fetching groceries' });
  }
});

// Add new grocery item
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Item name required'),
  body('location').isIn(['fridge', 'pantry']).withMessage('Location must be fridge or pantry'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative integer'),
  body('lowThreshold').isInt({ min: 0 }).withMessage('Low threshold must be non-negative integer'),
  body('category').optional().trim().isLength({ max: 50 }).withMessage('Category max length is 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, location, quantity, lowThreshold, category } = req.body;

    const result = await query(
      `INSERT INTO grocery_items (household_id, name, location, quantity, low_threshold, created_by, category) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [req.user.household_id, name, location, quantity, lowThreshold, req.user.id, category || null]
    );

    res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    console.error('Add grocery error:', error);
    res.status(500).json({ error: 'Server error adding grocery item' });
  }
});

// Update grocery item quantity
router.patch('/:id/quantity', [
  body('delta').isInt().withMessage('Delta must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { delta } = req.body;

    // Get current item
    const currentResult = await query(
      'SELECT quantity FROM grocery_items WHERE id = $1 AND household_id = $2',
      [id, req.user.household_id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newQuantity = Math.max(0, currentResult.rows[0].quantity + delta);

    const result = await query(
      'UPDATE grocery_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND household_id = $3 RETURNING *',
      [newQuantity, id, req.user.household_id]
    );

    res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Update quantity error:', error);
    res.status(500).json({ error: 'Server error updating quantity' });
  }
});

// Update grocery item
router.put('/:id', [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Item name required'),
  body('location').isIn(['fridge', 'pantry']).withMessage('Location must be fridge or pantry'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative integer'),
  body('lowThreshold').isInt({ min: 0 }).withMessage('Low threshold must be non-negative integer'),
  body('category').optional().trim().isLength({ max: 50 }).withMessage('Category max length is 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, location, quantity, lowThreshold, category } = req.body;

    const result = await query(
      `UPDATE grocery_items 
       SET name = $1, location = $2, quantity = $3, low_threshold = $4, category = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 AND household_id = $7 
       RETURNING *`,
      [name, location, quantity, lowThreshold, category || null, id, req.user.household_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Update grocery error:', error);
    res.status(500).json({ error: 'Server error updating grocery item' });
  }
});

// Delete grocery item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM grocery_items WHERE id = $1 AND household_id = $2 RETURNING id',
      [id, req.user.household_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete grocery error:', error);
    res.status(500).json({ error: 'Server error deleting grocery item' });
  }
});

// Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const result = await query(
      `SELECT gi.*, u.username as created_by_name 
       FROM grocery_items gi 
       LEFT JOIN users u ON gi.created_by = u.id 
       WHERE gi.household_id = $1 AND gi.quantity <= gi.low_threshold 
       ORDER BY gi.quantity ASC, gi.name ASC`,
      [req.user.household_id]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Server error fetching low stock items' });
  }
});

// Search grocery items
router.get('/search', async (req, res) => {
  try {
    const { q, location, category } = req.query;
    
    let queryText = `
      SELECT gi.*, u.username as created_by_name 
      FROM grocery_items gi 
      LEFT JOIN users u ON gi.created_by = u.id 
      WHERE gi.household_id = $1
    `;
    const queryParams = [req.user.household_id];
    let paramCount = 1;

    if (q) {
      paramCount++;
      queryText += ` AND gi.name ILIKE $${paramCount}`;
      queryParams.push(`%${q}%`);
    }

    if (location && ['fridge', 'pantry'].includes(location)) {
      paramCount++;
      queryText += ` AND gi.location = $${paramCount}`;
      queryParams.push(location);
    }

    if (category) {
      paramCount++;
      queryText += ` AND gi.category = $${paramCount}`;
      queryParams.push(String(category));
    }

    queryText += ' ORDER BY gi.name ASC';

    const result = await query(queryText, queryParams);
    res.json({ items: result.rows });
  } catch (error) {
    console.error('Search groceries error:', error);
    res.status(500).json({ error: 'Server error searching groceries' });
  }
});

module.exports = router;
