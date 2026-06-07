'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 4 — Admin Dashboard & Reports           ║
 * ║  Controller: adminController.js                     ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Endpoints:
 *   GET    /api/admin/stats
 *   GET    /api/admin/reports
 *   GET    /api/admin/reports/top-books
 *   GET    /api/admin/reports/export
 *   GET    /api/admin/users
 *   PATCH  /api/admin/users/:id/status
 *   DELETE /api/admin/users/:id
 *   GET    /api/admin/borrows          (từ TV3)
 *   GET    /api/admin/borrows/overdue  (từ TV3)
 *   PUT    /api/admin/borrows/approve/:id
 *   PUT    /api/admin/borrows/reject/:id
 */

const reportModel  = require('../models/reportModel');
const userModel    = require('../models/userModel');
const bookModel    = require('../models/bookModel');
const borrowCtrl   = require('./borrowController');
const notificationModel = require('../models/notificationModel');
const bcrypt = require('bcrypt');
const { success, error, paginated } = require('../utils/response');

//  ─────────────────────────────── DASHBOARD ───────────────────────────────────
// ── GET /api/admin/stats ──────────────────────────────────────────────────────
exports.getStats = async (_req, res) => {
  try {
    const stats = await reportModel.getStats();
    return success(res, stats);
  } catch (err) {
    console.error('[getStats]', err);
    return error(res);
  }
};


//  ─────────────────────────────── BOOK INVENTORY ──────────────────────────────
// ── GET /api/admin/books ──────────────────────────────────────────────────────
exports.getBooks = async (req, res) => {
  try {
    // 1. Lấy các tham số phân trang và bộ lọc từ query string bypass
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || 'All';
    const author = req.query.author || ''; // <--- Nhận thêm bộ lọc tác giả gửi từ Frontend

    // 2. Gọi hàm model xử lý Database riêng biệt cho Admin (đã có bộ lọc tác giả)
    const { data, totalItems } = await bookModel.findAllForAdmin({
      search,
      category,
      author,
      page,
      limit
    });

    // 3. Sử dụng helper success có sẵn trong utils/response để trả về cho React
    return success(res, {
      data,
      pagination: {
        totalItems,                           // Tổng số sách tìm thấy sau khi lọc
        currentPage: page,                    // Trang hiện tại
        limit,                                // Số lượng sách trên 1 trang
        totalPages: Math.ceil(totalItems / limit) // Tổng số trang tự động tính toán
      }
    }, 'Fetch book inventory successfully');

  } catch (err) {
    console.error('[getBooks error]', err);
    return error(res, 'Internal Server Error', 500);
  }
};

// ── GET /api/admin/books/publishers ──────────────────────────────────────────
exports.getPublishers = async (req, res) => {
  try {
    const publishers = await bookModel.findAllPublishers();
    return success(res, publishers, 'Fetch publishers successfully');
  } catch (err) {
    console.error('[getPublishers] Error:', err);
    return error(res, 'System Error while fetching publishers', 500);
  }
};

// ── POST /api/admin/books (Thêm sách mới) ──────────────────────────────────
exports.createBook = async (req, res) => {
  try {
    // 1. Lấy dữ liệu chữ (text) gửi lên từ form
    const bookData = req.body; 
    /* Gồm: title, author_id, publisher_id, isbn, published_year, total_copies... */

    // 2. LẤY LINK ẢNH TỪ CLOUDINARY (NẾU CÓ)
    if (req.file && req.file.path) {
      bookData.cover_url = req.file.path; // Gán link ảnh vào object data
    } else {
      // Nếu không up ảnh, có thể gán 1 ảnh mặc định (Placeholder)
      bookData.cover_url = 'https://placehold.co/300x450/e2e8f0/475569?text=No+Cover';
    }

    // 3. Gọi Model để lưu vào Database (Giả định trong bookModel có hàm create)
    // Lưu ý: Tùy cách bạn viết hàm create trong bookModel, có thể truyền thẳng object bookData vào
    const newBookId = await bookModel.create(bookData);

    // 4. Nếu sách có chọn thể loại (Categories) -> Lưu vào bảng trung gian book_categories
    if (bookData.categoryIds) {
      // Vì gửi qua FormData, mảng có thể bị biến thành chuỗi JSON hoặc chuỗi cách nhau bởi dấu phẩy
      const parsedCategories = typeof bookData.categoryIds === 'string' 
        ? JSON.parse(bookData.categoryIds) 
        : bookData.categoryIds;
        
      await bookModel.setCategories(newBookId, parsedCategories);
    }

    return success(res, { id: newBookId, cover_url: bookData.cover_url }, 'Add book successfully', 201);
  } catch (err) {
    console.error('[createBook] Error:', err);
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'Book with this ISBN already exists', 409);
    return error(res, 'System Error while creating book', 500);
  }
};

