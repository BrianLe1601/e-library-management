'use strict';
const notificationModel = require('../models/notificationModel');
const userModel = require('../models/userModel');
const { success, error } = require('../utils/response');

/**
 * Lấy danh sách thông báo của chính Độc giả đang đăng nhập
 * GET /api/users/notifications
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ authMiddleware giải mã token
    const { page = 1, limit = 20, filter = 'all' } = req.query;

    const result = await notificationModel.findAll({
      receiver_role: 'user',
      user_id: userId,
      filter: filter, // 'all' hoặc 'unread'
      is_archived: 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    return success(res, result.rows || result, 'Connected successfully');
  } catch (err) {
    console.error('[getMyNotifications Error]:', err);
    return error(res, 'Error while getting notifications', 500);
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

    await notificationModel.markAsReadForUser(notifId, userId);

    return success(res, null, 'Mark notification as read successfully');
  } catch (err) {
    console.error('[markNotificationAsRead Error]:', err);
    return error(res, 'Cannot update notification', 500);
  }
};

/**
 * Đánh dấu tất cả thông báo của User là đã đọc
 * PATCH /api/users/notifications/mark-all
 */
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await notificationModel.markAllAsReadForUser(userId);

    return success(res, null, 'Mark all notifications as read successfully');
  } catch (err) {
    console.error('[markAllNotificationsAsRead Error]:', err);
    return error(res, 'Cannot update notifications', 500);
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await notificationModel.softDelete(id, userId);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Cannot find notification or you don't have permission." });
    }

    res.status(200).json({ success: true, message: "Deleted notification successfully." });
  } catch (error) {
    console.error("[deleteNotification] Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteMultipleNotifications = async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid request. Please provide an array of notification IDs." });
    }

    const result = await notificationModel.softDeleteMultiple(ids, userId);

    res.status(200).json({ success: true, message: `Deleted ${result.affectedRows} notifications successfully.` });
  } catch (error) {
    console.error("[deleteMultipleNotifications] Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getMyStats = async (req, res) => {
  try {
    const stats = await userModel.getUserStats(req.user.id);
    return success(res, stats);
  } catch (err) {
    console.error('[getMyStats Error]:', err);
    return error(res, 'Error while getting stats', 500);
  }
};