'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 1 — Authentication & User System        ║
 * ║  Controller: authController.js                      ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Endpoints:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/users/profile
 *   PUT  /api/users/profile
 *   PUT  /api/users/change-password
 */

const bcrypt    = require('bcrypt');
const userModel = require('../models/userModel');
const { signToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');

const SALT_ROUNDS = 10;

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    const existing = await userModel.findByEmail(email);
    if (existing) return error(res, 'Email đã được sử dụng', 409);

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const id     = await userModel.create({ full_name, email, password: hashed, phone });

    return success(res, { id, full_name, email, role: 'user' }, 'Đăng ký thành công', 201);
  } catch (err) {
    console.error('[register]', err);
    return error(res, 'Lỗi server', 500);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) return error(res, 'Email hoặc mật khẩu không đúng', 401);

    if (!user.is_active) return error(res, 'Tài khoản đã bị khóa', 403);

    const match = await bcrypt.compare(password, user.password);
    if (!match) return error(res, 'Email hoặc mật khẩu không đúng', 401);

    const token = signToken({ id: user.id, email: user.email, role: user.role, is_active: user.is_active });
    const { password: _, ...safeUser } = user;

    return success(res, { token, user: safeUser }, 'Đăng nhập thành công');
  } catch (err) {
    console.error('[login]', err);
    return error(res, 'Lỗi server', 500);
  }
};

// ── GET /api/users/profile ────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return error(res, 'Không tìm thấy người dùng', 404);
    return success(res, user);
  } catch (err) {
    console.error('[getProfile]', err);
    return error(res, 'Lỗi server', 500);
  }
};

// ── PUT /api/users/profile ────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone, avatar_url } = req.body;
    const updated = await userModel.updateProfile(req.user.id, { full_name, phone, avatar_url });
    if (!updated) return error(res, 'Không có trường nào để cập nhật', 400);

    const user = await userModel.findById(req.user.id);
    return success(res, user, 'Cập nhật thông tin thành công');
  } catch (err) {
    console.error('[updateProfile]', err);
    return error(res, 'Lỗi server', 500);
  }
};

// ── PUT /api/users/change-password ───────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    const user = await userModel.findByEmail(req.user.email); // có trường password
    if (!user) return error(res, 'Không tìm thấy người dùng', 404);

    const match = await bcrypt.compare(old_password, user.password);
    if (!match) return error(res, 'Mật khẩu cũ không đúng', 400);

    if (old_password === new_password)
      return error(res, 'Mật khẩu mới phải khác mật khẩu cũ', 400);

    const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
    await userModel.updatePassword(req.user.id, hashed);

    return success(res, null, 'Đổi mật khẩu thành công');
  } catch (err) {
    console.error('[changePassword]', err);
    return error(res, 'Lỗi server', 500);
  }
};
