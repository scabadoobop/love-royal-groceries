const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Get all quests for household
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT q.*, 
              u.username as created_by_name,
              COUNT(qc.id) as completion_count
       FROM quests q
       LEFT JOIN users u ON q.created_by = u.id
       LEFT JOIN quest_completions qc ON q.id = qc.quest_id
       WHERE q.household_id = $1
       GROUP BY q.id, u.username
       ORDER BY q.is_active DESC, q.created_at DESC`,
      [req.user.household_id]
    );

    res.json({ quests: result.rows });
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ error: 'Server error fetching quests' });
  }
});

// Get user's quest progress and points
router.get('/my-progress', async (req, res) => {
  try {
    // Get user's total points from completed quests
    const pointsResult = await query(
      `SELECT COALESCE(SUM(q.points), 0) as total_points
       FROM quest_completions qc
       JOIN quests q ON qc.quest_id = q.id
       WHERE qc.user_id = $1 AND q.household_id = $2`,
      [req.user.id, req.user.household_id]
    );

    // Get points spent on redemptions
    const spentResult = await query(
      `SELECT COALESCE(SUM(points_spent), 0) as points_spent
       FROM point_redemptions
       WHERE user_id = $1 AND status != 'cancelled'`,
      [req.user.id]
    );

    // Get user's completed quests today
    const todayCompletions = await query(
      `SELECT qc.quest_id, q.title, q.points, qc.completed_at
       FROM quest_completions qc
       JOIN quests q ON qc.quest_id = q.id
       WHERE qc.user_id = $1 
         AND q.household_id = $2
         AND DATE(qc.completed_at) = CURRENT_DATE
       ORDER BY qc.completed_at DESC`,
      [req.user.id, req.user.household_id]
    );

    const totalPoints = parseInt(pointsResult.rows[0].total_points) || 0;
    const pointsSpent = parseInt(spentResult.rows[0].points_spent) || 0;
    const availablePoints = totalPoints - pointsSpent;

    res.json({
      totalPoints,
      pointsSpent,
      availablePoints,
      todayCompletions: todayCompletions.rows
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Server error fetching progress' });
  }
});

// Get all users' points leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.username,
              COALESCE(SUM(q.points), 0) as total_points,
              COUNT(DISTINCT qc.id) as quests_completed
       FROM users u
       LEFT JOIN quest_completions qc ON u.id = qc.user_id
       LEFT JOIN quests q ON qc.quest_id = q.id AND q.household_id = $1
       WHERE u.household_id = $1 AND u.is_active = true
       GROUP BY u.id, u.username
       ORDER BY total_points DESC, quests_completed DESC`,
      [req.user.household_id]
    );

    res.json({ leaderboard: result.rows });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
});

// Create quest (admin only)
router.post('/', [
  requireAdmin,
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title required (1-255 characters)'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('points').isInt({ min: 1, max: 1000 }).withMessage('Points must be between 1 and 1000')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, points } = req.body;

    const result = await query(
      `INSERT INTO quests (household_id, title, description, points, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.household_id, title, description || null, points || 10, req.user.id]
    );

    res.status(201).json({ quest: result.rows[0] });
  } catch (error) {
    console.error('Create quest error:', error);
    res.status(500).json({ error: 'Server error creating quest' });
  }
});

// Update quest (admin only)
router.put('/:id', [
  requireAdmin,
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('points').optional().isInt({ min: 1, max: 1000 }),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, points, is_active } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (points !== undefined) {
      updates.push(`points = $${paramCount++}`);
      values.push(points);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.user.household_id);

    const result = await query(
      `UPDATE quests 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND household_id = $${paramCount++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    res.json({ quest: result.rows[0] });
  } catch (error) {
    console.error('Update quest error:', error);
    res.status(500).json({ error: 'Server error updating quest' });
  }
});

// Delete quest (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM quests WHERE id = $1 AND household_id = $2 RETURNING id',
      [id, req.user.household_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    res.json({ message: 'Quest deleted successfully' });
  } catch (error) {
    console.error('Delete quest error:', error);
    res.status(500).json({ error: 'Server error deleting quest' });
  }
});

// Complete quest (any user)
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify quest exists and is active
    const questResult = await query(
      'SELECT id, points, is_active FROM quests WHERE id = $1 AND household_id = $2',
      [id, req.user.household_id]
    );

    if (questResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    if (!questResult.rows[0].is_active) {
      return res.status(400).json({ error: 'Quest is not active' });
    }

    // Check if already completed today
    const existingResult = await query(
      `SELECT id FROM quest_completions 
       WHERE quest_id = $1 AND user_id = $2 AND DATE(completed_at) = CURRENT_DATE`,
      [id, req.user.id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Quest already completed today' });
    }

    // Record completion
    const completionResult = await query(
      `INSERT INTO quest_completions (quest_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [id, req.user.id]
    );

    res.status(201).json({ 
      completion: completionResult.rows[0],
      pointsEarned: questResult.rows[0].points
    });
  } catch (error) {
    console.error('Complete quest error:', error);
    res.status(500).json({ error: 'Server error completing quest' });
  }
});

module.exports = router;

