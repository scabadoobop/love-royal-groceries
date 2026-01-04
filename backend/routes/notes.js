const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all notes for user's household
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT n.*, u.username as author_name 
       FROM notes n 
       JOIN users u ON n.author_id = u.id 
       WHERE n.household_id = $1 
       ORDER BY n.created_at DESC`,
      [req.user.household_id]
    );

    res.json({ notes: result.rows });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Server error fetching notes' });
  }
});

// Add new note
router.post('/', [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Note content required (1-1000 characters)'),
  body('noteType').isIn(['personal', 'family']).withMessage('Note type must be personal or family')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, noteType } = req.body;

    const result = await query(
      `INSERT INTO notes (household_id, author_id, content, note_type) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *, (SELECT username FROM users WHERE id = $2) as author_name`,
      [req.user.household_id, req.user.id, content, noteType]
    );

    res.status(201).json({ note: result.rows[0] });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Server error adding note' });
  }
});

// Delete note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user can delete this note (author or admin)
    const noteResult = await query(
      'SELECT author_id FROM notes WHERE id = $1 AND household_id = $2',
      [id, req.user.household_id]
    );

    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = noteResult.rows[0];
    
    // Allow deletion if user is the author or an admin
    if (note.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this note' });
    }

    await query(
      'DELETE FROM notes WHERE id = $1 AND household_id = $2',
      [id, req.user.household_id]
    );

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Server error deleting note' });
  }
});

module.exports = router;