// ── PUT /api/admin/books/:id (Cập nhật sách) ───────────────────────────────
exports.updateBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const bookData = req.body;

    if (bookData.total_copies !== undefined) {

      const inventory =
        await bookModel.getInventoryInfo(bookId);

      if (!inventory) {
        return error(res, 'Book not found', 404);
      }

      const borrowedCopies =
        Number(inventory.total_copies) -
        Number(inventory.available_copies);

      const newTotal =
        Number(bookData.total_copies);

      if (newTotal < borrowedCopies) {
        return error(
          res,
          `Cannot reduce total copies below borrowed count (${borrowedCopies})`,
          400
        );
      }
      bookData.available_copies = newTotal - borrowedCopies;
    }

    if (req.file && req.file.path) {
      bookData.cover_url = req.file.path;
    }

    const isUpdated = await bookModel.update(bookId, bookData);
    if (!isUpdated) return error(res, 'Book not found', 404);

    // Cập nhật lại thể loại nếu có
    if (bookData.categoryIds) {
      const parsedCategories = typeof bookData.categoryIds === 'string' 
        ? JSON.parse(bookData.categoryIds) 
        : bookData.categoryIds;
      await bookModel.setCategories(bookId, parsedCategories);
    }

    return success(res, { id: bookId }, 'Update book successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return error(res, 'Book with this ISBN already exists', 409);
    }
    console.error('[updateBook] Error:', err);
    return error(res, 'System Error while updating book', 500);
  }
};

// ── DELETE /api/admin/books/:id (Xóa sách) ─────────────────────────────────
exports.deleteBook = async (req, res) => {
  try {
    const bookId = req.params.id;

    const isDeleted = await bookModel.remove(bookId);
    
    if (!isDeleted) {
      return error(res, 'Book not found', 404);
    }

    return success(res, null, 'Delete book successfully');
  } catch (err) {
    // Bắt lỗi ràng buộc khóa ngoại (Sách đã có người mượn hoặc nằm trong lịch sử mượn)
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return error(res, 'This book is currently borrowed or has borrowing history, it cannot be deleted', 409);
    }
    
    console.error('[adminDeleteBook] Error:', err);
    return error(res, 'System Error while deleting book', 500);
  }
};

// ── POST /api/admin/authors ──────────────────────────────────────────────────
exports.createAuthor = async (req, res) => {
  try {
    const { name, bio } = req.body;
    if (!name || !name.trim()) return error(res, 'Author name is required', 400);

    const newAuthor = await bookModel.createAuthor(name.trim(), bio ? bio.trim() : null);
    return success(res, newAuthor, 'Author created successfully', 201);
  } catch (err) {
    console.error('[createAuthor]', err);
    return error(res, 'System Error while creating author', 500);
  }
};

// ── POST /api/admin/publishers ───────────────────────────────────────────────
exports.createPublisher = async (req, res) => {
  try {
    const { name, country } = req.body;
  
    if (!name || !name.trim()) return error(res, 'Publisher name is required', 400);
    if (!country || !country.trim()) return error(res, 'Country is required', 400);

    const newPublisher = await bookModel.createPublisher(name.trim(), country.trim());
    return success(res, newPublisher, 'Publisher created successfully', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return error(res, 'Publisher already exists', 409);
    }
    console.error('[createPublisher]', err);
    return error(res, 'System Error while creating publisher', 500);
  }
};

// ── POST /api/admin/categories ────────────────────────────────────────────────
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return error(res, 'Category name is required', 400);

    const newCategory = await bookModel.createCategory(name.trim(), description ? description.trim() : null);
    return success(res, newCategory, 'Category created successfully', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return error(res, 'Category already exists', 409);
    }
    console.error('[createCategory]', err);
    return error(res, 'System Error while creating category', 500);
  }
};

