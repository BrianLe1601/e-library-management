'use strict';

const { validationResult } = require('express-validator');

/**
 * validate – bắt lỗi từ express-validator và trả 422 nếu có.
 * Đặt NGAY SAU mảng rules trong route.
 *
 * Ví dụ:
 *   router.post('/register', registerRules, validate, authController.register)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu đầu vào không hợp lệ',
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { validate };
