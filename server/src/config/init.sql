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
-- THÊM DỮ LIỆU MẪU 
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa dữ liệu cũ (nếu có) để insert lại từ đầu cho sạch sẽ
TRUNCATE TABLE notifications;
TRUNCATE TABLE reviews;
TRUNCATE TABLE borrow_renewals;
TRUNCATE TABLE borrows;
TRUNCATE TABLE book_categories;
TRUNCATE TABLE books;
TRUNCATE TABLE publishers;
TRUNCATE TABLE authors;
TRUNCATE TABLE categories;
TRUNCATE TABLE otps;
TRUNCATE TABLE users;

-- ============================================================
-- 1. BẢNG USERS (15 Dòng - Pass chung: 123456)
-- ============================================================
INSERT INTO users (id, full_name, email, password, phone, avatar_url, role, status, login_method) VALUES
(1, 'Quản trị viên', 'admin@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0901111111', 'https://ui-avatars.com/api/?name=Admin&background=random', 'admin', 'active', 'local'),
(2, 'Thủ thư Nguyễn', 'employee@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0902222222', 'https://ui-avatars.com/api/?name=Employee&background=random', 'employee', 'active', 'local'),
(3, 'Trần Khách Hàng', 'user1@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0903333333', 'https://ui-avatars.com/api/?name=Tran+Khach&background=random', 'user', 'active', 'local'),
(4, 'Lê Độc Giả', 'user2@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0904444444', 'https://ui-avatars.com/api/?name=Le+Doc+Gia&background=random', 'user', 'active', 'local'),
(5, 'Phạm Bị Khóa', 'user3@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0905555555', 'https://ui-avatars.com/api/?name=Pham&background=random', 'user', 'banned', 'local'),
(6, 'Hoàng Minh Tuấn', 'tuanhm@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0912345678', NULL, 'user', 'active', 'local'),
(7, 'Ngô Thị Lan', 'lanngo@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0987654321', NULL, 'user', 'active', 'local'),
(8, 'Đinh Văn Hoàng', 'hoangdv@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0977123123', NULL, 'user', 'active', 'local'),
(9, 'Bùi Tấn Phát', 'phatbt@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0933456456', NULL, 'user', 'active', 'local'),
(10, 'Đoàn Thúy Vy', 'vydt@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0922789789', NULL, 'user', 'active', 'local'),
(11, 'Vũ Đức Đam', 'damvd@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0900112233', NULL, 'user', 'active', 'local'),
(12, 'Lý Tiểu Long', 'longlt@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0944555666', NULL, 'user', 'active', 'local'),
(13, 'Châu Tinh Trì', 'trichau@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0999888777', NULL, 'user', 'active', 'local'),
(14, 'Trương Vô Kỵ', 'kytv@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0988111222', NULL, 'user', 'active', 'local'),
(15, 'Triệu Mẫn', 'mantrieu@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', '0966333444', NULL, 'user', 'pending', 'local');

-- ============================================================
-- 2. BẢNG CATEGORIES (10 Dòng)
-- ============================================================
INSERT INTO categories (id, name, description) VALUES
(1, 'Công nghệ thông tin', 'Lập trình, thuật toán, trí tuệ nhân tạo, phần mềm.'),
(2, 'Văn học - Tiểu thuyết', 'Các tác phẩm văn học kinh điển, tiểu thuyết tình cảm, trinh thám.'),
(3, 'Kinh tế - Tài chính', 'Đầu tư, chứng khoán, quản trị kinh doanh, khởi nghiệp.'),
(4, 'Kỹ năng sống', 'Phát triển bản thân, giao tiếp, tư duy logic.'),
(5, 'Khoa học viễn tưởng', 'Khám phá vũ trụ, tương lai, du hành thời gian.'),
(6, 'Lịch sử - Địa lý', 'Tài liệu về các triều đại, chiến tranh, địa lý thế giới.'),
(7, 'Khoa học cơ bản', 'Toán, Lý, Hóa, Sinh học, Y học.'),
(8, 'Tâm lý học', 'Nghiên cứu hành vi, cảm xúc, tâm lý học tội phạm.'),
(9, 'Truyện tranh - Manga', 'Truyện tranh Nhật Bản, Hàn Quốc, Âu Mỹ.'),
(10, 'Ngoại ngữ', 'Giáo trình tiếng Anh, Nhật, Hàn, Trung.');

