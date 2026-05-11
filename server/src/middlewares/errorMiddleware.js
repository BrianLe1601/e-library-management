'use strict';

/**
 * notFound – bắt tất cả route không tồn tại → 404
 */
const notFound = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route không tồn tại: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * errorHandler – global error handler (đặt CUỐI cùng trong app.js)
 * Express nhận diện bằng 4 tham số (err, req, res, next).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  console.error('[ERROR]', err);

  // Lỗi validation từ express-validator (được ném thủ công)
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Validation thất bại',
      errors:  err.errors,
    });
  }

  // Lỗi MySQL FK constraint
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      success: false,
      message: 'Không thể xóa: dữ liệu đang được tham chiếu bởi bảng khác',
    });
  }

  const status  = err.statusCode || err.status || 500;
  const message = err.message    || 'Lỗi server';
  res.status(status).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