// ── PATCH /api/admin/books/:id/toggle-hide ──────────────────────
exports.toggleHide = async (req, res) => {
  try {
    const bookId = req.params.id;

    const newHiddenState = await bookModel.toggleHide(bookId);
    if (newHiddenState === null) {
      return error(res, 'Book not found', 404);
    }

    return success(res, { is_hidden: newHiddenState }, 'Book visibility toggled successfully');
  } catch (err) {
    console.error('[toggleHide]', err);
    return error(res, 'System Error while toggling book visibility', 500);
  }
};


//  ─────────────────────────────── USER MANAGEMENT ─────────────────────────────
// ── GET /api/admin/users ──────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    const { data, totalItems, stats } = await userModel.findAllForAdmin({ search, role, status, page, limit });

    return success(res, {
      data,
      stats, // <--- TRUYỀN STATS RA API CHO FRONTEND (SWR SẼ NHẬN ĐƯỢC)
      pagination: {
        totalItems,
        currentPage: page,
        limit,
        totalPages: Math.ceil(totalItems / limit)
      }
    }, 'Fetch user list successfully');
  } catch (err) {
    console.error(err);
    return error(res, 'Internal Server Error', 500);
  }
};

// ── PATCH /api/admin/users/:id/status ────────────────────────────────────────
exports.toggleUserStatus = async (req, res) => {
  try {
    const result = await userModel.toggleUserStatus(req.params.id);
    const msg = result.status === 'active' ? 'User account unlocked successfully' : 'User account locked successfully';
    return success(res, result, msg);
  } catch (err) {
    console.error('[toggleUserStatus]', err);
    return error(res, 'System Error while toggling user status', 500);
  }
};

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    await userModel.deleteUser(req.params.id);
    return success(res, null, 'User deleted successfully');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return error(res, 'Cannot delete: related data exists', 409);
    console.error('[deleteUser]', err);
    return error(res, 'System Error while deleting user', 500);
  }
};

// ── PUT /api/admin/users/:id/role ───────────────────────────────────────────
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const id = req.params.id;

    const validRoles = ['user', 'employee', 'admin'];
    if (!validRoles.includes(role)) {
      return error(res, 'Role is invalid', 400);
    }

    const isUpdated = await userModel.updateUserRole(id, role);
    if (!isUpdated) {
      return error(res, 'User not found', 404);
    }
    return success(res, { id: id, role }, 'Role updated successfully');
  } catch (err) {
    console.error('[updateUserRole] Error:', err);
    return error(res, 'System Error while updating user role', 500);
  }
};

// ── POST /api/admin/users ───────────────────────────────────────────────
exports.createUser = async (req, res) => {
  try {
    const { full_name, email, password, phone, role } = req.body;

    // 1. Kiểm tra role hợp lệ (bảo mật thêm 1 lớp)
    const validRoles = ['user', 'employee', 'admin'];
    if (!validRoles.includes(role)) {
      return error(res, 'Role is invalid', 400);
    }

    // 2. Mã hóa mật khẩu do Admin nhập vào
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Đẩy xuống Model để lưu vào Database
    const newUserId = await userModel.createUserByAdmin({
      full_name,
      email,
      password: hashedPassword,
      phone,
      role
    });

    return success(res, { id: newUserId }, 'User created successfully', 201);
    
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return error(res, 'Email already exists', 409);
    }
    
    console.error('[createUser]', err);
    return error(res, 'System Error while creating user', 500);
  }
};


//  ─────────────────────────────── REPORTS ─────────────────────────────────────
// ── GET /api/admin/reports ────────────────────────────────────────────────────
exports.getReports = async (req, res) => {
  try {
    const { from, to, type, page = 1, limit = 20 } = req.query;
    const { rows, total } = await reportModel.getReports({ from, to, type, page, limit });
    return paginated(res, rows, total, page, limit);
  } catch (err) {
    console.error('[getReports]', err);
    return error(res, 'System Error while fetching reports', 500);
  }
};

// ── GET /api/admin/reports/top-books ─────────────────────────────────────────
exports.getTopBooks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const books = await reportModel.getTopBooks(limit);
    return success(res, books);
  } catch (err) {
    console.error('[getTopBooks]', err);
    return error(res, 'System Error while fetching top books', 500);
  }
};

