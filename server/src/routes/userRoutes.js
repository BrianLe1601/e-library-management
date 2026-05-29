'use strict';
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// ── Notifications đối với Độc giả (User) ─────────────────────────────────────────────
// QUAN TRỌNG: route tĩnh /mark-all phải đặt TRƯỚC route động /:id/read
// Nếu đổi thứ tự, Express sẽ match "mark-all" như một :id và gọi sai handler
router.get   ('/notifications',          authenticate,   authorize('user'), userController.getMyNotifications);
router.patch ('/notifications/mark-all', authenticate,  authorize('user'), userController.markAllNotificationsAsRead);
router.patch ('/notifications/:id/read', authenticate,  authorize('user'), userController.markNotificationAsRead); 

module.exports = router;