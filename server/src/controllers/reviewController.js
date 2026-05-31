'use strict';
const Review = require('../models/reviewModel');

exports.saveReview = async (req, res) => {
  try {
    const { book_id, borrow_id, rating, comment = '' } = req.body;

    // 1. Validation dữ liệu đầu vào
    if (!book_id || !borrow_id || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'book_id, borrow_id and rating required' 
      });
    }

    const userId = req.user.id; // Lấy từ middleware authenticate

    // 2. Kiểm tra xem người dùng đã từng đánh giá cho lượt mượn này chưa
    const existing = await Review.findByUserAndBorrow(userId, borrow_id);

    if (existing) {
      // Nếu có rồi thì cập nhật (Update)
      await Review.update(existing.id, rating, comment);
    } else {
      // Nếu chưa có thì tạo mới (Insert)
      await Review.create(userId, book_id, borrow_id, rating, comment);
    }

    // 3. Phản hồi thành công
    return res.json({ success: true, message: 'Rating saved!' });

  } catch (err) {
    console.error('[reviews POST Controller]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};