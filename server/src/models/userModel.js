'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 1 — Authentication & User System        ║
 * ║  Model: userModel.js                                ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Chứa toàn bộ query SQL liên quan đến bảng `users`.
 * Controller KHÔNG viết SQL trực tiếp, chỉ gọi các hàm ở đây.
 */

const db = require('../config/db');

const findByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await db.query(
    'SELECT id, full_name, email, phone, avatar_url, role, is_active, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

const create = async ({ full_name, email, password, phone }) => {
  const [result] = await db.query(
    `INSERT INTO users (full_name, email, password, phone, role, is_active)
     VALUES (?, ?, ?, ?, 'user', 1)`,
    [full_name, email, password, phone || null]
  );
  return result.insertId;
};

const updateProfile = async (id, fields) => {
  // fields = { full_name?, phone?, avatar_url? }
  const cols   = [];
  const values = [];
  if (fields.full_name  !== undefined) { cols.push('full_name = ?');  values.push(fields.full_name);  }
  if (fields.phone      !== undefined) { cols.push('phone = ?');      values.push(fields.phone);      }
  if (fields.avatar_url !== undefined) { cols.push('avatar_url = ?'); values.push(fields.avatar_url); }
  if (!cols.length) return false;
  values.push(id);
  await db.query(`UPDATE users SET ${cols.join(', ')} WHERE id = ?`, values);
  return true;
};

const updatePassword = async (id, hashedPassword) => {
  await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
};

module.exports = { findByEmail, findById, create, updateProfile, updatePassword };
