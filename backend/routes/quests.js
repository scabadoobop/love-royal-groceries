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
              assigned_user.username as assigned_to_name,
              COUNT(qc.id) as completion_count
       FROM quests q
       LEFT JOIN users u ON q.created_by = u.id
       LEFT JOIN users assigned_user ON q.assigned_to = assigned_user.id
       LEFT JOIN quest_completions qc ON q.id = qc.quest_id
       WHERE q.household_id = $1
       GROUP BY q.id, u.username, assigned_user.username
       ORDER BY q.is_active DESC, q.created_at DESC`,
      [req.user.household_id]
    );

    res.json({ quests: result.rows });
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ error: 'Server error fetching quests' });
  }
});

// Get user's points balance
router.get('/points', async (req, res) => {
  try {
    const result = await query(
      `SELECT points_balance 
       FROM member_points 
       WHERE user_id = $1 AND household_id = $2`,
      [req.user.id, req.user.household_id]
    );

    if (result.rows.length === 0) {
      // Initialize if doesn't exist
      await query(
        `INSERT INTO member_points (user_id, household_id, points_balance)
         VALUES ($1, $2, 0)
         ON CONFLICT (user_id, household_id) DO NOTHING`,
        [req.user.id, req.user.household_id]
      );
      return res.json({ pointsBalance: 0 });
    }

    res.json({ pointsBalance: result.rows[0].points_balance || 0 });
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({ error: 'Server error fetching points' });
  }
});

// Get user's quest progress and points
router.get('/my-progress', async (req, res) => {
  try {
    // Get user's points balance
    const pointsResult = await query(
      `SELECT points_balance 
       FROM member_points 
       WHERE user_id = $1 AND household_id = $2`,
      [req.user.id, req.user.household_id]
    );

    // Get user's completed quests today
    const todayCompletions = await query(
      `SELECT qc.quest_id, q.title, qc.points_awarded as points, qc.completed_at
       FROM quest_completions qc
       JOIN quests q ON qc.quest_id = q.id
       WHERE qc.user_id = $1 
         AND q.household_id = $2
         AND DATE(qc.completed_at) = CURRENT_DATE
       ORDER BY qc.completed_at DESC`,
      [req.user.id, req.user.household_id]
    );

    const pointsBalance = pointsResult.rows.length > 0 ? (pointsResult.rows[0].points_balance || 0) : 0;

    res.json({
      pointsBalance,
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
              COALESCE(mp.points_balance, 0) as total_points,
              COUNT(DISTINCT qc.id) as quests_completed
       FROM users u
       LEFT JOIN member_points mp ON u.id = mp.user_id AND u.household_id = mp.household_id
       LEFT JOIN quest_completions qc ON u.id = qc.user_id
       LEFT JOIN quests q ON qc.quest_id = q.id AND q.household_id = $1
       WHERE u.household_id = $1 AND u.is_active = true
       GROUP BY u.id, u.username, mp.points_balance
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
  body('pointsReward')
    .custom((value) => {
      const num = parseInt(value);
      return !isNaN(num) && Number.isInteger(num) && num >= 1 && num <= 1000;
    })
    .withMessage('Points must be an integer between 1 and 1000'),
  body('frequency').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Frequency must be daily, weekly, or monthly'),
  body('assignedTo').optional().custom((value) => {
    if (value === null || value === '' || value === undefined) return true;
    // Basic UUID format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }).withMessage('assignedTo must be a valid user ID or null/empty for all')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, pointsReward, frequency, assignedTo } = req.body;
    
    // Ensure pointsReward is an integer
    const pointsValue = parseInt(pointsReward);
    if (isNaN(pointsValue) || pointsValue < 1 || pointsValue > 1000) {
      return res.status(400).json({ error: 'Points must be an integer between 1 and 1000' });
    }

    // Normalize assignedTo: convert empty string to null
    const normalizedAssignedTo = (assignedTo === '' || assignedTo === undefined) ? null : assignedTo;

    // Validate assignedTo belongs to household if provided
    if (normalizedAssignedTo) {
      const userCheck = await query(
        'SELECT id FROM users WHERE id = $1 AND household_id = $2',
        [normalizedAssignedTo, req.user.household_id]
      );
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ error: 'assignedTo user must belong to the same household' });
      }
    }

    const result = await query(
      `INSERT INTO quests (household_id, title, description, points, frequency, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.household_id, 
        title, 
        description || null, 
        pointsValue, 
        frequency || 'daily',
        normalizedAssignedTo,
        req.user.id
      ]
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
  body('pointsReward').optional().custom((value) => {
    if (value === undefined || value === null) return true;
    const num = parseInt(value);
    return !isNaN(num) && Number.isInteger(num) && num >= 1 && num <= 1000;
  }).withMessage('Points must be an integer between 1 and 1000'),
  body('frequency').optional().isIn(['daily', 'weekly', 'monthly']),
  body('assignedTo').optional().custom((value) => {
    if (value === null || value === '') return true;
    // Basic UUID format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }).withMessage('assignedTo must be a valid user ID or null'),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, pointsReward, frequency, assignedTo, is_active } = req.body;

    // Validate assignedTo belongs to household if provided
    if (assignedTo !== null && assignedTo !== undefined && assignedTo !== '') {
      const userCheck = await query(
        'SELECT id FROM users WHERE id = $1 AND household_id = $2',
        [assignedTo, req.user.household_id]
      );
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ error: 'assignedTo user must belong to the same household' });
      }
    }

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
    if (pointsReward !== undefined) {
      const pointsValue = parseInt(pointsReward);
      if (isNaN(pointsValue) || pointsValue < 1 || pointsValue > 1000) {
        return res.status(400).json({ error: 'Points must be an integer between 1 and 1000' });
      }
      updates.push(`points = $${paramCount++}`);
      values.push(pointsValue);
    }
    if (frequency !== undefined) {
      updates.push(`frequency = $${paramCount++}`);
      values.push(frequency);
    }
    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramCount++}`);
      values.push(assignedTo || null);
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
      'SELECT id, points, is_active, assigned_to, frequency FROM quests WHERE id = $1 AND household_id = $2',
      [id, req.user.household_id]
    );

    if (questResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    const quest = questResult.rows[0];

    if (!quest.is_active) {
      return res.status(400).json({ error: 'Quest is not active' });
    }

    // Check if quest is assigned to this user or to all (null)
    if (quest.assigned_to !== null && quest.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'Quest is not assigned to you' });
    }

    // Check frequency-based completion limits
    let dateCheck = '';
    if (quest.frequency === 'daily') {
      dateCheck = 'DATE(completed_at) = CURRENT_DATE';
    } else if (quest.frequency === 'weekly') {
      dateCheck = `DATE_TRUNC('week', completed_at) = DATE_TRUNC('week', CURRENT_DATE)`;
    } else if (quest.frequency === 'monthly') {
      dateCheck = `DATE_TRUNC('month', completed_at) = DATE_TRUNC('month', CURRENT_DATE)`;
    }

    // Check if already completed in this period
    if (dateCheck) {
      const existingResult = await query(
        `SELECT id FROM quest_completions 
         WHERE quest_id = $1 AND user_id = $2 AND ${dateCheck}`,
        [id, req.user.id]
      );

      if (existingResult.rows.length > 0) {
        return res.status(400).json({ 
          error: `Quest already completed this ${quest.frequency}` 
        });
      }
    }

    // Record completion with points snapshot
    const completionResult = await query(
      `INSERT INTO quest_completions (quest_id, user_id, points_awarded)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, req.user.id, quest.points]
    );

    // Update or create member_points record
    await query(
      `INSERT INTO member_points (user_id, household_id, points_balance)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, household_id) 
       DO UPDATE SET points_balance = member_points.points_balance + $3,
                     updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, req.user.household_id, quest.points]
    );

    res.status(201).json({ 
      completion: completionResult.rows[0],
      pointsAwarded: quest.points
    });
  } catch (error) {
    console.error('Complete quest error:', error);
    res.status(500).json({ error: 'Server error completing quest' });
  }
});

module.exports = router;