-- ============================================================
-- 3. BẢNG AUTHORS (12 Dòng)
-- ============================================================
INSERT INTO authors (id, name, bio) VALUES
(1, 'Nguyễn Nhật Ánh', 'Nhà văn Việt Nam nổi tiếng với tuổi thơ.'),
(2, 'Robert T. Kiyosaki', 'Tác giả Cha giàu cha nghèo.'),
(3, 'Robert C. Martin', 'Huyền thoại Clean Code.'),
(4, 'Paulo Coelho', 'Nhà văn Brazil, tác giả Nhà Giả Kim.'),
(5, 'Frank Herbert', 'Tiểu thuyết gia viễn tưởng vĩ đại.'),
(6, 'J.K. Rowling', 'Mẹ đẻ của Harry Potter.'),
(7, 'George R.R. Martin', 'Tác giả Trò chơi vương quyền (Game of Thrones).'),
(8, 'Haruki Murakami', 'Nhà văn đương đại Nhật Bản.'),
(9, 'Yuval Noah Harari', 'Tác giả Lược sử loài người.'),
(10, 'Dale Carnegie', 'Bậc thầy về Đắc nhân tâm.'),
(11, 'Nam Cao', 'Nhà văn hiện thực xuất sắc của Việt Nam.'),
(12, 'Keigo Higashino', 'Bậc thầy trinh thám Nhật Bản.');

-- ============================================================
-- 4. BẢNG PUBLISHERS (10 Dòng)
-- ============================================================
INSERT INTO publishers (id, name, country, website) VALUES
(1, 'NXB Trẻ', 'Việt Nam', 'nxbtre.com.vn'),
(2, 'NXB Kim Đồng', 'Việt Nam', 'nxbkimdong.com.vn'),
(3, 'O''Reilly Media', 'Mỹ', 'oreilly.com'),
(4, 'HarperCollins', 'Mỹ', 'harpercollins.com'),
(5, 'Nhã Nam', 'Việt Nam', 'nhanam.com.vn'),
(6, 'Penguin Random House', 'Anh', 'penguin.co.uk'),
(7, 'Bloomsbury', 'Anh', 'bloomsbury.com'),
(8, 'NXB Giáo Dục', 'Việt Nam', 'nxbgd.vn'),
(9, 'NXB Phụ Nữ', 'Việt Nam', 'nxbphunu.com.vn'),
(10, 'Alpha Books', 'Việt Nam', 'alphabooks.vn');

