-- ============================================================
--  E-Library Management System — Database Schema
--  File: server/src/config/init.sql
--  Chạy file này MỘT LẦN để tạo toàn bộ cấu trúc database
-- ============================================================

-- 1. Tạo database nếu chưa có, rồi dùng nó
CREATE DATABASE IF NOT EXISTS elibrary_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE elibrary_db;

-- ============================================================
--  BẢNG 1: users
--  Lưu thông tin tài khoản người dùng và admin
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           INT           NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100)  NOT NULL,
  email        VARCHAR(150)  NOT NULL UNIQUE,
  password     VARCHAR(255)  NOT NULL,              -- Đã hash bằng bcrypt
  phone        VARCHAR(20)   DEFAULT NULL,
  avatar       VARCHAR(255)  DEFAULT NULL,          -- URL ảnh đại diện
  role         ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE, -- FALSE = tài khoản bị khóa
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  BẢNG 2: books
--  Lưu thông tin sách trong thư viện
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
  id                 INT           NOT NULL AUTO_INCREMENT,
  title              VARCHAR(200)  NOT NULL,
  author             VARCHAR(150)  NOT NULL,
  category           VARCHAR(100)  NOT NULL,
  description        TEXT          DEFAULT NULL,
  isbn               VARCHAR(20)   DEFAULT NULL UNIQUE,
  quantity           INT           NOT NULL DEFAULT 1,           -- Tổng số bản
  available_quantity INT           NOT NULL DEFAULT 1,           -- Số bản có thể mượn
  image_url          VARCHAR(255)  DEFAULT NULL,
  published_year     INT           DEFAULT NULL,
  created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_books_title    (title),
  INDEX idx_books_author   (author),
  INDEX idx_books_category (category),

  -- Đảm bảo available_quantity không vượt quá quantity
  CONSTRAINT chk_available CHECK (available_quantity >= 0 AND available_quantity <= quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  BẢNG 3: borrows
--  Lưu lịch sử mượn/trả sách
--  Quan hệ: users (1) —< borrows >— (1) books
-- ============================================================
CREATE TABLE IF NOT EXISTS borrows (
  id          INT             NOT NULL AUTO_INCREMENT,
  user_id     INT             NOT NULL,
  book_id     INT             NOT NULL,
  borrow_date DATE            DEFAULT NULL,                          -- Ngày admin duyệt
  due_date    DATE            DEFAULT NULL,                          -- Hạn trả (borrow_date + 14 ngày)
  return_date DATE            DEFAULT NULL,                          -- Ngày trả thực tế
  status      ENUM(
                'pending',    -- Đang chờ admin duyệt
                'approved',   -- Đã được duyệt, đang mượn
                'returned',   -- Đã trả
                'overdue',    -- Quá hạn chưa trả
                'rejected'    -- Admin từ chối
              ) NOT NULL DEFAULT 'pending',
  fine        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,  -- Tiền phạt (VNĐ)
  notes       TEXT           DEFAULT NULL,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,

  INDEX idx_borrows_user_id (user_id),
  INDEX idx_borrows_book_id (book_id),
  INDEX idx_borrows_status  (status),
  INDEX idx_borrows_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  DỮ LIỆU MẪU (Seed Data) — để test ngay sau khi chạy
-- ============================================================

-- Tài khoản Admin mặc định
-- Password gốc: Admin@123 (đã hash bằng bcrypt rounds=10)
INSERT INTO users (name, email, password, role) VALUES
  ('Admin', 'admin@elibrary.com', '$2b$10$xQK1N7HrkxoAhzKq7FGKde3vlXbYyZf.E8NKwqvqFOHuEf5O9KFxq', 'admin');

-- Tài khoản User thử nghiệm
-- Password gốc: User@123 (đã hash bằng bcrypt rounds=10)
INSERT INTO users (name, email, password, role) VALUES
  ('Nguyen Van A', 'user@elibrary.com', '$2b$10$YKcT3xD2kBzWw3.PmLjUFuJxQQvJqrjT2Cx5oUvHBx7aFBVzU5Fxi', 'user');

-- Sách mẫu
INSERT INTO books (title, author, category, description, quantity, available_quantity, published_year) VALUES
  ('Lập Trình JavaScript Căn Bản', 'Nguyen Van B', 'Công nghệ', 'Sách học JavaScript từ cơ bản đến nâng cao.', 5, 5, 2022),
  ('NodeJS Thực Chiến', 'Tran Thi C', 'Công nghệ', 'Xây dựng REST API với NodeJS và Express.', 3, 3, 2023),
  ('ReactJS Cho Người Mới Bắt Đầu', 'Le Van D', 'Công nghệ', 'Hướng dẫn học React từ cơ bản.', 4, 4, 2023),
  ('Cơ Sở Dữ Liệu MySQL', 'Pham Thi E', 'Công nghệ', 'Thiết kế và quản lý CSDL MySQL.', 3, 3, 2021),
  ('Nhà Giả Kim', 'Paulo Coelho', 'Văn học', 'Tiểu thuyết nổi tiếng về hành trình tìm kiếm ước mơ.', 6, 6, 2020);

-- ============================================================
--  KIỂM TRA sau khi chạy — copy paste từng lệnh này vào
--  MySQL Workbench để xác nhận các bảng đã được tạo đúng
-- ============================================================
-- SHOW TABLES;
-- DESCRIBE users;
-- DESCRIBE books;
-- DESCRIBE borrows;
-- SELECT * FROM users;
-- SELECT * FROM books;