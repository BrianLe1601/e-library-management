/**
 * reportModel.js — Tất cả câu SQL thống kê cho Admin
 * File: server/src/models/reportModel.js
 *
 * ĐÂY LÀ FILE QUAN TRỌNG NHẤT CỦA TV4
 * Chứa các câu SQL dùng JOIN + GROUP BY + COUNT để lấy thống kê
 */

const db = require("../config/db"); // Dùng db từ TV1

const reportModel = {

  // ─────────────────────────────────────────────────────────
  //  STATS — Số liệu tổng quan cho 4 StatsCards
  // ─────────────────────────────────────────────────────────

  /**
   * Lấy tất cả số liệu tổng quan trong một lần gọi DB
   * Dùng nhiều query song song bằng Promise.all để nhanh hơn
   */
  async getOverallStats() {
    const today = new Date().toISOString().slice(0, 10); // "2025-05-09"
    const thisMonth = today.slice(0, 7);                 // "2025-05"

    const [
      [booksRow],
      [usersRow],
      [activeBorrowsRow],
      [overdueBorrowsRow],
      [todayBorrowsRow],
      topBooks,
    ] = await Promise.all([

      // Tổng số sách và tổng số bản
      db.query(`
        SELECT
          COUNT(*)        AS totalBooks,
          SUM(quantity)   AS totalBookCopies
        FROM books
      `),

      // Tổng user và user mới trong tháng
      db.query(`
        SELECT
          COUNT(*)                                              AS totalUsers,
          SUM(DATE_FORMAT(created_at, '%Y-%m') = ?)            AS newUsersThisMonth
        FROM users
        WHERE role = 'user'
      `, [thisMonth]),

      // Số lượt đang mượn (status = 'approved')
      db.query(`
        SELECT COUNT(*) AS activeBorrows
        FROM borrows
        WHERE status = 'approved'
      `),

      // Số lượt quá hạn
      db.query(`
        SELECT COUNT(*) AS overdueBorrows
        FROM borrows
        WHERE status = 'overdue'
           OR (status = 'approved' AND due_date < ?)
      `, [today]),

      // Số lượt mượn hôm nay (tính cả pending)
      db.query(`
        SELECT COUNT(*) AS borrowsToday
        FROM borrows
        WHERE DATE(created_at) = ?
      `, [today]),

      // Top 5 sách được mượn nhiều nhất
      db.query(`
        SELECT
          b.id,
          b.title,
          b.author,
          COUNT(br.id) AS borrow_count
        FROM books b
        LEFT JOIN borrows br ON b.id = br.book_id
          AND br.status IN ('approved', 'returned', 'overdue')
        GROUP BY b.id
        ORDER BY borrow_count DESC
        LIMIT 5
      `),

    ]);

    return {
      totalBooks:        booksRow[0].totalBooks,
      totalBookCopies:   booksRow[0].totalBookCopies || 0,
      totalUsers:        usersRow[0].totalUsers,
      newUsersThisMonth: usersRow[0].newUsersThisMonth || 0,
      activeBorrows:     activeBorrowsRow[0].activeBorrows,
      overdueBorrows:    overdueBorrowsRow[0].overdueBorrows,
      borrowsToday:      todayBorrowsRow[0].borrowsToday,
      topBooks,
    };
  },

  // ─────────────────────────────────────────────────────────
  //  CHARTS — Dữ liệu cho Recharts
  // ─────────────────────────────────────────────────────────

  /**
   * Lấy số lượt mượn và trả theo từng tháng trong năm
   * Trả về mảng 12 tháng, thiếu tháng nào thì value = 0
   *
   * @param {number} year — Năm cần thống kê (vd: 2025)
   * @returns [{ month: 1, borrows: 12, returned: 8 }, ...]
   */
  async getBorrowChartData(year) {
    // Query đếm lượt mượn theo tháng
    const [borrowRows] = await db.query(`
      SELECT
        MONTH(created_at)   AS month,
        COUNT(*)            AS borrows
      FROM borrows
      WHERE YEAR(created_at) = ?
        AND status != 'rejected'
      GROUP BY MONTH(created_at)
      ORDER BY month
    `, [year]);

    // Query đếm lượt trả theo tháng
    const [returnRows] = await db.query(`
      SELECT
        MONTH(return_date)  AS month,
        COUNT(*)            AS returned
      FROM borrows
      WHERE YEAR(return_date) = ?
        AND status = 'returned'
      GROUP BY MONTH(return_date)
      ORDER BY month
    `, [year]);

    // Gộp lại thành mảng 12 tháng đầy đủ
    const result = [];
    for (let m = 1; m <= 12; m++) {
      const borrowEntry  = borrowRows.find(r => r.month === m);
      const returnEntry  = returnRows.find(r => r.month === m);
      result.push({
        month:    m,
        borrows:  borrowEntry  ? Number(borrowEntry.borrows)  : 0,
        returned: returnEntry  ? Number(returnEntry.returned) : 0,
      });
    }
    return result;
  },

  /**
   * Đếm số sách theo thể loại cho PieChart
   * @returns [{ name: "Công nghệ", value: 12 }, ...]
   */
  async getCategoryChartData() {
    const [rows] = await db.query(`
      SELECT
        category      AS name,
        COUNT(*)      AS value
      FROM books
      GROUP BY category
      ORDER BY value DESC
    `);
    return rows;
  },

  // ─────────────────────────────────────────────────────────
  //  REPORTS — Báo cáo theo khoảng thời gian
  // ─────────────────────────────────────────────────────────

  /**
   * Lấy danh sách mượn/trả theo khoảng ngày
   * @param {string} from   — "2025-01-01"
   * @param {string} to     — "2025-12-31"
   * @param {string} type   — "borrows" | "returned" | "overdue"
   */
  async getReportByDateRange(from, to, type) {
    // Xác định điều kiện WHERE theo type
    const statusCondition = {
      borrows:  `br.status IN ('pending', 'approved', 'overdue')`,
      returned: `br.status = 'returned'`,
      overdue:  `br.status = 'overdue' OR (br.status = 'approved' AND br.due_date < CURDATE())`,
    }[type] || `br.status != 'rejected'`;

    const [rows] = await db.query(`
      SELECT
        br.id,
        u.name        AS user_name,
        u.email       AS user_email,
        b.title       AS book_title,
        b.author      AS book_author,
        br.borrow_date,
        br.due_date,
        br.return_date,
        br.status,
        br.fine
      FROM borrows br
      JOIN users u ON br.user_id = u.id
      JOIN books b ON br.book_id = b.id
      WHERE ${statusCondition}
        AND DATE(br.created_at) BETWEEN ? AND ?
      ORDER BY br.created_at DESC
    `, [from, to]);

    return rows;
  },

  /**
   * Top sách được mượn nhiều nhất
   * @param {number} limit
   */
  async getTopBooks(limit = 10) {
    const [rows] = await db.query(`
      SELECT
        b.id,
        b.title,
        b.author,
        b.category,
        b.image_url,
        COUNT(br.id)                   AS borrow_count,
        SUM(br.status = 'returned')    AS return_count,
        SUM(br.status = 'overdue')     AS overdue_count
      FROM books b
      LEFT JOIN borrows br ON b.id = br.book_id
        AND br.status IN ('approved', 'returned', 'overdue')
      GROUP BY b.id
      ORDER BY borrow_count DESC
      LIMIT ?
    `, [limit]);

    return rows;
  },

  // ─────────────────────────────────────────────────────────
  //  USER MANAGEMENT
  // ─────────────────────────────────────────────────────────

  /**
   * Lấy danh sách user với phân trang và tìm kiếm
   * @param {object} params — { page, limit, role, search }
   */
  async getUsers({ page = 1, limit = 10, role, search } = {}) {
    const offset = (page - 1) * limit;

    // Xây conditions động
    const conditions = ["role != 'admin'"]; // Không hiện admin trong danh sách
    const values = [];

    if (role) {
      conditions.push("role = ?");
      values.push(role);
    }
    if (search) {
      conditions.push("(name LIKE ? OR email LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }

    const WHERE = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Đếm tổng để tính pagination
    const [[countRow]] = await db.query(
      `SELECT COUNT(*) AS total FROM users ${WHERE}`,
      values
    );

    // Lấy data
    const [rows] = await db.query(
      `SELECT id, name, email, phone, avatar, role, is_active, created_at
       FROM users
       ${WHERE}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return {
      data:       rows,
      total:      countRow.total,
      page:       Number(page),
      totalPages: Math.ceil(countRow.total / limit),
    };
  },

  /**
   * Đổi trạng thái is_active của user (khóa / mở khóa)
   */
  async toggleUserStatus(userId, isActive) {
    const [result] = await db.query(
      `UPDATE users SET is_active = ? WHERE id = ? AND role != 'admin'`,
      [isActive, userId]
    );
    return result.affectedRows > 0;
  },

  /**
   * Xóa user (không được xóa admin)
   */
  async deleteUser(userId) {
    const [result] = await db.query(
      `DELETE FROM users WHERE id = ? AND role != 'admin'`,
      [userId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = reportModel;