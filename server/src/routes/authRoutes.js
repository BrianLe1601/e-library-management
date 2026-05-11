'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 1 — Authentication & User System        ║
 * ║  Routes: authRoutes.js                              ║
 * ╚══════════════════════════════════════════════════════╝
 */

const express    = require('express');
const router     = express.Router();
const { body }   = require('express-validator');

const { authenticate }            = require('../middlewares/authMiddleware');
const { validate }                = require('../middlewares/validateMiddleware');
const authController              = require('../controllers/authController');

// ── Validation rules ──────────────────────────────────────────────────────────
const registerRules = [
  body('full_name').trim().notEmpty().withMessage('Họ tên không được để trống')
    .isLength({ max: 100 }).withMessage('Tối đa 100 ký tự'),
  body('email').trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Mật khẩu tối thiểu 8 ký tự')
    .matches(/[A-Z]/).withMessage('Phải có ít nhất 1 chữ hoa')
    .matches(/[0-9]/).withMessage('Phải có ít nhất 1 chữ số'),
  body('phone').optional({ nullable: true })
    .isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
];

const changePasswordRules = [
  body('old_password').notEmpty().withMessage('Vui lòng nhập mật khẩu cũ'),
  body('new_password').isLength({ min: 8 }).withMessage('Mật khẩu mới tối thiểu 8 ký tự')
    .matches(/[A-Z]/).withMessage('Phải có ít nhất 1 chữ hoa')
    .matches(/[0-9]/).withMessage('Phải có ít nhất 1 chữ số'),
];

const updateProfileRules = [
  body('full_name').optional().trim().isLength({ min: 1, max: 100 }),
  body('phone').optional({ nullable: true }).isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),
  body('avatar_url').optional({ nullable: true }).isURL().withMessage('URL không hợp lệ'),
];

// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/auth/register',         registerRules,       validate, authController.register);
router.post('/auth/login',            loginRules,          validate, authController.login);

// ── Protected routes (yêu cầu JWT) ───────────────────────────────────────────
router.get ('/users/profile',         authenticate, authController.getProfile);
router.put ('/users/profile',         authenticate, updateProfileRules, validate, authController.updateProfile);
router.put ('/users/change-password', authenticate, changePasswordRules, validate, authController.changePassword);

module.exports = router;
