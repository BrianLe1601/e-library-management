/**
 * adminController.js — Xử lý logic cho các API admin
 * File: server/src/controllers/adminController.js
 *
 * NGUYÊN TẮC:
 *  - Controller KHÔNG tự viết SQL, chỉ gọi model
 *  - Validate input, xử lý lỗi, trả về JSON chuẩn
 *  - Dùng try/catch cho mọi hàm async
 */

const reportModel = require("../models/reportModel");

const adminController = {

  // ─────────────────────────────────────────────────────────
  //  GET /api/admin/stats
  // ─────────────────────────────────────────────────────────
  async getStats(req, res) {
    try {
      const stats = await reportModel.getOverallStats();
      res.json(stats);
    } catch (error) {
      console.error("getStats error:", error);
      res.status(500).json({ message: "Lỗi server khi lấy thống kê" });
    }
  },

  // ─────────────────────────────────────────────────────────
  //  GET /api/admin/reports/borrow-chart?year=2025
  // ─────────────────────────────────────────────────────────
  async getBorrowChartData(req, res) {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const data = await reportModel.getBorrowChartData(year);
      res.json(data);
    } catch (error) {
      console.error("getBorrowChartData error:", error);
      res.status(500).json({ message: "Lỗi server khi lấy dữ liệu chart" });
    }
  },

  // ─────────────────────────────────────────────────────────
  //  GET /api/admin/reports/category-chart
  // ─────────────────────────────────────────────────────────
  async getCategoryChartData(req, res) {
    try {
      const data = await reportModel.getCategoryChartData();
      res.json(data);
    } catch (error) {
      console.error("getCategoryChartData error:", error);
      res.status(500).json({ message: "Lỗi server khi lấy phân bố thể loại" });
    }
  },

  // ─────────────────────────────────────────────────────────
  //  GET /api/admin/reports?from=&to=&type=
  // ─────────────────────────────────────────────────────────
  async getReports(req, res) {
    try {
      const { from, to, type = "borrows" } = req.query;

      // Validate: phải có from và to
      if (!from || !to) {
        return res.status(400).json({ message: "Thiếu tham số from hoặc to" });
      }

      // Validate định dạng ngày YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(from) || !dateRegex.test(to)) {
        return res.status(400).json({ message: "Định dạng ngày phải là YYYY-MM-DD" });
      }

      if (new Date(from) > new Date(to)) {
        return res.status(400).json({ message: "Ngày bắt đầu phải trước ngày kết thúc" });
      }

      const validTypes = ["borrows", "returned", "overdue"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "type phải là: borrows | returned | overdue" });
      }

      const data = await reportModel.getReportByDateRange(from, to, type);
      res.json(data);
    } catch (error) {
      console.error("getReports error:", error);
      res.status(500).json({ message: "Lỗi server khi lấy báo cáo" });
    }
  },

  // ─────────────────────────────────────────────────────────
  //  GET /api/admin/reports/top-books?limit=10
  // ─────────────────────────────────────────────────────────
  async getTopBooks(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Tối đa 50
      const data = await reportModel.getTopBooks(limit);
      res.json(data);
    } catch (error) {
      console.error("getTopBooks error:", error);
      res.status(500).json({ message: "Lỗi server khi lấy top sách" });
    }
  },

  // ─────────────────────────────────────────────────────────
  //  GET /api/admin/reports/export?format=pdf&from=&to=
  //  (Tính năng nâng cao — làm sau)
  // ─────────────────────────────────────────────────────────
  async exportReport(req, res) {
    try {
      const { format = "pdf", from, to, type = "borrows" } = req.query;

      if (!from || !to) {
        return res.status(400).json({ message: "Thiếu tham số from hoặc to" });
      }

      const data = await reportModel.getReportByDateRange(from, to, type);

      if (format === "excel") {
        // ── Excel export bằng exceljs ──────────────────────
        const ExcelJS = require("exceljs");
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Báo cáo mượn sách");

        // Header
        sheet.columns = [
          { header: "Người mượn",  key: "user_name",    width: 20 },
          { header: "Email",        key: "user_email",   width: 25 },
          { header: "Tên sách",     key: "book_title",   width: 30 },
          { header: "Ngày mượn",    key: "borrow_date",  width: 15 },
          { header: "Hạn trả",      key: "due_date",     width: 15 },
          { header: "Ngày trả",     key: "return_date",  width: 15 },
          { header: "Trạng thái",   key: "status",       width: 12 },
          { header: "Tiền phạt",    key: "fine",         width: 12 },
        ];

        // Style header row
        sheet.getRow(1).eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.alignment = { horizontal: "center" };
        });

        // Data
        data.forEach(row => sheet.addRow(row));

        // Xuất file
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="report_${from}_${to}.xlsx"`);
        await workbook.xlsx.write(res);
        return res.end();

      } else {
        // ── PDF export bằng pdfkit ─────────────────────────
        const PDFDocument = require("pdfkit");
        const doc = new PDFDocument({ margin: 40 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="report_${from}_${to}.pdf"`);
        doc.pipe(res);

        // Tiêu đề
        doc.fontSize(18).text("BÁO CÁO MƯỢN SÁCH", { align: "center" });
        doc.fontSize(11).text(`Từ ${from} đến ${to}`, { align: "center" });
        doc.moveDown();

        // Bảng đơn giản
        data.forEach((row, i) => {
          doc.fontSize(10).text(
            `${i + 1}. ${row.user_name} | ${row.book_title} | ${row.status} | ${row.fine} VNĐ`
          );
        });

        doc.end();
      }

    } catch (error) {
      console.error("exportReport error:", error);
      res.status(500).json({ message: "Lỗi khi xuất báo cáo" });
    }
  },

  // ─────────────────────────────────────────────────────────
  //  GET /api/admin/users
  // ─────────────────────────────────────────────────────────
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      const result = await reportModel.getUsers({ page, limit, role, search });
      res.json(result);
    } catch (error) {
      console.error("getUsers error:", error);
      res.status(500).json({ message: "Lỗi server khi lấy danh sách user" });
    }
  },

  // ─────────────────────────────────────────────────────────
  //  PATCH /api/admin/users/:id/status
  // ─────────────────────────────────────────────────────────
  async toggleUserStatus(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const { is_active } = req.body;

      if (typeof is_active !== "boolean") {
        return res.status(400).json({ message: "is_active phải là true hoặc false" });
      }

      const success = await reportModel.toggleUserStatus(userId, is_active);
      if (!success) {
        return res.status(404).json({ message: "Không tìm thấy user hoặc không thể thay đổi" });
      }

      res.json({
        message: is_active ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
        userId,
        is_active,
      });
    } catch (error) {
      console.error("toggleUserStatus error:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // ─────────────────────────────────────────────────────────
  //  DELETE /api/admin/users/:id
  // ─────────────────────────────────────────────────────────
  async deleteUser(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const success = await reportModel.deleteUser(userId);

      if (!success) {
        return res.status(404).json({ message: "Không tìm thấy user hoặc không thể xóa admin" });
      }

      res.json({ message: "Đã xóa tài khoản thành công", userId });
    } catch (error) {
      console.error("deleteUser error:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
};

module.exports = adminController;