'use strict';
const express    = require('express');
const router     = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/', authenticate, async (req, res) => {
  try {
    const { book_id, rating, comment = '' } = req.body;
    const userId = req.user.id;

    if (!book_id || !rating)
      return res.status(400).json({ success: false, message: 'book_id and rating required' });

    if (rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });

    const db = require('../config/db');

    // Upsert — nếu đã review thì update, chưa thì insert
    const [[existing]] = await db.query(
      'SELECT id FROM reviews WHERE user_id = ? AND book_id = ?',
      [userId, book_id]
    );

    if (existing) {
      await db.query(
        'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
        [rating, comment, existing.id]
      );
    } else {
      await db.query(
        'INSERT INTO reviews (user_id, book_id, rating, comment) VALUES (?, ?, ?, ?)',
        [userId, book_id, rating, comment]
      );
    }

    return res.json({ success: true, message: 'Rating saved!' });
  } catch (err) {
    console.error('[reviews POST]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;