// ── GET /api/admin/reports/summary ───────────────────────────────────────────
// Trả về tổng hợp: totalBorrows, totalReturns, totalNewUsers, totalFinesCollected
// Params: ?from=2026-01-01&to=2026-05-31
exports.getReportSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await reportModel.getReportSummary({ from, to });
    return success(res, data);
  } catch (err) {
    console.error('[getReportSummary]', err);
    return error(res, 'Server error', 500);
  }
};
 
// ── GET /api/admin/reports/category ──────────────────────────────────────────
// Thống kê mượn/trả/quá hạn theo danh mục sách
// Params: ?from=2026-01-01&to=2026-05-31
exports.getCategoryReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await reportModel.getCategoryReport({ from, to });
    return success(res, data);
  } catch (err) {
    console.error('[getCategoryReport]', err);
    return error(res, 'Server error', 500);
  }
};
 
// ── GET /api/admin/reports/borrow-chart ──────────────────────────────────────
// Thay thế hàm getBorrowChart cũ — thêm trường uniqueUsers
exports.getBorrowChart = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await reportModel.getBorrowChart(year);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[getBorrowChart]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────── NOTIFICATIONS ───────────────────────────────
 
/**
 * GET /api/admin/notifications
 * [FIX] Nhận đầy đủ params: page, limit, search — trước đây không truyền xuống model
 *       nên phân trang và search hoàn toàn không hoạt động dù frontend đã gửi đúng
 */
exports.getNotifications = async (req, res) => {
  try {
    const {
      filter      = 'all',
      is_archived = 0,
      page        = 1,
      limit       = 10,
      search      = '',
    } = req.query;

    const parsedArchived = Number(is_archived);
    const parsedPage     = Number(page);
    const parsedLimit    = Number(limit);

    // [FIX] Không hardcode receiver_role='admin_employee' vì sẽ bỏ sót:
    //   - Thông báo broadcast scope='all' có receiver_role='admin_employee' ✓
    //   - Thông báo tự động từ hệ thống (approve/return) cũng cần admin xem
    //   - Truyền receiver_role=null để lấy TẤT CẢ thông báo dành cho hộp thư admin
    //   - Cụ thể: lọc receiver_role IN ('admin_employee') hoặc là thông báo hệ thống
    const result = await notificationModel.findAllForAdmin({
      filter,
      is_archived: parsedArchived,
      page:        parsedPage,
      limit:       parsedLimit,
      search,
    });

    // [FIX] Stats phải đếm đúng scope admin (cùng filter với findAllForAdmin)
    const stats = await notificationModel.getStatsForAdmin();

    return success(res, {
      data:       result.rows,
      total:      result.total,
      page:       parsedPage,
      totalPages: Math.ceil(result.total / parsedLimit) || 1,
      stats,
    });
  } catch (err) {
    console.error('[getNotifications]', err);
    return error(res, 'Error fetching notifications', 500);
  }
};
 
// ── PATCH /api/admin/notifications/:id/read ──────────────────────────────────
exports.markNotificationRead = async (req, res) => {
  try {
    await notificationModel.markRead(req.params.id);
    return success(res, null, 'Marked as read');
  } catch (err) {
    console.error('[markNotificationRead]', err);
    return error(res);
  }
};
 
// ── PATCH /api/admin/notifications/mark-all ──────────────────────────────────
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await notificationModel.markAllRead();
    return success(res, null, 'All marked as read');
  } catch (err) {
    console.error('[markAllNotificationsRead]', err);
    return error(res);
  }
};
 
// ── PATCH /api/admin/notifications/:id/archive ───────────────────────────────
exports.archiveNotification = async (req, res) => {
  try {
    await notificationModel.archive(req.params.id);
    return success(res, null, 'Archived');
  } catch (err) {
    console.error('[archiveNotification]', err);
    return error(res);
  }
};
 
// ── PATCH /api/admin/notifications/:id/restore ───────────────────────────────
exports.restoreNotification = async (req, res) => {
  try {
    await notificationModel.restore(req.params.id);
    return success(res, null, 'Restored');
  } catch (err) {
    console.error('[restoreNotification]', err);
    return error(res);
  }
};
 
