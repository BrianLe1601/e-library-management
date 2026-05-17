'use strict';

const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

/**
 * authenticate
 * Xác thực JWT từ header "Authorization: Bearer <token>".
 * Gắn payload vào req.user và kiểm tra trạng thái tài khoản.
 */
const authenticate = async (req, res, next) => {
  const header = req.headers['authorization'] || '';
  
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Định dạng token phải là Bearer <token>' });
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Cải tiến quan trọng: Kiểm tra xem user có bị Admin khóa đột xuất trong lúc token còn hạn không
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Người dùng không tồn tại hoặc đã bị xóa' });
    }
    
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa, vui lòng liên hệ quản trị viên' });
    }

    req.user = user; // Gắn hẳn thông tin sạch từ DB vào req.user
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token đã hết hạn, vui lòng đăng nhập lại' : 'Token không hợp lệ';
    return res.status(401).json({ success: false, message });
  }
};

/**
 * authorize(...roles)
 * Phân quyền theo role. Dùng SAU authenticate.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Yêu cầu xác thực tài khoản' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Cấp quyền thất bại: Chỉ nhóm [${roles.join(', ')}] mới có quyền truy cập`,
    });
  }
  next();
};

module.exports = { authenticate, authorize };