-- ============================================================
-- 5. BẢNG BOOKS (30 Dòng - QUAN TRỌNG)
-- ============================================================
INSERT INTO books (id, title, author_id, publisher_id, isbn, publish_year, description, cover_url, total_copies, available_copies) VALUES
(1, 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', 1, 1, '978-604-1-09456-1', 2008, 'Truyện dài kể về tuổi thơ của những đứa trẻ.', 'https://salt.tikicdn.com/cache/750x750/ts/product/0a/62/16/e0ceb1a93bd855b71db3a4792c3004b3.jpg', 15, 12),
(2, 'Mắt Biếc', 1, 1, '978-604-1-09456-2', 1990, 'Chuyện tình buồn của Ngạn và Hà Lan.', 'https://salt.tikicdn.com/cache/750x750/ts/product/6e/82/01/f99b24ed24285d41f0d36dbbfd29dc47.jpg', 10, 8),
(3, 'Cha Giàu Cha Nghèo', 2, 10, '978-0-446-67745-3', 1997, 'Bài học quản lý tài chính cá nhân.', 'https://salt.tikicdn.com/cache/750x750/ts/product/18/76/85/da3a97d91e1d2c65f9bf99ebdd1b8a5d.jpg', 20, 15),
(4, 'Clean Code', 3, 3, '978-0-13-235088-4', 2008, 'Sách gối đầu giường cho lập trình viên.', 'https://salt.tikicdn.com/cache/750x750/ts/product/45/3b/c0/10bd103b4d4554b29bb8894101890947.jpg', 5, 2),
(5, 'Nhà Giả Kim', 4, 5, '978-0-06-112241-5', 1988, 'Cuộc hành trình đi tìm kho báu.', 'https://salt.tikicdn.com/cache/750x750/media/catalog/product/i/m/img115_1_2.jpg', 30, 25),
(6, 'Dune - Xứ Cát', 5, 4, '978-0-441-17271-6', 1965, 'Tiểu thuyết khoa học viễn tưởng vĩ đại.', 'https://salt.tikicdn.com/cache/750x750/ts/product/cb/91/96/12a8a9bc6a4de7b43f49f3e46c98ea98.jpg', 8, 0),
(7, 'Harry Potter và Hòn Đá Phù Thủy', 6, 7, '978-0-7475-3269-7', 1997, 'Cậu bé phù thủy sống sót.', 'https://salt.tikicdn.com/cache/750x750/ts/product/78/33/c5/4043b81ebdb15a3bbec369403d58d975.jpg', 50, 40),
(8, 'Harry Potter và Phòng Chứa Bí Mật', 6, 7, '978-0-7475-3849-8', 1998, 'Năm học thứ hai tại Hogwarts.', 'https://salt.tikicdn.com/cache/750x750/ts/product/17/dc/dd/e75ee0e02c52ed5dcbb29910e53a39b2.jpg', 40, 30),
(9, 'Game of Thrones', 7, 4, '978-0-553-10354-9', 1996, 'Trò chơi vương quyền.', 'https://salt.tikicdn.com/cache/750x750/ts/product/3e/26/5d/df231416e788c3fc3889c20165c71b17.jpg', 12, 10),
(10, 'Rừng Na Uy', 8, 5, '978-4-06-203515-1', 1987, 'Tình yêu và sự cô đơn của tuổi trẻ.', 'https://salt.tikicdn.com/cache/750x750/ts/product/57/40/ea/9864da5e933e498c41ecb4c730438cf1.jpg', 15, 12),
(11, 'Sapiens: Lược Sử Loài Người', 9, 10, '978-0-06-231609-2', 2011, 'Lịch sử tiến hóa của Homo Sapiens.', 'https://salt.tikicdn.com/cache/750x750/ts/product/3d/08/bf/9cc4d1a5bf06411dd7b2b73892eb014c.jpg', 25, 20),
(12, 'Đắc Nhân Tâm', 10, 1, '978-1-4391-9919-3', 1936, 'Nghệ thuật thu phục lòng người.', 'https://salt.tikicdn.com/cache/750x750/ts/product/d9/b4/0a/dcfe5fbaad0927df4d093539bc272fdf.jpg', 40, 38),
(13, 'Chí Phèo', 11, 2, '978-604-2-12345-4', 1941, 'Kiệt tác văn học hiện thực Việt Nam.', 'https://salt.tikicdn.com/cache/750x750/ts/product/b5/06/f3/f1c2eb21a8a816e87d0309995be9ebfb.jpg', 10, 5),
(14, 'Phía Sau Nghi Can X', 12, 5, '978-4-16-772801-5', 2005, 'Tiểu thuyết trinh thám hack não.', 'https://salt.tikicdn.com/cache/750x750/ts/product/c6/35/bf/161298c61e8609553755cfde23880629.jpg', 20, 18),
(15, 'Bạch Dạ Hành', 12, 5, '978-4-08-747115-6', 1999, 'Bức tranh u ám về tội ác và tâm lý.', 'https://salt.tikicdn.com/cache/750x750/ts/product/72/72/f0/a62ef35b2e3e5bc8ee1bf407de3c6479.jpg', 15, 0),
(16, 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', 1, 1, '978-604-1-12345-7', 2010, 'Tuổi thơ đầy dữ dội và bình yên.', 'https://salt.tikicdn.com/cache/750x750/ts/product/00/22/a8/f5cdb68f3db47f128e578c2eec24f6cb.jpg', 18, 18),
(17, 'Ngồi Khóc Trên Cây', 1, 1, '978-604-1-12345-8', 2013, 'Câu chuyện tình cảm học trò.', 'https://salt.tikicdn.com/cache/750x750/ts/product/54/1b/ab/2a731ef8e604f76269145610ab52d2f8.jpg', 10, 9),
(18, 'Kính Vạn Hoa - Tập 1', 1, 2, '978-604-2-12345-9', 1995, 'Bộ truyện tuổi teen huyền thoại.', 'https://salt.tikicdn.com/cache/750x750/ts/product/d9/38/a3/b91176b66d4f64790ce7fc8dfbb9a896.jpg', 30, 25),
(19, 'Tư Duy Nhanh Và Chậm', 9, 10, '978-0-374-27563-0', 2011, 'Phân tích hệ thống tư duy não bộ.', 'https://salt.tikicdn.com/cache/750x750/ts/product/3e/16/ef/5ebdd90c641bcecefb8cde7a72688002.jpg', 22, 20),
(20, 'Lão Hạc', 11, 2, '978-604-2-12346-1', 1943, 'Truyện ngắn kinh điển.', 'https://salt.tikicdn.com/cache/750x750/media/catalog/product/b/i/bia-lao-hac.jpg', 15, 14),
(21, 'Harry Potter và Tên Tù Nhân Ngục Azkaban', 6, 7, '978-0-7475-4215-2', 1999, 'Năm thứ 3 với Sirius Black.', 'https://salt.tikicdn.com/cache/750x750/ts/product/75/eb/45/b5c928e18dbffef30d52bc0a9f029c75.jpg', 35, 30),
(22, 'Kafka Bên Bờ Biển', 8, 5, '978-4-10-100154-3', 2002, 'Hành trình trốn chạy của cậu bé 15 tuổi.', 'https://salt.tikicdn.com/cache/750x750/ts/product/99/3a/83/87d6f51f8087cf2d53086eb01e389e80.jpg', 12, 10),
(23, '1Q84 - Tập 1', 8, 5, '978-4-10-353422-4', 2009, 'Thế giới song song kỳ ảo.', 'https://salt.tikicdn.com/cache/750x750/media/catalog/product/1/q/1q84-t1-bia.jpg', 10, 8),
(24, 'Điều Ý Nghĩa Nhất Của Cuộc Sống', 4, 1, '978-604-1-12346-5', 2006, 'Những suy ngẫm sâu sắc.', 'https://salt.tikicdn.com/cache/750x750/ts/product/e5/22/e0/7dc918d35f79a9ccf781ce7d022b7245.jpg', 10, 10),
(25, 'Design Patterns: Elements of Reusable', 3, 3, '978-0-201-63361-6', 1994, 'Khuôn mẫu thiết kế phần mềm.', 'https://salt.tikicdn.com/cache/750x750/ts/product/f4/fc/ea/bc47dfcf1d5a7fb48b0a9ad3a778ef1b.jpg', 8, 5),
(26, 'Sự Im Lặng Của Bầy Cừu', 12, 5, '978-0-312-02282-7', 1988, 'Trinh thám rùng rợn.', 'https://salt.tikicdn.com/cache/750x750/ts/product/14/08/94/a5a92d40905a5fc58c7dd7dbec9a16f6.jpg', 14, 10),
(27, 'Tâm Lý Học Tội Phạm', 12, 5, '978-604-1-12346-8', 2018, 'Phân tích tâm lý học.', 'https://salt.tikicdn.com/cache/750x750/ts/product/64/09/bd/2c4dcfc9a3a7edda7ab77c1d11ff2ab0.jpg', 20, 15),
(28, 'Tiếng Gọi Của Hoang Dã', 5, 2, '978-604-2-12346-9', 1903, 'Câu chuyện về chú chó Buck.', 'https://salt.tikicdn.com/cache/750x750/ts/product/ed/5c/4b/32f4118f6733230b064c1ce7bb400262.jpg', 25, 20),
(29, 'Ông Già Và Biển Cả', 5, 1, '978-604-1-12347-0', 1952, 'Cuộc chiến với con cá kiếm.', 'https://salt.tikicdn.com/cache/750x750/ts/product/c0/77/5f/85374e2d422ebc244c414777558ec434.jpg', 30, 28),
(30, 'Bí Mật Tư Duy Triệu Phú', 2, 10, '978-0-06-073405-1', 2005, 'Tư duy làm giàu.', 'https://salt.tikicdn.com/cache/750x750/ts/product/eb/14/b8/0268ec3b7b9edfa3f92dcc239f61b7f8.jpg', 40, 35);

-- ============================================================
-- 6. BẢNG BOOK_CATEGORIES (40 Dòng)
-- ============================================================
INSERT INTO book_categories (book_id, category_id) VALUES
(1, 2), (2, 2), (3, 3), (3, 4), (4, 1), (5, 2), (5, 4), (6, 5),
(7, 2), (7, 5), (8, 2), (8, 5), (9, 2), (9, 5), (10, 2), (10, 8),
(11, 6), (11, 7), (12, 4), (12, 8), (13, 2), (13, 6), (14, 2), (14, 8),
(15, 2), (15, 8), (16, 2), (17, 2), (18, 2), (18, 9), (19, 4), (19, 8),
(20, 2), (21, 2), (21, 5), (22, 2), (22, 8), (23, 2), (24, 4), (25, 1),
(26, 2), (26, 8), (27, 8), (28, 2), (29, 2), (30, 3), (30, 4);

-- ============================================================
-- 7. BẢNG BORROWS (40 Dòng - QUAN TRỌNG NHẤT)
-- Mô phỏng đầy đủ trạng thái: pending, borrowing, returned, overdue, renewed, lost
-- ============================================================
INSERT INTO borrows (id, user_id, book_id, handled_by, borrow_date, due_date, return_date, status, fine_amount, fine_paid, note) VALUES
(1, 3, 1, 2, DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 9 DAY), NULL, 'borrowing', 0, 0, 'Sách mới nguyên'),
(2, 4, 4, 2, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 12 DAY), NULL, 'borrowing', 0, 0, NULL),
(3, 6, 8, 2, DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 4 DAY), NULL, 'borrowing', 0, 0, NULL),
(4, 7, 2, 2, DATE_SUB(CURRENT_DATE, INTERVAL 20 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 8 DAY), 'returned', 0, 0, 'Trả sớm'),
(5, 8, 6, 2, DATE_SUB(CURRENT_DATE, INTERVAL 25 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 11 DAY), NULL, 'overdue', 55000, 0, 'Quá hạn 11 ngày'),
(6, 9, 7, 2, DATE_SUB(CURRENT_DATE, INTERVAL 15 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 13 DAY), NULL, 'renewed', 0, 0, 'Đã gia hạn lần 1'),
(7, 10, 11, 2, DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 16 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), 'returned', 30000, 1, 'Trễ hạn nhưng đã đóng phạt'),
(8, 11, 15, NULL, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), NULL, 'pending', 0, 0, 'Chờ admin duyệt'),
(9, 12, 21, 2, DATE_SUB(CURRENT_DATE, INTERVAL 50 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 36 DAY), NULL, 'lost', 150000, 0, 'Báo mất sách'),
(10, 13, 25, 2, DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 11 DAY), NULL, 'borrowing', 0, 0, NULL),
(11, 14, 30, NULL, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), NULL, 'cancelled', 0, 0, 'User tự hủy yêu cầu'),
(12, 3, 3, 2, DATE_SUB(CURRENT_DATE, INTERVAL 40 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 26 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 28 DAY), 'returned', 0, 0, ''),
(13, 4, 5, 2, DATE_SUB(CURRENT_DATE, INTERVAL 8 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY), NULL, 'borrowing', 0, 0, ''),
(14, 6, 9, 2, DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY), CURRENT_DATE, NULL, 'renewed', 0, 0, 'Gia hạn hôm nay'),
(15, 7, 10, 2, DATE_SUB(CURRENT_DATE, INTERVAL 18 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY), NULL, 'overdue', 20000, 0, 'Chưa thấy trả'),
(16, 8, 12, 2, DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 9 DAY), NULL, 'borrowing', 0, 0, ''),
(17, 9, 13, 2, DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 46 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 45 DAY), 'returned', 5000, 1, 'Trễ 1 ngày'),
(18, 10, 14, NULL, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 13 DAY), NULL, 'pending', 0, 0, ''),
(19, 11, 16, 2, DATE_SUB(CURRENT_DATE, INTERVAL 12 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), NULL, 'borrowing', 0, 0, ''),
(20, 12, 17, 2, DATE_SUB(CURRENT_DATE, INTERVAL 22 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 8 DAY), NULL, 'overdue', 40000, 0, ''),
(21, 13, 18, 2, DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 4 DAY), NULL, 'borrowing', 0, 0, ''),
(22, 14, 19, 2, DATE_SUB(CURRENT_DATE, INTERVAL 15 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), 'returned', 0, 0, ''),
(23, 3, 20, 2, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 13 DAY), NULL, 'borrowing', 0, 0, ''),
(24, 4, 22, 2, DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 16 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 20 DAY), 'returned', 0, 0, ''),
(25, 6, 23, 2, DATE_SUB(CURRENT_DATE, INTERVAL 28 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY), NULL, 'overdue', 70000, 0, ''),
(26, 7, 24, 2, DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), NULL, 'renewed', 0, 0, ''),
(27, 8, 26, 2, DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), NULL, 'borrowing', 0, 0, ''),
(28, 9, 27, 2, DATE_SUB(CURRENT_DATE, INTERVAL 45 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 31 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 31 DAY), 'returned', 0, 0, ''),
(29, 10, 28, 2, DATE_SUB(CURRENT_DATE, INTERVAL 20 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY), NULL, 'overdue', 30000, 0, ''),
(30, 11, 29, 2, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 12 DAY), NULL, 'borrowing', 0, 0, ''),
(31, 12, 1, 2, DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 46 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 46 DAY), 'returned', 0, 0, ''),
(32, 13, 2, 2, DATE_SUB(CURRENT_DATE, INTERVAL 16 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), NULL, 'overdue', 10000, 0, ''),
(33, 14, 3, 2, DATE_SUB(CURRENT_DATE, INTERVAL 8 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY), NULL, 'borrowing', 0, 0, ''),
(34, 3, 4, NULL, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), NULL, 'pending', 0, 0, ''),
(35, 4, 5, 2, DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 76 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 70 DAY), 'returned', 30000, 1, ''),
(36, 6, 6, 2, DATE_SUB(CURRENT_DATE, INTERVAL 11 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), NULL, 'borrowing', 0, 0, ''),
(37, 7, 7, 2, DATE_SUB(CURRENT_DATE, INTERVAL 25 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 11 DAY), NULL, 'overdue', 55000, 0, ''),
(38, 8, 8, 2, DATE_SUB(CURRENT_DATE, INTERVAL 15 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 13 DAY), NULL, 'renewed', 0, 0, ''),
(39, 9, 9, 2, DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 9 DAY), NULL, 'borrowing', 0, 0, ''),
(40, 10, 10, 2, DATE_SUB(CURRENT_DATE, INTERVAL 100 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 86 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 86 DAY), 'returned', 0, 0, '');

