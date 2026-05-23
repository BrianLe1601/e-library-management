'use strict';

/**
 * Các helper để trả response nhất quán trong toàn bộ controller.
 *
 * Cách dùng:
 *   const { success, error, paginated } = require('../utils/response');
 *   return success(res, data, 'Tạo thành công', 201);
 */

const success = (res, data = null, message = 'Thành công', statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

const error = (res, message = 'Lỗi server', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const paginated = (res, data, total, page, limit, message = 'Thành công') => {
  const safePage = Number(page) || 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : 10;

  return res.json({
    success: true,
    message,
    data,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  });
};

module.exports = { success, error, paginated };
