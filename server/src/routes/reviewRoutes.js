'use strict';
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const reviewController = require('../controllers/reviewController');

// Route xử lý việc lưu hoặc cập nhật đánh giá
router.post('/', authenticate, reviewController.saveReview);

module.exports = router;