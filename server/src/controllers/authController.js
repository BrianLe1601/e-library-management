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
    console.error('[authController.register] Error:', err);
    return error(res, 'Lỗi server nội bộ', 500);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sử dụng hàm credentials mới để tối ưu bộ nhớ truy vấn SQL
    const userCredentials = await userModel.findCredentialsByEmail(email);
    if (!userCredentials) return error(res, 'Email hoặc mật khẩu không chính xác', 401);

    if (!userCredentials.is_active) return error(res, 'Tài khoản của bạn hiện đang bị khóa', 403);

    const match = await bcrypt.compare(password, userCredentials.password);
    if (!match) return error(res, 'Email hoặc mật khẩu không chính xác', 401);

    // Ký mã token an toàn
    const token = signToken({ 
      id: userCredentials.id, 
      email: userCredentials.email, 
      role: userCredentials.role 
    });

    // Lấy thông tin chi tiết an toàn hiển thị lên client
    const safeUser = await userModel.findById(userCredentials.id);

    return success(res, { token, user: safeUser }, 'Đăng nhập thành công');
  } catch (err) {
    console.error('[authController.login] Error:', err);
    return error(res, 'Lỗi server nội bộ', 500);
  }
};

// ── GET /api/users/profile ────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  // Vì authMiddleware cải tiến của chúng ta đã bốc sẵn object user từ DB nên ở đây phản hồi thẳng, giảm 1 lượt query thừa
  if (!req.user) return error(res, 'Không tìm thấy thông tin người dùng', 404);
  return success(res, req.user);
};

// ── PUT /api/users/profile ────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone, avatar_url } = req.body;
    const updated = await userModel.updateProfile(req.user.id, { full_name, phone, avatar_url });
    if (!updated) return error(res, 'Không có dữ liệu thay đổi hợp lệ', 400);

    const user = await userModel.findById(req.user.id);
    return success(res, user, 'Cập nhật thông tin hồ sơ thành công');
  } catch (err) {
    console.error('[authController.updateProfile] Error:', err);
    return error(res, 'Lỗi server nội bộ', 500);
  }
};

// ── PUT /api/users/change-password ───────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    // Lấy credentials để so sánh password cũ
    const userCredentials = await userModel.findCredentialsByEmail(req.user.email);
    if (!userCredentials) return error(res, 'Người dùng không tồn tại', 404);

    const match = await bcrypt.compare(old_password, userCredentials.password);
    if (!match) return error(res, 'Mật khẩu hiện tại không đúng', 400);

    if (old_password === new_password) {
      return error(res, 'Mật khẩu mới không được trùng với mật khẩu cũ', 400);
    }

    const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
    await userModel.updatePassword(req.user.id, hashed);

    return success(res, null, 'Thay đổi mật khẩu thành công');
  } catch (err) {
    console.error('[authController.changePassword] Error:', err);
    return error(res, 'Lỗi server nội bộ', 500);
  }
};
