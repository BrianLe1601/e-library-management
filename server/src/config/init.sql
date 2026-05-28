CREATE DATABASE IF NOT EXISTS e_library
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE e_library;

-- ============================================================
-- LÀM SẠCH DATABASE CŨ (Xóa theo thứ tự tránh lỗi khóa ngoại)
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications, reviews, borrow_renewals, borrows, book_categories, books, publishers, authors, categories, otps, users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. BẢNG USERS (Đã thêm cơ chế Đăng nhập Google)
-- ============================================================
CREATE TABLE users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL, -- Sẽ lưu 'GOOGLE_AUTH_ACCOUNT' nếu login bằng Google
    phone         VARCHAR(20) DEFAULT NULL,
    avatar_url    VARCHAR(500) DEFAULT NULL,
    role          ENUM('user','employee','admin') NOT NULL DEFAULT 'user',
    status        ENUM('pending', 'active', 'banned') DEFAULT 'pending',
    login_method  ENUM('local', 'google') DEFAULT 'local', -- Phân biệt loại tài khoản
    google_id     VARCHAR(255) DEFAULT NULL, -- Lưu ID định danh của Google nếu có
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- CÁC BẢNG DANH MỤC, TÁC GIẢ, NHÀ XUẤT BẢN (Giữ nguyên cấu trúc tốt của bạn)
-- ============================================================
CREATE TABLE categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE authors (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    bio         TEXT DEFAULT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE publishers (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL UNIQUE,
    country     VARCHAR(100) DEFAULT NULL,
    website     VARCHAR(255) DEFAULT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. BẢNG BOOKS (Ảnh bìa cover_url kết nối mượt với Cloudinary)
-- ============================================================
CREATE TABLE books (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    author_id        INT UNSIGNED NOT NULL,
    publisher_id     INT UNSIGNED DEFAULT NULL,
    isbn             VARCHAR(20) DEFAULT NULL UNIQUE,
    publish_year     INT DEFAULT NULL,
    description      TEXT DEFAULT NULL,
    cover_url        VARCHAR(500) DEFAULT NULL, -- Lưu link ảnh từ Cloudinary trả về
    total_copies     INT UNSIGNED NOT NULL DEFAULT 1,
    available_copies INT UNSIGNED NOT NULL DEFAULT 1,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_hidden 		 TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_book_author FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE RESTRICT,
    CONSTRAINT fk_book_publisher FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE SET NULL
);

CREATE TABLE book_categories (
    book_id     INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (book_id, category_id),
    CONSTRAINT fk_bc_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_bc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. BẢNG BORROWS & RENEWALS (Rất tốt cho luồng xử lý mượn trả của Thành viên 3)
-- ============================================================
CREATE TABLE borrows (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    book_id         INT UNSIGNED NOT NULL,
    handled_by      INT UNSIGNED DEFAULT NULL,
    borrow_date     DATE NOT NULL DEFAULT (CURRENT_DATE),
    due_date        DATE NOT NULL,
    return_date     DATE DEFAULT NULL,
    renewed_count   TINYINT UNSIGNED NOT NULL DEFAULT 0,
    status          ENUM('pending', 'borrowing', 'returned', 'overdue', 'renewed', 'cancelled', 'lost') NOT NULL DEFAULT 'pending',
    fine_amount     INT UNSIGNED NOT NULL DEFAULT 0,
    fine_paid       TINYINT(1) NOT NULL DEFAULT 0,
    note            TEXT DEFAULT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_borrow_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_borrow_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT,
    CONSTRAINT fk_borrow_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE borrow_renewals (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    borrow_id       INT UNSIGNED NOT NULL,
    renewed_by      INT UNSIGNED DEFAULT NULL,
    old_due_date    DATE NOT NULL,
    new_due_date    DATE NOT NULL,
    renewed_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_renewal_borrow FOREIGN KEY (borrow_id) REFERENCES borrows(id) ON DELETE CASCADE,
    CONSTRAINT fk_renewal_handler FOREIGN KEY (renewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE reviews (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    book_id     INT UNSIGNED NOT NULL,
    rating      TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT DEFAULT NULL,
    is_visible  TINYINT(1) NOT NULL DEFAULT 1,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_book (user_id, book_id),
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- ============================================================
-- 10. OTPS (Đã tối ưu trường bảo mật phân loại hành động)
-- ============================================================
CREATE TABLE otps (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(150) NOT NULL,
    otp_code    VARCHAR(6) NOT NULL,
    action_type ENUM('register', 'forgot_password') NOT NULL, -- Phân biệt mục đích gửi mã
    is_used     TINYINT(1) DEFAULT 0, -- Đánh dấu nếu OTP đã được dùng xong
    expires_at  DATETIME NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otps_email (email)
);

-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    type        ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
    is_read     TINYINT(1) NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- ============================================================
-- 12. saved_books
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_books (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    book_id    INT UNSIGNED NOT NULL,
    saved_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_book (user_id, book_id),
    CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);


-- ============================================================
-- INDEXES TỐI ƯU TRUY VẤN
-- ============================================================
CREATE INDEX idx_users_role        ON users(role);
CREATE INDEX idx_books_title       ON books(title);
CREATE INDEX idx_books_author      ON books(author_id);
CREATE INDEX idx_books_publisher   ON books(publisher_id);
CREATE INDEX idx_borrows_user      ON borrows(user_id);
CREATE INDEX idx_borrows_book      ON borrows(book_id);
CREATE INDEX idx_borrows_handler   ON borrows(handled_by);
CREATE INDEX idx_borrows_status    ON borrows(status);
CREATE INDEX idx_borrows_due_date  ON borrows(due_date);
CREATE INDEX idx_reviews_book      ON reviews(book_id);

-- ============================================================
-- THÊM DỮ LIỆU MẪU (ĐÃ SỬA LỖI ENUM STATUS THÀNH 'active')
-- ============================================================
INSERT INTO users (id, full_name, email, password, phone, role, status, login_method) VALUES
(1, 'Admin System', 'admin@library.com', '$2b$10$X7m6OfS7FXvB0WvD.E7gJOvfZGZ7Wre8v6H6kSdfGvjWvE0vS3mO.', '0123456789', 'admin', 'active', 'local'),
(2, 'Nhân viên 1', 'employee1@library.com', '$2b$10$X7m6OfS7FXvB0WvD.E7gJOvfZGZ7Wre8v6H6kSdfGvjWvE0vS3mO.', '0987654321', 'employee', 'active', 'local'),
(3, 'Nhân viên 2', 'employee2@library.com', '$2b$10$X7m6OfS7FXvB0WvD.E7gJOvfZGZ7Wre8v6H6kSdfGvjWvE0vS3mO.', '0912345678', 'employee', 'active', 'local'),
(4, 'Người dùng A', 'usera@gmail.com', '$2b$10$X7m6OfS7FXvB0WvD.E7gJOvfZGZ7Wre8v6H6kSdfGvjWvE0vS3mO.', '0901111111', 'user', 'active', 'local'),
(5, 'Người dùng B', 'userb@gmail.com', '$2b$10$X7m6OfS7FXvB0WvD.E7gJOvfZGZ7Wre8v6H6kSdfGvjWvE0vS3mO.', '0902222222', 'user', 'active', 'local'),
(6, 'Người dùng C', 'userc@gmail.com', '$2b$10$X7m6OfS7FXvB0WvD.E7gJOvfZGZ7Wre8v6H6kSdfGvjWvE0vS3mO.', '0903333333', 'user', 'active', 'local');

INSERT INTO categories (id, name, description) VALUES
(1, 'Văn học Việt Nam', NULL), (2, 'Văn học Nước Ngoài', NULL), (3, 'Khoa học - Công nghệ', NULL), 
(4, 'Kinh tế - Kinh doanh', NULL), (5, 'Tâm lý - Kỹ năng sống', NULL);

INSERT INTO authors (id, name, bio) VALUES
(1, 'Nguyễn Nhật Ánh', 'Nhà văn tài năng chuyên viết về tuổi học trò.'),
(2, 'Tô Hoài', 'Tác giả Dế Mèn Phiêu Lưu Ký.'),
(3, 'Dale Carnegie', 'Tác giả cuốn sách Đắc Nhân Tâm.'),
(4, 'Haruki Murakami', 'Nhà văn đương đại Nhật Bản.'),
(5, 'George Orwell', 'Nhà văn người Anh.');

INSERT INTO publishers (id, name, country) VALUES
(1, 'NXB Trẻ', 'Việt Nam'), (2, 'NXB Văn Học', 'Việt Nam'), (3, 'NXB Kim Đồng', 'Việt Nam');

INSERT INTO books (id, title, author_id, publisher_id, isbn, cover_url, total_copies, available_copies) VALUES
(1, 'Mắt Biếc', 1, 1, 'ISBN-001', 'https://placehold.co/300x450/e2e8f0/475569?text=Mat+Biec', 5, 4), 
(2, 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', 1, 1, 'ISBN-002', 'https://placehold.co/300x450/e2e8f0/475569?text=Cho+Toi+Xin+Mot+Ve', 3, 2), 
(3, 'Dế Mèn Phiêu Lưu Ký', 2, 3, 'ISBN-003', 'https://placehold.co/300x450/e2e8f0/475569?text=De+Men', 4, 2), 
(4, 'Đắc Nhân Tâm', 3, 1, 'ISBN-004', 'https://placehold.co/300x450/e2e8f0/475569?text=Dac+Nhan+Tam', 6, 6), 
(5, 'Rừng Na Uy', 4, 2, 'ISBN-005', 'https://placehold.co/300x450/e2e8f0/475569?text=Rung+Na+Uy', 2, 1), 
(6, '1984', 5, 2, 'ISBN-006', 'https://placehold.co/300x450/e2e8f0/475569?text=1984', 5, 5), 
(7, 'Trại Súc Vật', 5, 2, 'ISBN-007', 'https://placehold.co/300x450/e2e8f0/475569?text=Trai+Suc+Vat', 3, 2), 
(8, 'Kính Vạn Hoa', 1, 3, 'ISBN-008', 'https://placehold.co/300x450/e2e8f0/475569?text=Kinh+Van+Hoa', 4, 4), 
(9, 'Tôi Thấy Hoa Vàng', 1, 1, 'ISBN-009', 'https://placehold.co/300x450/e2e8f0/475569?text=Toi+Thay+Hoa+Vang', 3, 3), 
(10, 'Biên Niên Ký Chim Vặn Cót', 4, 2, 'ISBN-010', 'https://placehold.co/300x450/e2e8f0/475569?text=Chim+Van+Cot', 5, 4), 
(11, 'Vợ Nhặt', 2, 2, 'ISBN-011', 'https://placehold.co/300x450/e2e8f0/475569?text=Vo+Nhat', 2, 2), 
(12, 'Quẳng Gánh Lo Đi', 3, 1, 'ISBN-012', 'https://placehold.co/300x450/e2e8f0/475569?text=Quang+Ganh+Lo', 4, 3);

INSERT INTO book_categories (book_id, category_id) VALUES
(1, 1), (2, 1), (3, 1), (4, 5), (5, 2), (6, 2), (7, 2), (8, 1), (9, 1), (10, 2), (11, 1), (12, 5);

INSERT INTO borrows (user_id, book_id, handled_by, borrow_date, due_date, status) VALUES
(4, 1, 2, '2026-05-10', '2026-05-24', 'borrowing'),
(5, 2, 3, '2026-05-11', '2026-05-25', 'borrowing'),
(6, 3, 2, '2026-05-01', '2026-05-15', 'overdue'),
(4, 3, 2, '2026-05-15', '2026-05-29', 'borrowing'),
(5, 5, 3, '2026-05-12', '2026-05-26', 'renewed'),
(6, 7, 2, '2026-05-14', '2026-05-28', 'borrowing'),
(4, 10, 3, '2026-05-16', '2026-05-30', 'borrowing'),
(5, 12, 2, '2026-05-17', '2026-05-31', 'borrowing');

INSERT INTO reviews (user_id, book_id, rating, comment) VALUES
(4, 1, 5, 'Rất hay'), (5, 1, 4, 'Kết buồn'), (6, 2, 5, 'Tuyệt vời'), 
(4, 4, 5, 'Bổ ích'), (5, 5, 4, 'Sâu sắc'), (6, 6, 5, 'Kinh điển');