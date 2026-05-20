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
  // Chỉ hiển thị log lỗi chi tiết tại môi trường local để dev sửa
  if (process.env.NODE_ENV !== 'production') {
    console.error('[SYSTEM CRASH LOG]', err);
  }

  // Lỗi validation từ express-validator
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu gửi lên không vượt qua vòng kiểm duyệt (Validation failed)',
      errors:  err.errors,
    });
  }

  // Lỗi MySQL Foreign Key Constraint (Ràng buộc dữ liệu bảng đang chạy)
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      success: false,
      message: 'Hành động bị từ chối: Dữ liệu này đang có liên kết ràng buộc chặt chẽ ở các bảng dữ liệu khác.',
    });
  }

  const status  = err.statusCode || err.status || 500;
  // Tránh trả về err.message nguyên bản ở production để tránh lộ thông tin nhạy cảm của server (như lỗi cú pháp SQL)
  const message = process.env.NODE_ENV === 'production' && status === 500 
    ? 'Hệ thống gặp sự cố nội bộ. Vui lòng thử lại sau!'
    : err.message || 'Lỗi hệ thống';

  res.status(status).json({ success: false, message });
};

module.exports = { notFound, errorHandler };