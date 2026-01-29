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

// Request redemption (any user) - creates pending redemption
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

    // Get user's available points from member_points (initialize if needed)
    let pointsResult = await query(
      `SELECT points_balance 
       FROM member_points 
       WHERE user_id = $1 AND household_id = $2`,
      [req.user.id, req.user.household_id]
    );

    let availablePoints = 0;
    if (pointsResult.rows.length === 0) {
      // Initialize member_points if it doesn't exist
      await query(
        `INSERT INTO member_points (user_id, household_id, points_balance)
         VALUES ($1, $2, 0)`,
        [req.user.id, req.user.household_id]
      );
    } else {
      availablePoints = pointsResult.rows[0].points_balance || 0;
    }

    if (availablePoints < reward.points_cost) {
      return res.status(400).json({ 
        error: 'Insufficient points',
        availablePoints,
        requiredPoints: reward.points_cost
      });
    }

    // Create redemption with pending status (points NOT deducted yet)
    const redemptionResult = await query(
      `INSERT INTO point_redemptions (reward_id, user_id, points_spent, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [id, req.user.id, reward.points_cost]
    );

    res.status(201).json({ 
      redemption: redemptionResult.rows[0],
      availablePoints
    });
  } catch (error) {
    console.error('Request redemption error:', error);
    res.status(500).json({ error: 'Server error requesting redemption' });
  }
});

// Get all redemptions for household (admin only)
router.get('/redemptions', requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT pr.*, 
              r.name as reward_name, 
              r.description as reward_description,
              u.username as user_name
       FROM point_redemptions pr
       JOIN rewards r ON pr.reward_id = r.id
       JOIN users u ON pr.user_id = u.id
       WHERE r.household_id = $1
       ORDER BY pr.redeemed_at DESC`,
      [req.user.household_id]
    );

    res.json({ redemptions: result.rows });
  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({ error: 'Server error fetching redemptions' });
  }
});

// Update redemption status (admin only)
router.put('/redemptions/:id', [
  requireAdmin,
  body('status').isIn(['pending', 'approved', 'denied', 'fulfilled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Get redemption details
    const redemptionResult = await query(
      `SELECT pr.*, r.household_id
       FROM point_redemptions pr
       JOIN rewards r ON pr.reward_id = r.id
       WHERE pr.id = $1`,
      [id]
    );

    if (redemptionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Redemption not found' });
    }

    const redemption = redemptionResult.rows[0];

    // Verify household access
    if (redemption.household_id !== req.user.household_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const oldStatus = redemption.status;

    // Update status
    const updateResult = await query(
      `UPDATE point_redemptions 
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    // If status changed to approved, deduct points
    if (oldStatus !== 'approved' && status === 'approved') {
      // Initialize member_points if it doesn't exist
      await query(
        `INSERT INTO member_points (user_id, household_id, points_balance)
         SELECT $2, $3, 0
         WHERE NOT EXISTS (
           SELECT 1 FROM member_points WHERE user_id = $2 AND household_id = $3
         )`,
        [redemption.points_spent, redemption.user_id, redemption.household_id]
      );
      
      await query(
        `UPDATE member_points 
         SET points_balance = points_balance - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND household_id = $3`,
        [redemption.points_spent, redemption.user_id, redemption.household_id]
      );

      // Update stock if applicable
      await query(
        `UPDATE rewards 
         SET stock_quantity = stock_quantity - 1 
         WHERE id = $1 AND stock_quantity IS NOT NULL`,
        [redemption.reward_id]
      );
    }

    // If status changed from approved to something else, refund points
    if (oldStatus === 'approved' && status !== 'approved') {
      await query(
        `UPDATE member_points 
         SET points_balance = points_balance + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND household_id = $3`,
        [redemption.points_spent, redemption.user_id, redemption.household_id]
      );

      // Restore stock if applicable
      await query(
        `UPDATE rewards 
         SET stock_quantity = stock_quantity + 1 
         WHERE id = $1 AND stock_quantity IS NOT NULL`,
        [redemption.reward_id]
      );
    }

    res.json({ redemption: updateResult.rows[0] });
  } catch (error) {
    console.error('Update redemption error:', error);
    res.status(500).json({ error: 'Server error updating redemption' });
  }
});

module.exports = router;



