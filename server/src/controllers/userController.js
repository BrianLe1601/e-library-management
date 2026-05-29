'use strict';
const notificationModel = require('../models/notificationModel');
const db = require('../config/db');
const { success, error } = require('../utils/response');

/**
 * Lấy danh sách thông báo của chính Độc giả đang đăng nhập
 * GET /api/users/notifications
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ authMiddleware giải mã token
    const { page = 1, limit = 20, filter = 'all' } = req.query;

    // Tái sử dụng nguyên vẹn notificationModel.js
    const result = await notificationModel.findAll({
      receiver_role: 'user',
      user_id: userId,
      filter: filter, // 'all' hoặc 'unread'
      is_archived: 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    // Trả về cấu trúc phân trang giống admin hoặc mượn sách
    return success(res, result.rows || result, 'Tải thông báo thành công');
  } catch (err) {
    console.error('[getMyNotifications Error]:', err);
    return error(res, 'Lỗi hệ thống khi lấy thông báo', 500);
  }
};

/**
 * Đánh dấu 1 thông báo là đã đọc
 * PATCH /api/users/notifications/:id/read
 */
exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifId = req.params.id;

    // Chỉ cập nhật nếu thông báo đó đúng là gửi cho user này và có role là 'user'
    const [result] = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ? AND receiver_role = "user"',
      [notifId, userId]
    );

    return success(res, null, 'Đã đánh dấu đọc thông báo');
  } catch (err) {
    console.error('[markNotificationAsRead Error]:', err);
    return error(res, 'Không thể cập nhật trạng thái thông báo', 500);
  }
};

/**
 * Đánh dấu tất cả thông báo của User là đã đọc
 * PATCH /api/users/notifications/mark-all
 */
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND receiver_role = "user" AND is_read = 0',
      [userId]
    );

    return success(res, null, 'Đã đánh dấu đọc tất cả thông báo');
  } catch (err) {
    console.error('[markAllNotificationsAsRead Error]:', err);
    return error(res, 'Không thể cập nhật tất cả thông báo', 500);
  }
};