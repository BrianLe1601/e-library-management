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
    status          ENUM('pending', 'borrowing', 'returning', 'returned', 'overdue', 'renewed', 'cancelled', 'lost') NOT NULL DEFAULT 'pending',
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
    borrow_id   INT UNSIGNED DEFAULT NULL ,
    rating      TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT DEFAULT NULL,
    is_visible  TINYINT(1) NOT NULL DEFAULT 1,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_borrow (user_id, borrow_id),
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_borrow FOREIGN KEY (borrow_id) REFERENCES borrows(id) ON DELETE CASCADE
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
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id          	INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     	INT UNSIGNED DEFAULT NULL,
    borrow_id   	INT UNSIGNED DEFAULT NULL,    
    book_id     	INT UNSIGNED DEFAULT NULL,
    receiver_role 	VARCHAR(20) DEFAULT 'user',
    title       	VARCHAR(255) NOT NULL,
    message     	TEXT NOT NULL,
    type        	ENUM('overdue', 'approved', 'returned', 'fine', 'system','borrow_request','return_request','renew','rejected') DEFAULT 'system',
    is_read     	TINYINT(1) NOT NULL DEFAULT 0,
    is_archived 	TINYINT(1) NOT NULL DEFAULT 0,
    created_at  	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_borrow FOREIGN KEY (borrow_id) REFERENCES borrows(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- ============================================================
-- 12. SAVED BOOKS
-- ============================================================
DROP TABLE IF EXISTS saved_books;
CREATE TABLE saved_books (
    user_id INT UNSIGNED NOT NULL,
    book_id INT UNSIGNED NOT NULL,
    saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, book_id),
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
-- 1. TẠO USERS (Đầy đủ Admin, Nhân viên và Bạn đọc)
-- Hash bcrypt của '123456' là: $2b$10$X7m6OfS7FXvB0WvD.E7gJOvfZGZ7Wre8v6H6kSdfGvjWvE0vS3mO.
INSERT INTO users (id, full_name, email, password, phone, role, status, login_method) VALUES
(1, 'Quản Trị Viên', 'admin@elibrary.com', '$2b$10$X7m6OfS7FXvB0WvD.E7gJOvfZGZ7Wre8v6H6kSdfGvjWvE0vS3mO.', '0999999999', 'admin', 'active', 'local'),
(2, 'Thủ Thư (Nhân viên 1)', 'thuthu1@elibrary.com', '$2b$10$X7m6OfS7FXvB0WvD.E7gJOvfZGZ7Wre8v6H6kSdfGvjWvE0vS3mO.', '0888888888', 'employee', 'active', 'local'),
(3, 'Nguyễn Văn A (Bạn đọc)', 'nguyenvana@gmail.com', '$2b$10$X7m6OfS7FXvB0WvD.E7gJOvfZGZ7Wre8v6H6kSdfGvjWvE0vS3mO.', '0901111111', 'user', 'active', 'local'),
(4, 'Trần Thị B (Bạn đọc)', 'tranthib@gmail.com', '$2b$10$X7m6OfS7FXvB0WvD.E7gJOvfZGZ7Wre8v6H6kSdfGvjWvE0vS3mO.', '0902222222', 'user', 'active', 'local'),
(5, 'Lê Văn C (Bạn đọc)', 'levanc@gmail.com', '$2b$10$X7m6OfS7FXvB0WvD.E7gJOvfZGZ7Wre8v6H6kSdfGvjWvE0vS3mO.', '0903333333', 'user', 'active', 'local');

-- 2. TẠO CATEGORIES
INSERT INTO categories (id, name, description) VALUES
(1, 'Công nghệ thông tin', 'Sách về lập trình, phần mềm, AI'), 
(2, 'Kinh tế - Khởi nghiệp', 'Kinh doanh, tài chính, đầu tư'), 
(3, 'Văn học - Tiểu thuyết', 'Tiểu thuyết trong và ngoài nước'),
(4, 'Kỹ năng sống', 'Phát triển bản thân, tâm lý học');

-- 3. TẠO AUTHORS
INSERT INTO authors (id, name, bio) VALUES
(1, 'Nguyễn Nhật Ánh', 'Nhà văn nổi tiếng với tuổi thơ Việt Nam'),
(2, 'Robert C. Martin', 'Tác giả của Clean Code'),
(3, 'Dale Carnegie', 'Chuyên gia nghệ thuật giao tiếp'),
(4, 'Tô Hoài', 'Nhà văn gạo cội của văn học Việt Nam');

-- 4. TẠO PUBLISHERS
INSERT INTO publishers (id, name, country) VALUES
(1, 'NXB Trẻ', 'Việt Nam'), 
(2, 'NXB Kim Đồng', 'Việt Nam'), 
(3, 'Prentice Hall', 'Mỹ');

-- 5. TẠO BOOKS
INSERT INTO books (id, title, author_id, publisher_id, isbn, description, cover_url, total_copies, available_copies) VALUES
(1, 'Clean Code - Mã Sạch', 2, 3, 'ISBN-978013235', 'Cẩm nang viết code sạch cho lập trình viên', 'https://placehold.co/300x450/e2e8f0/475569?text=Clean+Code', 10, 8),
(2, 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', 1, 1, 'ISBN-123456789', 'Một câu chuyện tuổi thơ đầy cảm xúc', 'https://placehold.co/300x450/e2e8f0/475569?text=Hoa+Vang+Co+Xanh', 5, 2),
(3, 'Đắc Nhân Tâm', 3, 1, 'ISBN-987654321', 'Nghệ thuật thu phục lòng người', 'https://placehold.co/300x450/e2e8f0/475569?text=Dac+Nhan+Tam', 8, 8),
(4, 'Dế Mèn Phiêu Lưu Ký', 4, 2, 'ISBN-555555555', 'Cuộc phiêu lưu của Dế Mèn', 'https://placehold.co/300x450/e2e8f0/475569?text=De+Men', 12, 10);

-- 6. MAP BOOK VỚI CATEGORY
INSERT INTO book_categories (book_id, category_id) VALUES
(1, 1), (2, 3), (3, 4), (4, 3);

-- 7. TẠO BORROWS (CÁC KỊCH BẢN DEMO THỰC TẾ)
-- Sử dụng CURRENT_DATE() để dữ liệu luôn hợp lệ với ngày bạn Demo
INSERT INTO borrows (id, user_id, book_id, handled_by, borrow_date, due_date, return_date, status, fine_amount, fine_paid) VALUES
-- Kịch bản 1: Đang chờ duyệt (Pending) -> User mới bấm Borrow Now
(1, 3, 1, NULL, CURRENT_DATE(), DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY), NULL, 'pending', 0, 0),

-- Kịch bản 2: Đang mượn (Borrowing) -> Admin đã Approved
(2, 4, 2, 2, DATE_SUB(CURRENT_DATE(), INTERVAL 3 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 11 DAY), NULL, 'borrowing', 0, 0),

-- Kịch bản 3: Đang yêu cầu trả sách (Returning) -> Đợi Admin Confirm Return
(3, 5, 4, 2, DATE_SUB(CURRENT_DATE(), INTERVAL 10 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 4 DAY), NULL, 'returning', 0, 0),

-- Kịch bản 4: Đã trả sách đúng hạn (Returned) -> Đóng luồng thành công
(4, 3, 3, 2, DATE_SUB(CURRENT_DATE(), INTERVAL 20 DAY), DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY), DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY), 'returned', 0, 0),

