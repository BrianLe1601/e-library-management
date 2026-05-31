'use strict';
const db = require('../config/db');

const Review = {
  // Tìm kiếm review đã tồn tại theo user và lượt mượn
  findByUserAndBorrow: async (userId, borrowId) => {
    const [rows] = await db.query(
      'SELECT id FROM reviews WHERE user_id = ? AND borrow_id = ?',
      [userId, borrowId]
    );
    return rows[0]; // Trả về object chứa id nếu tìm thấy, ngược lại trả về undefined
  },

  // Cập nhật đánh giá cũ
  update: async (id, rating, comment) => {
    const [result] = await db.query(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
      [rating, comment, id]
    );
    return result;
  },

  // Thêm mới đánh giá
  create: async (userId, bookId, borrowId, rating, comment) => {
    const [result] = await db.query(
      'INSERT INTO reviews (user_id, book_id, borrow_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [userId, bookId, borrowId, rating, comment]
    );
    return result;
  }
};

module.exports = Review;