-- ============================================================
-- 8. BẢNG BORROW_RENEWALS (10 Dòng)
-- ============================================================
INSERT INTO borrow_renewals (borrow_id, renewed_by, old_due_date, new_due_date, renewed_at) VALUES
(6, 2, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 13 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY)),
(14, 2, DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY), CURRENT_DATE, DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY)),
(26, 2, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), CURRENT_DATE),
(38, 2, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 13 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY));

-- ============================================================
-- 9. BẢNG REVIEWS (35 Dòng)
-- ============================================================
INSERT INTO reviews (user_id, book_id, rating, comment, is_visible) VALUES
(3, 1, 5, 'Sách quá hay, làm tôi nhớ lại tuổi thơ dữ dội của mình.', 1),
(4, 1, 4, 'Giọng văn bác Ánh lúc nào cũng nhẹ nhàng, mộc mạc.', 1),
(6, 1, 5, 'Khóc hết nước mắt vì nhớ nhà.', 1),
(7, 2, 5, 'Mối tình Ngạn và Hà Lan quá xót xa.', 1),
(8, 2, 3, 'Hơi buồn, không hợp với người đang thất tình.', 1),
(3, 4, 5, 'Best book for Software Engineers! Phải đọc đi đọc lại nhiều lần.', 1),
(4, 4, 4, 'Hơi khó hiểu với người mới nhưng vô cùng hữu ích.', 1),
(9, 4, 5, 'Cuốn sách làm thay đổi tư duy code của tôi.', 1),
(3, 5, 5, 'Khi bạn khao khát một điều gì đó, cả vũ trụ sẽ hợp lực giúp bạn đạt được.', 1),
(10, 5, 4, 'Sách hay, triết lý nhẹ nhàng sâu sắc.', 1),
(11, 5, 5, 'Đọc xong có thêm rất nhiều động lực sống.', 1),
(4, 6, 5, 'Đọc xong phần 1 phải đi cày ngay phim chiếu rạp. Thế giới Dune quá đồ sộ.', 1),
(12, 6, 4, 'Hơi kén người đọc vì bối cảnh phức tạp.', 1),
(13, 7, 5, 'Huyền thoại tuổi thơ, đọc đi đọc lại 10 lần vẫn hay.', 1),
(14, 7, 5, 'Bản dịch tiếng Việt của chị Lý Lan là tuyệt vời nhất.', 1),
(3, 3, 3, 'Sách mang tính chất truyền động lực nhiều hơn là hướng dẫn chi tiết.', 1),
(4, 3, 4, 'Thay đổi tư duy về tài sản và tiêu sản.', 1),
(8, 11, 5, 'Góc nhìn lịch sử dưới con mắt của khoa học rất thú vị.', 1),
(9, 11, 5, 'Sách khá dày nhưng đọc không dứt ra được.', 1),
(10, 12, 4, 'Nghệ thuật giao tiếp thực dụng và hiệu quả.', 1),
(11, 12, 5, 'Sách self-help duy nhất tôi thấy thực sự có ích.', 1),
(12, 13, 5, 'Văn phong Nam Cao lúc nào cũng sắc sảo, chua xót.', 1),
(13, 14, 5, 'Plot twist vặn não, kết cục vô cùng bất ngờ.', 1),
(14, 14, 5, 'Thực sự khâm phục bộ não của tác giả.', 1),
(3, 15, 5, 'Quá u ám, ám ảnh đến mức mất ngủ.', 1),
(4, 16, 4, 'Nhẹ nhàng, thư giãn.', 1),
(6, 18, 5, 'Ký ức ùa về với bộ ba Quý Ròm, Tiểu Long, Hạnh.', 1),
(7, 19, 4, 'Sách học thuật tâm lý hơi khó đọc nhưng giá trị.', 1),
(8, 25, 5, 'Design Pattern kinh điển, lập trình viên OOP phải biết.', 1),
(9, 26, 5, 'Rợn tóc gáy, bác sĩ Lecter xây dựng quá đỉnh.', 1),
(10, 27, 4, 'Giúp hiểu rõ hành vi tâm lý tội phạm.', 1),
(11, 28, 5, 'Tiếng Gọi Hoang Dã luôn làm tôi xúc động.', 1),
(12, 29, 4, 'Con người có thể bị hủy diệt nhưng không thể bị đánh bại.', 1),
(13, 30, 4, 'Những tư duy khác biệt của người giàu.', 1),
(14, 1, 5, 'Sách rất đáng mua.', 1);

