'use strict';
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const bookController = require('../controllers/bookController')
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// ── Notifications đối với Độc giả (User) ─────────────────────────────────────────────
// QUAN TRỌNG: route tĩnh /mark-all phải đặt TRƯỚC route động /:id/read
// Nếu đổi thứ tự, Express sẽ match "mark-all" như một :id và gọi sai handler
router.get   ('/notifications',          authenticate,   authorize('user'), userController.getMyNotifications);
router.patch ('/notifications/mark-all', authenticate,  authorize('user'), userController.markAllNotificationsAsRead);
router.patch ('/notifications/:id/read', authenticate,  authorize('user'), userController.markNotificationAsRead); 
router.post  ('/notifications/delete-multiple', authenticate, authorize('user'), userController.deleteMultipleNotifications);
router.delete('/notifications/:id',             authenticate, authorize('user'), userController.deleteNotification);
router.get('/stats', authenticate, authorize('user'), userController.getMyStats);

// ── Saved Books (Sách đã lưu) ────────────────────────────────────────────────
router.get   ('/saved-books',          authenticate, authorize('user', 'admin', 'employee'),  bookController.getSavedBooks);
router.post  ('/saved-books',          authenticate, authorize('user', 'admin', 'employee'),  bookController.saveBook);
router.delete('/saved-books/:bookId',  authenticate, authorize('user', 'admin', 'employee'),  bookController.unsaveBook);

module.exports = router;