-- Kịch bản 5: Bị từ chối mượn (Cancelled)
(5, 5, 2, 2, DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 13 DAY), NULL, 'cancelled', 0, 0),

-- Kịch bản 6: Quá hạn mượn chưa trả (Overdue) -> Phạt 5000đ (Trễ 5 ngày)
(6, 4, 1, 2, DATE_SUB(CURRENT_DATE(), INTERVAL 19 DAY), DATE_SUB(CURRENT_DATE(), INTERVAL 5 DAY), NULL, 'overdue', 5000, 0),

-- Kịch bản 7: Báo mất sách (Lost)
(7, 3, 2, 2, DATE_SUB(CURRENT_DATE(), INTERVAL 15 DAY), DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), NULL, 'lost', 50000, 0);

-- 8. TẠO NOTIFICATIONS (Hệ thống thông báo đẩy cho Admin và User)
INSERT INTO notifications (user_id, borrow_id, book_id, receiver_role, title, message, type, is_read) VALUES
-- Admin nhận thông báo có người muốn mượn
(NULL, 1, 1, 'admin_employee', 'Yêu cầu mượn sách mới', 'Nguyễn Văn A muốn mượn cuốn "Clean Code - Mã Sạch"', 'borrow_request', 0),
-- Admin nhận thông báo có người muốn trả sách
(NULL, 3, 4, 'admin_employee', 'Yêu cầu trả sách', 'Lê Văn C muốn trả cuốn "Dế Mèn Phiêu Lưu Ký"', 'return_request', 0),
-- User nhận thông báo mượn thành công
(4, 2, 2, 'user', 'Mượn sách thành công', 'Yêu cầu mượn cuốn "Tôi Thấy Hoa Vàng Trên Cỏ Xanh" đã được duyệt', 'approved', 1),
-- User nhận thông báo bị từ chối
(5, 5, 2, 'user', 'Yêu cầu bị từ chối', 'Yêu cầu mượn "Tôi Thấy Hoa Vàng Trên Cỏ Xanh" bị từ chối do hết sách', 'rejected', 0),
-- User bị nhắc trễ hạn
(4, 6, 1, 'user', 'Sách quá hạn!', 'Cuốn "Clean Code - Mã Sạch" đã quá hạn 5 ngày. Vui lòng trả sách và nộp phạt', 'overdue', 0);

-- 9. TẠO REVIEWS & RATING (Demo chức năng đánh giá)
INSERT INTO reviews (user_id, book_id, borrow_id, rating, comment) VALUES
(3, 3, 4, 5, 'Sách rất hay, nhân viên thư viện nhiệt tình!');