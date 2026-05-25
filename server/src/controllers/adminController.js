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
    const { 
      search = '', category = '', author = '', publisher = '', 
      availability = 'all', sort = 'latest', page = 1, limit = 20 
    } = req.query;

    const { rows, total } = await bookModel.findAll({ 
      search, category, author, publisher, availability, sort, 
      page: Number(page), 
      limit: Number(limit),
      includeHidden: true
    });

    return paginated(res, rows, total, Number(page), Number(limit));
  } catch (err) {
    console.error('[adminGetBooks] Error:', err);
    return error(res, 'System Error while fetching books', 500);
  }
};

// ── GET /api/admin/books/publishers ──────────────────────────────────────────
exports.getPublishers = async (req, res) => {
  try {
    const publishers = await bookModel.findAllPublishers();
    return success(res, publishers, 'Lấy danh sách nhà xuất bản thành công');
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

    // Tương tự, nếu Admin CÓ CHỌN ảnh mới thì lấy link mới
    // Nếu KHÔNG CHỌN ảnh mới thì req.file sẽ rỗng, ta giữ nguyên ảnh cũ trong DB
    if (req.file && req.file.path) {
      bookData.cover_url = req.file.path;
    }

    // Gọi Model update sách (Giả định trong bookModel có hàm update)
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
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const { rows, total } = await userModel.getUsers({ role, status, search, page, limit });
    return paginated(res, rows, total, page, limit);
  } catch (err) {
    console.error('[getUsers]', err);
    return error(res, 'System Error while fetching users', 500);
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
    // Bắt lỗi trùng Email (Mã lỗi của MySQL khi vi phạm UNIQUE constraint)
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

// ── GET /api/admin/reports/export ────────────────────────────────────────────
exports.exportReport = async (req, res) => {
  try {
    const { from, to, type = 'all', format = 'json' } = req.query;
    const { rows } = await reportModel.getReports({ from, to, type: type === 'all' ? '' : type, page: 1, limit: 1000 });

    /*
     * TODO (TV4): Tích hợp thư viện xuất file thật sự:
     *   PDF   → pdfkit / puppeteer
     *   Excel → exceljs
     *
     * Hiện tại trả JSON mockup kèm preview 5 dòng đầu.
     */
    return res.json({
      success:     true,
      message:     `[Mockup] Sẽ xuất ${format.toUpperCase()} trong production`,
      export_info: { format, total_records: rows.length, filter: { from, to, type }, generated_at: new Date().toISOString() },
      preview:     rows.slice(0, 5),
    });
  } catch (err) {
    console.error('[exportReport]', err);
    return error(res, 'System Error while exporting report', 500);
  }
};

// ── Borrow admin endpoints (re-export từ borrowController – TV3) ──────────────
exports.getAllBorrows  = borrowCtrl.getAllBorrows;
exports.getOverdue    = borrowCtrl.getOverdue;
exports.approveBorrow = borrowCtrl.approveBorrow;
exports.rejectBorrow  = borrowCtrl.rejectBorrow;
