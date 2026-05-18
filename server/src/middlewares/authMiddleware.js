'use strict';

const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { error } = require('../utils/response');

/**
 * authenticate
 * Xác thực JWT từ header "Authorization: Bearer <token>".
 * - Kiểm tra token hợp lệ
 * - Lấy full user object từ DB (tránh dùng decoded JWT làm user data)
 * - Kiểm tra tài khoản còn active không
 * - Gắn req.user để controller sử dụng
 * 
 * Returns 401 nếu thiếu token hoặc token hết hạn
 * Returns 404 nếu user không tồn tại trong DB
 * Returns 403 nếu tài khoản bị khóa
 */
const authenticate = async (req, res, next) => {
  const header = req.headers['authorization'] || '';
  
  if (!header.startsWith('Bearer ')) {
    return error(res, 'Định dạng token phải là Bearer <token>', 401);
  }

  const token = header.slice(7); // Bỏ "Bearer " prefix

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Cải tiến quan trọng: Kiểm tra xem user có bị Admin khóa đột xuất trong lúc token còn hạn không
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return error(res, 'Người dùng không tồn tại hoặc đã bị xóa', 404);
    }
    
    if (user.status === 'banned') {
      return error(res, 'Tài khoản của bạn đã bị khóa, vui lòng liên hệ quản trị viên', 403);
    }
    
    if (user.status === 'pending') {
      return error(res, 'Tài khoản chưa được xác thực OTP, vui lòng kiểm tra email', 401);
    }

    req.user = user; // Gắn hẳn thông tin sạch từ DB vào req.user
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token đã hết hạn, vui lòng đăng nhập lại' : 'Token không hợp lệ';
    return error(res, message, 401);
  }
};

/**
 * authorize(...roles)
 * Phân quyền theo role. Dùng SAU authenticate.
 * Ví dụ: router.delete('/admin', authenticate, authorize('admin'), controller)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return error(res, 'Không tìm thấy thông tin người dùng', 401);
  }
  if (!roles.includes(req.user.role)) {
    return error(res, 'Bạn không có quyền truy cập tài nguyên này', 403);
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
};