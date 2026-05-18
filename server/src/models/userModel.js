'use strict';

const db = require('../config/db');

// Hàm dùng riêng cho đăng nhập (Cần lấy trường password để đối chiếu bcrypt)
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

module.exports = { 
  findCredentialsByEmail, 
  findByEmail, 
  findById, 
  create, 
  updateProfile, 
  updatePassword 
};