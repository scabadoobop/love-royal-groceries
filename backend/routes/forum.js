const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get forum categories
router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      `SELECT fc.*, 
              COUNT(ft.id) as thread_count,
              MAX(ft.updated_at) as last_activity
       FROM forum_categories fc 
       LEFT JOIN forum_threads ft ON fc.id = ft.category_id AND ft.household_id = $1
       WHERE fc.household_id = $1 OR fc.household_id = '00000000-0000-0000-0000-000000000000'
       GROUP BY fc.id, fc.name, fc.description, fc.created_at
       ORDER BY fc.name ASC`,
      [req.user.household_id]
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
});

// Get threads for a category
router.get('/categories/:categoryId/threads', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    // Filter out expired threads
    const result = await query(
      `SELECT ft.*, u.username as author_name,
              COUNT(fp.id) as post_count,
              MAX(fp.created_at) as last_post_at
       FROM forum_threads ft
       JOIN users u ON ft.author_id = u.id
       LEFT JOIN forum_posts fp ON ft.id = fp.thread_id
       WHERE ft.category_id = $1 
         AND ft.household_id = $2
         AND (ft.expires_at IS NULL OR ft.expires_at > CURRENT_TIMESTAMP)
       GROUP BY ft.id, u.username
       ORDER BY ft.is_pinned DESC, ft.updated_at DESC
       LIMIT $3 OFFSET $4`,
      [categoryId, req.user.household_id, limit, offset]
    );

    res.json({ threads: result.rows });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({ error: 'Server error fetching threads' });
  }
});

// Create new thread
router.post('/threads', [
  body('categoryId').isUUID().withMessage('Valid category ID required'),
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Thread title required (1-255 characters)'),
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Thread content required (1-5000 characters)'),
  body('expiresAt').optional().isISO8601().withMessage('Expiration date must be valid ISO8601 date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { categoryId, title, content, expiresAt } = req.body;

    const result = await query(
      `INSERT INTO forum_threads (category_id, household_id, author_id, title, content, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *, (SELECT username FROM users WHERE id = $3) as author_name`,
      [categoryId, req.user.household_id, req.user.id, title, content, expiresAt || null]
    );

    res.status(201).json({ thread: result.rows[0] });
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({ error: 'Server error creating thread' });
  }
});

// Get thread with posts
router.get('/threads/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    // Get thread info
    const threadResult = await query(
      `SELECT ft.*, u.username as author_name, fc.name as category_name
       FROM forum_threads ft
       JOIN users u ON ft.author_id = u.id
       JOIN forum_categories fc ON ft.category_id = fc.id
       WHERE ft.id = $1 AND ft.household_id = $2`,
      [threadId, req.user.household_id]
    );

    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Get posts
    const postsResult = await query(
      `SELECT fp.*, u.username as author_name
       FROM forum_posts fp
       JOIN users u ON fp.author_id = u.id
       WHERE fp.thread_id = $1
       ORDER BY fp.created_at ASC
       LIMIT $2 OFFSET $3`,
      [threadId, limit, offset]
    );

    res.json({ 
      thread: threadResult.rows[0],
      posts: postsResult.rows 
    });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ error: 'Server error fetching thread' });
  }
});

// Add post to thread
router.post('/threads/:threadId/posts', [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Post content required (1-2000 characters)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { threadId } = req.params;
    const { content } = req.body;

    // Verify thread exists and user has access
    const threadResult = await query(
      'SELECT id FROM forum_threads WHERE id = $1 AND household_id = $2',
      [threadId, req.user.household_id]
    );

    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const result = await query(
      `INSERT INTO forum_posts (thread_id, author_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *, (SELECT username FROM users WHERE id = $2) as author_name`,
      [threadId, req.user.id, content]
    );

    // Update thread's updated_at timestamp
    await query(
      'UPDATE forum_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [threadId]
    );

    res.status(201).json({ post: result.rows[0] });
  } catch (error) {
    console.error('Add post error:', error);
    res.status(500).json({ error: 'Server error adding post' });
  }
});

// Pin/unpin thread (admin only)
router.patch('/threads/:threadId/pin', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { isPinned } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can pin/unpin threads' });
    }

    // Verify thread exists and belongs to household
    const threadResult = await query(
      'SELECT id FROM forum_threads WHERE id = $1 AND household_id = $2',
      [threadId, req.user.household_id]
    );

    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const result = await query(
      `UPDATE forum_threads 
       SET is_pinned = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND household_id = $3
       RETURNING *`,
      [isPinned, threadId, req.user.household_id]
    );

    res.json({ thread: result.rows[0] });
  } catch (error) {
    console.error('Pin thread error:', error);
    res.status(500).json({ error: 'Server error pinning thread' });
  }
});

module.exports = router;
