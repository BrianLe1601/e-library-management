'use strict';

const jwt = require('jsonwebtoken');

/**
 * authenticate
 * Xác thực JWT từ header "Authorization: Bearer <token>".
 * Gắn payload vào req.user = { id, email, role, is_active }.
 */
const authenticate = (req, res, next) => {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token is required' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token đã hết hạn' : 'Token không hợp lệ';
    return res.status(401).json({ success: false, message });
  }
};

/**
 * authorize(...roles)
 * Phân quyền theo role. Dùng SAU authenticate.
 *
 * Ví dụ:
 *   router.post('/books', authenticate, authorize('admin'), handler)
 *   router.get('/admin/stats', authenticate, authorize('admin','employee'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Chỉ ${roles.join(' hoặc ')} mới có quyền truy cập`,
    });
  }
  next();
};

module.exports = { authenticate, authorize };