-- ============================================================
-- 10. BẢNG NOTIFICATIONS (15 Dòng)
-- ============================================================
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(3, 'Sắp đến hạn trả sách', 'Cuốn sách "Cho Tôi Xin Một Vé Đi Tuổi Thơ" của bạn sắp đến hạn trả.', 'warning', 0),
(4, 'Mượn sách thành công', 'Bạn đã mượn thành công cuốn "Clean Code". Hạn trả là 14 ngày tới.', 'success', 1),
(6, 'Sách bị quá hạn', 'Cuốn "Rừng Na Uy" đã quá hạn 14 ngày. Vui lòng thanh toán phí phạt.', 'error', 0),
(7, 'Yêu cầu gia hạn thành công', 'Yêu cầu gia hạn cuốn "Điều Ý Nghĩa Nhất Của Cuộc Sống" đã được duyệt.', 'info', 1),
(8, 'Nhắc nhở trả sách', 'Cuốn "Dune - Xứ Cát" đã quá hạn, hệ thống tính phí phạt 5.000đ/ngày.', 'error', 0),
(9, 'Trả sách thành công', 'Cảm ơn bạn đã trả cuốn "Tâm Lý Học Tội Phạm".', 'success', 1),
(10, 'Thông báo từ thủ thư', 'Bạn cần mang sách "Lão Hạc" đến thư viện để kiểm tra tình trạng rách trang.', 'warning', 0),
(11, 'Đăng ký tài khoản thành công', 'Chào mừng bạn đến với Thư viện điện tử!', 'success', 1),
(12, 'Sách bị báo mất', 'Bạn đã báo mất sách "Harry Potter 3". Vui lòng đến thư viện để đền bù.', 'error', 0),
(13, 'Yêu cầu đang chờ duyệt', 'Yêu cầu mượn "Mắt Biếc" của bạn đang được thủ thư xử lý.', 'info', 1),
(14, 'Đơn mượn bị hủy', 'Yêu cầu mượn "Bí Mật Tư Duy Triệu Phú" đã bị hủy.', 'info', 1),
(3, 'Mượn sách thành công', 'Cuốn "Lão Hạc" đã được thêm vào tủ sách mượn của bạn.', 'success', 1),
(4, 'Mã giảm giá phí phạt', 'Thư viện tặng bạn voucher miễn 100% phí phạt trong tháng này!', 'info', 0),
(6, 'Thông báo bảo trì', 'Hệ thống thư viện sẽ bảo trì vào lúc 0:00 ngày mai.', 'warning', 1),
(7, 'Yêu cầu gia hạn thất bại', 'Cuốn "Mắt Biếc" đã có người khác đặt trước nên không thể gia hạn thêm.', 'error', 0);

SET FOREIGN_KEY_CHECKS = 1;