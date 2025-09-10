const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// List doodles
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, u.username as author_name
       FROM doodles d JOIN users u ON d.author_id = u.id
       WHERE d.household_id = $1
       ORDER BY d.created_at DESC`,
      [req.user.household_id]
    );
    res.json({ doodles: result.rows });
  } catch (error) {
    console.error('List doodles error:', error);
    res.status(500).json({ error: 'Server error fetching doodles' });
  }
});

// Create doodle (base64 image data URL)
router.post('/', [
  body('imageData').isString().isLength({ min: 50 }).withMessage('Image data required'),
  body('noteType').isIn(['personal', 'family']).withMessage('Type must be personal or family')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { imageData, noteType } = req.body;
    const result = await query(
      `INSERT INTO doodles (household_id, author_id, image_data, note_type)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [req.user.household_id, req.user.id, imageData, noteType]
    );
    res.status(201).json({ id: result.rows[0].id, created_at: result.rows[0].created_at });
  } catch (error) {
    console.error('Create doodle error:', error);
    res.status(500).json({ error: 'Server error creating doodle' });
  }
});

// Delete doodle (author or admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const own = await query('SELECT author_id FROM doodles WHERE id = $1 AND household_id = $2', [id, req.user.household_id]);
    if (own.rows.length === 0) return res.status(404).json({ error: 'Doodle not found' });
    if (own.rows[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await query('DELETE FROM doodles WHERE id = $1 AND household_id = $2', [id, req.user.household_id]);
    res.json({ message: 'Doodle deleted' });
  } catch (error) {
    console.error('Delete doodle error:', error);
    res.status(500).json({ error: 'Server error deleting doodle' });
  }
});

module.exports = router;

