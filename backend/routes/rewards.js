const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Get all rewards for household
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, u.username as created_by_name
       FROM rewards r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.household_id = $1
       ORDER BY r.is_available DESC, r.points_cost ASC`,
      [req.user.household_id]
    );

    res.json({ rewards: result.rows });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ error: 'Server error fetching rewards' });
  }
});

// Get user's redemption history
router.get('/my-redemptions', async (req, res) => {
  try {
    const result = await query(
      `SELECT pr.*, r.name as reward_name, r.description as reward_description
       FROM point_redemptions pr
       JOIN rewards r ON pr.reward_id = r.id
       WHERE pr.user_id = $1
       ORDER BY pr.redeemed_at DESC`,
      [req.user.id]
    );

    res.json({ redemptions: result.rows });
  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({ error: 'Server error fetching redemptions' });
  }
});

// Create reward (admin only)
router.post('/', [
  requireAdmin,
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name required (1-255 characters)'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('points_cost').isInt({ min: 1, max: 10000 }).withMessage('Points cost must be between 1 and 10000'),
  body('stock_quantity').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, points_cost, stock_quantity, is_available } = req.body;

    const result = await query(
      `INSERT INTO rewards (household_id, name, description, points_cost, stock_quantity, is_available, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.household_id, 
        name, 
        description || null, 
        points_cost, 
        stock_quantity || null,
        is_available !== undefined ? is_available : true,
        req.user.id
      ]
    );

    res.status(201).json({ reward: result.rows[0] });
  } catch (error) {
    console.error('Create reward error:', error);
    res.status(500).json({ error: 'Server error creating reward' });
  }
});

// Update reward (admin only)
router.put('/:id', [
  requireAdmin,
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('points_cost').optional().isInt({ min: 1, max: 10000 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('is_available').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, points_cost, stock_quantity, is_available } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (points_cost !== undefined) {
      updates.push(`points_cost = $${paramCount++}`);
      values.push(points_cost);
    }
    if (stock_quantity !== undefined) {
      updates.push(`stock_quantity = $${paramCount++}`);
      values.push(stock_quantity);
    }
    if (is_available !== undefined) {
      updates.push(`is_available = $${paramCount++}`);
      values.push(is_available);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.user.household_id);

    const result = await query(
      `UPDATE rewards 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND household_id = $${paramCount++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    res.json({ reward: result.rows[0] });
  } catch (error) {
    console.error('Update reward error:', error);
    res.status(500).json({ error: 'Server error updating reward' });
  }
});

// Delete reward (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM rewards WHERE id = $1 AND household_id = $2 RETURNING id',
      [id, req.user.household_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    res.json({ message: 'Reward deleted successfully' });
  } catch (error) {
    console.error('Delete reward error:', error);
    res.status(500).json({ error: 'Server error deleting reward' });
  }
});

// Redeem reward (any user)
router.post('/:id/redeem', async (req, res) => {
  try {
    const { id } = req.params;

    // Get reward details
    const rewardResult = await query(
      'SELECT * FROM rewards WHERE id = $1 AND household_id = $2',
      [id, req.user.household_id]
    );

    if (rewardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    const reward = rewardResult.rows[0];

    if (!reward.is_available) {
      return res.status(400).json({ error: 'Reward is not available' });
    }

    // Check stock
    if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
      return res.status(400).json({ error: 'Reward is out of stock' });
    }

    // Get user's available points
    const pointsResult = await query(
      `SELECT 
        COALESCE(SUM(q.points), 0) as total_points
       FROM quest_completions qc
       JOIN quests q ON qc.quest_id = q.id
       WHERE qc.user_id = $1 AND q.household_id = $2`,
      [req.user.id, req.user.household_id]
    );

    const spentResult = await query(
      `SELECT COALESCE(SUM(points_spent), 0) as points_spent
       FROM point_redemptions
       WHERE user_id = $1 AND status != 'cancelled'`,
      [req.user.id]
    );

    const totalPoints = parseInt(pointsResult.rows[0].total_points) || 0;
    const pointsSpent = parseInt(spentResult.rows[0].points_spent) || 0;
    const availablePoints = totalPoints - pointsSpent;

    if (availablePoints < reward.points_cost) {
      return res.status(400).json({ 
        error: 'Insufficient points',
        availablePoints,
        requiredPoints: reward.points_cost
      });
    }

    // Create redemption
    const redemptionResult = await query(
      `INSERT INTO point_redemptions (reward_id, user_id, points_spent)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, req.user.id, reward.points_cost]
    );

    // Update stock if applicable
    if (reward.stock_quantity !== null) {
      await query(
        'UPDATE rewards SET stock_quantity = stock_quantity - 1 WHERE id = $1',
        [id]
      );
    }

    res.status(201).json({ 
      redemption: redemptionResult.rows[0],
      remainingPoints: availablePoints - reward.points_cost
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ error: 'Server error redeeming reward' });
  }
});

module.exports = router;