// ── DELETE /api/admin/notifications/:id ─────────────────────────────────────
exports.deleteNotification = async (req, res) => {
  try {
    await notificationModel.remove(req.params.id);
    return success(res, null, 'Deleted permanently');
  } catch (err) {
    console.error('[deleteNotification]', err);
    return error(res);
  }
};
 
// ── POST /api/admin/notifications/bulk ──────────────────────────────────────
// Supports:
//   { action, ids }                                  — operate on specific ids
//   { action, selectAll: true, filter, is_archived } — operate on ALL matching
exports.bulkActionNotifications = async (req, res) => {
  try {
    const {
      action,
      ids         = [],
      selectAll   = false,
      filter      = '',
      is_archived = 0,
      search      = '',
    } = req.body;
 
    const validActions = ['archive', 'restore', 'delete', 'mark_read'];
    if (!validActions.includes(action)) {
      return error(res, 'Invalid action', 400);
    }
 
    let targetIds = ids;
 
    // If selectAll=true, fetch all matching ids from DB
    if (selectAll) {
      const result = await notificationModel.findAllForAdmin({
        filter,
        is_archived: Number(is_archived),
        page:  1,
        limit: 99999,
        search,
      });
      targetIds = result.rows.map((n) => n.id);
    }
 
    if (!targetIds || targetIds.length === 0) {
      return error(res, 'No notifications selected', 400);
    }
 
    switch (action) {
      case 'archive':   await notificationModel.bulkArchive(targetIds); break;
      case 'restore':   await notificationModel.bulkRestore(targetIds); break;
      case 'delete':    await notificationModel.bulkDelete(targetIds);  break;
      case 'mark_read':
        // Inline bulk mark read (add to notificationModel if not exists)
        const db = require('../config/db');
        await db.query(
          'UPDATE notifications SET is_read = 1 WHERE id IN (?)',
          [targetIds]
        );
        break;
    }
 
    return success(res, { processed: targetIds.length }, `Bulk ${action} done`);
  } catch (err) {
    console.error('[bulkActionNotifications]', err);
    return error(res);
  }
};
 
// ── POST /api/admin/notifications ────────────────────────────────────────────
exports.createNotificationApi = async (req, res) => {
  try {
    const { scope, user_id, borrow_id, book_id, type, title, message } = req.body;
 
    if (!title || !message) {
      return error(res, 'title and message are required', 400);
    }
 
    if (scope === 'all' || scope === 'users_only') {
      await notificationModel.createForRoleUsers({ scope, type, title, message, book_id });
    } else {
      await notificationModel.create({ scope: 'user', user_id, borrow_id, book_id, type, title, message });
    }
 
    return success(res, null, 'Notification created');
  } catch (err) {
    console.error('[createNotificationApi]', err);
    return error(res);
  }
};

// exports.getBorrowChart = async (req, res) => {
//   try {
//     const year = parseInt(req.query.year) || new Date().getFullYear();
//     const db   = require('../config/db');

//     const [rows] = await db.query(`
//       SELECT
//         MONTH(borrow_date) AS month,
//         COUNT(*) AS borrows,
//         SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returns
//       FROM borrows
//       WHERE YEAR(borrow_date) = ?
//       GROUP BY MONTH(borrow_date)
//       ORDER BY month ASC
//     `, [year]);

//     // Fill tháng thiếu với 0
//     const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//     const chart  = MONTHS.map((name, i) => {
//       const found = rows.find(r => r.month === i + 1);
//       return {
//         month:   name,
//         borrows: Number(found?.borrows) || 0,
//         returns: Number(found?.returns) || 0,
//       };
//     });

//     return res.json({ success: true, data: chart });
//   } catch (err) {
//     console.error('[getBorrowChart]', err);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

exports.exportReports = async (req, res) => {
  try {
    const {
      from,
      to,
      type
    } = req.query;

    const rows =
      await reportModel.getAllReports({
        from,
        to,
        type
      });

    return success(
      res,
      rows,
      'Export reports successfully'
    );
  } catch (err) {
    return error(
      res,
      err.message
    );
  }
};

// ── Borrow admin endpoints (re-export từ borrowController – TV3) ──────────────
exports.getAllBorrows  = borrowCtrl.getAllBorrows;
exports.getOverdue    = borrowCtrl.getOverdue;
exports.approveBorrow = borrowCtrl.approveBorrow;
exports.rejectBorrow  = borrowCtrl.rejectBorrow;