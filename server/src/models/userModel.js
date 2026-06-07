'use strict';

const db = require('../config/db');

// Hàm dùng riêng cho đăng nhập (Cần lấy trường password để đối chiếu bcrypt)
const findAllForAdmin = async ({ role, status, search, page = 1, limit = 10 }) => {
  const conds  = [];
  const params = [];

  if (role)    { conds.push('u.role = ?');   params.push(role); }
  if (status)  { conds.push('u.status = ?'); params.push(status); }
  if (search)  { 
    // Giữ nguyên như getUsers, chỉ thêm u.phone LIKE ?
    conds.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)'); 
    params.push(`%${search}%`, `%${search}%`, `%${search}%`); 
  }

  const where  = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const limitN = Math.min(100, Number(limit));

  // 1. Đếm tổng số user (theo bộ lọc) để chia trang
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM users u ${where}`, params);
  
  // 2. Lấy dữ liệu user cho trang hiện tại
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.role, u.status, u.created_at,
            (SELECT COUNT(*) FROM borrows b WHERE b.user_id = u.id) AS total_borrows
    FROM users u
    ${where}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?`,
    [...params, limitN, offset]
  );
  
  // 3. THÊM MỚI: Truy vấn đếm tổng số liệu trên TOÀN BỘ Database (Không bị ảnh hưởng bởi bộ lọc)
  const statsSql = `
    SELECT 
      CAST(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS UNSIGNED) AS activeCount,
      CAST(SUM(CASE WHEN status = 'banned' THEN 1 ELSE 0 END) AS UNSIGNED) AS lockedCount,
      CAST(SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS UNSIGNED) AS adminCount,
      CAST(SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) AS UNSIGNED) AS employeeCount
    FROM users
  `;
  const [[globalStats]] = await db.query(statsSql);

  // Trả về kèm theo biến stats
  return { 
    data: rows, 
    totalItems: Number(total),
    stats: globalStats 
  };
};

const findCredentialsByEmail = async (email) => {
  const [rows] = await db.query(
    'SELECT id, email, password, role, status FROM users WHERE email = ?', 
    [email]
  );
  return rows[0] || null;
};

// Hàm lấy thông tin an toàn (Không bao gồm trường mật khẩu)
const findByEmail = async (email) => {
  const [rows] = await db.query(
    'SELECT id, full_name, email, phone, avatar_url, role, status, created_at FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await db.query(
    'SELECT id, full_name, email, phone, avatar_url, role, status, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

const create = async ({ full_name, email, password, phone }) => {
  const [result] = await db.query(
    `INSERT INTO users (full_name, email, password, phone, role, status)
    VALUES (?, ?, ?, ?, 'user', 'pending')`,
    [full_name, email, password, phone || null]
  );
  return result.insertId;
};

const updateProfile = async (id, fields) => {
  const cols = [];
  const values = [];
  
  // Xử lý chuẩn hóa dữ liệu: nếu truyền chuỗi rỗng hoặc undefined thì đưa về giá trị thích hợp hoặc bỏ qua
  if (fields.full_name !== undefined) { 
    cols.push('full_name = ?');  
    values.push(fields.full_name.trim());  
  }
  if (fields.phone !== undefined) { 
    cols.push('phone = ?');      
    values.push(fields.phone ? fields.phone.trim() : null);      
  }
  if (fields.avatar_url !== undefined) { 
    cols.push('avatar_url = ?'); 
    values.push(fields.avatar_url ? fields.avatar_url.trim() : null); 
  }
  
  if (!cols.length) return false;
  
  values.push(id);
  await db.query(`UPDATE users SET ${cols.join(', ')} WHERE id = ?`, values);
  return true;
};

const updatePassword = async (id, hashedPassword) => {
  await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
};

// ── Danh sách users (admin) ───────────────────────────────────────────────────
const getUsers = async ({ role, status, search, page = 1, limit = 20 }) => {
  const conds  = [];
  const params = [];
  if (role)    { conds.push('u.role = ?');   params.push(role); }
  if (status)  { conds.push('u.status = ?'); params.push(status); }
  if (search)  { conds.push('(u.full_name LIKE ? OR u.email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

  const where  = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const limitN = Math.min(100, Number(limit));

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM users u ${where}`, params);
  
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.status, u.created_at,
            (SELECT COUNT(*) FROM borrows b WHERE b.user_id = u.id) AS total_borrows
    FROM users u
    ${where}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?`,
    [...params, limitN, offset]
  );
  return { rows, total: Number(total) };
};

const toggleUserStatus = async (id) => {
  const [[user]] = await db.query('SELECT id, role, status FROM users WHERE id = ?', [id]);
  if (!user) throw Object.assign(new Error('Người dùng không tồn tại'), { statusCode: 404 });
  if (user.role === 'admin') throw Object.assign(new Error('Không thể khóa tài khoản admin'), { statusCode: 403 });

  const newStatus = user.status === 'banned' ? 'active'
                : user.status === 'pending' ? 'active'
                : 'banned';
  await db.query('UPDATE users SET status = ? WHERE id = ?', [newStatus, id]);
  return { id, status: newStatus };
};

const deleteUser = async (id) => {
  const [[user]] = await db.query('SELECT id, role FROM users WHERE id = ?', [id]);
  if (!user) throw Object.assign(new Error('Người dùng không tồn tại'), { statusCode: 404 });
  if (user.role === 'admin') throw Object.assign(new Error('Không thể xóa tài khoản admin'), { statusCode: 403 });

  const [[{ active }]] = await db.query(
    `SELECT COUNT(*) AS active FROM borrows WHERE user_id = ? AND status IN ('borrowing','renewed','overdue')`,
    [id]
  );
  if (active > 0) throw Object.assign(new Error(`Không thể xóa: user có ${active} lượt mượn đang active`), { statusCode: 409 });

  await db.query('DELETE FROM users WHERE id = ?', [id]);
};

const updateUserRole = async (id, role) => {
  const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  return result.affectedRows > 0;
}

const updateUserStatus = async (id, status) => {
  await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
  return { id, status };
};
const createUserByAdmin = async ({ full_name, email, password, phone, role }) => {
  const [result] = await db.query(
    `INSERT INTO users (full_name, email, password, phone, role, status)
    VALUES (?, ?, ?, ?, ?, 'active')`,
    [full_name, email, password, phone || null, role]
  );
  
  return result.insertId;
};

// Thêm vào cuối userModel.js, trước module.exports
const getUserStats = async (userId) => {
  const [[read]] = await db.query(
    `SELECT COUNT(*) AS total FROM borrows 
     WHERE user_id = ? AND status IN ('returned','returning')`,
    [userId]
  );
  const [[thisMonth]] = await db.query(
    `SELECT COUNT(*) AS total FROM borrows
     WHERE user_id = ? AND status IN ('returned','returning')
       AND MONTH(return_date) = MONTH(CURRENT_DATE())
       AND YEAR(return_date) = YEAR(CURRENT_DATE())`,
    [userId]
  );
  const [[rated]] = await db.query(
    `SELECT COUNT(*) AS total FROM reviews WHERE user_id = ?`,
    [userId]
  );
  return {
    booksRead:   Number(read.total),
    thisMonth:   Number(thisMonth.total),
    ratingGiven: Number(rated.total)
  };
};

module.exports = { 
  findAllForAdmin,
  findCredentialsByEmail, 
  findByEmail, 
  findById, 
  create, 
  updateProfile, 
  updatePassword,
  getUsers,
  toggleUserStatus,
  deleteUser,
  updateUserRole,
  createUserByAdmin,
  getUserStats,
};