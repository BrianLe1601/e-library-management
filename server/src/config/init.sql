CREATE DATABASE IF NOT EXISTS e_library
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE e_library;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    full_name   VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,                  -- bcrypt hash
    phone       VARCHAR(20)     DEFAULT NULL,
    avatar_url  VARCHAR(500)    DEFAULT NULL,
    role        ENUM('user','employee','admin') NOT NULL DEFAULT 'user',
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. CATEGORIES  (thể loại sách)
-- ============================================================
CREATE TABLE categories (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    description TEXT            DEFAULT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. AUTHORS  (tác giả)
-- ============================================================
CREATE TABLE authors (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL,
    bio         TEXT            DEFAULT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. PUBLISHERS  (nhà xuất bản)
-- ============================================================
CREATE TABLE publishers (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL UNIQUE,
    country     VARCHAR(100)    DEFAULT NULL,
    website     VARCHAR(255)    DEFAULT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. BOOKS
-- ============================================================
CREATE TABLE books (
    id               INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(255)    NOT NULL,
    author_id        INT UNSIGNED    NOT NULL,
    publisher_id     INT UNSIGNED    DEFAULT NULL,
    isbn             VARCHAR(20)     DEFAULT NULL UNIQUE,
    publish_year     INT            DEFAULT NULL,
    description      TEXT            DEFAULT NULL,
    cover_url        VARCHAR(500)    DEFAULT NULL,
    total_copies     INT UNSIGNED    NOT NULL DEFAULT 1,
    available_copies INT UNSIGNED    NOT NULL DEFAULT 1,
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_book_author    FOREIGN KEY (author_id)    REFERENCES authors(id)    ON DELETE RESTRICT,
    CONSTRAINT fk_book_publisher FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE SET NULL
);

-- ============================================================
-- 6. BOOK_CATEGORIES  (sách <-> thể loại  nhiều-nhiều)
-- ============================================================
CREATE TABLE book_categories (
    book_id     INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (book_id, category_id),
    CONSTRAINT fk_bc_book     FOREIGN KEY (book_id)     REFERENCES books(id)      ON DELETE CASCADE,
    CONSTRAINT fk_bc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. BORROWS  (phiếu mượn)
-- ============================================================
CREATE TABLE borrows (
    id              INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED     NOT NULL,
    book_id         INT UNSIGNED     NOT NULL,
    handled_by      INT UNSIGNED     DEFAULT NULL,          -- employee xử lý (nullable)
    borrow_date     DATE             NOT NULL DEFAULT (CURRENT_DATE),
    due_date        DATE             NOT NULL,
    return_date     DATE             DEFAULT NULL,           -- NULL = chua tra
    renewed_count   TINYINT UNSIGNED NOT NULL DEFAULT 0,
    status          ENUM('borrowing','returned','overdue','renewed','cancelled','lost')
                                 NOT NULL DEFAULT 'borrowing',
    fine_amount     INT UNSIGNED NOT NULL DEFAULT 0,
    fine_paid       TINYINT(1)       NOT NULL DEFAULT 0,
    note            TEXT             DEFAULT NULL,
    created_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_borrow_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_borrow_book    FOREIGN KEY (book_id)    REFERENCES books(id) ON DELETE RESTRICT,
    CONSTRAINT fk_borrow_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 8. BORROW_RENEWALS  (lịch sử gia hạn)
-- ============================================================
CREATE TABLE borrow_renewals (
    id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    borrow_id       INT UNSIGNED    NOT NULL,
    renewed_by      INT UNSIGNED    DEFAULT NULL,           -- user tu gia han hoac employee ho tro
    old_due_date    DATE            NOT NULL,
    new_due_date    DATE            NOT NULL,
    renewed_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_renewal_borrow  FOREIGN KEY (borrow_id) REFERENCES borrows(id) ON DELETE CASCADE,
    CONSTRAINT fk_renewal_handler FOREIGN KEY (renewed_by) REFERENCES users(id)  ON DELETE SET NULL
);

-- ============================================================
-- 9. REVIEWS  (đánh giá + bình luận)
-- ============================================================
CREATE TABLE reviews (
    id          INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED     NOT NULL,
    book_id     INT UNSIGNED     NOT NULL,
    rating      TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT             DEFAULT NULL,
    is_visible  TINYINT(1)       NOT NULL DEFAULT 1,        -- admin/employee co the an
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_book (user_id, book_id),
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
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
-- SAMPLE DATA  (10 records moi bang)
-- ============================================================

-- ── 1. users (1 admin, 2 employee, 7 user) ──────────────────
-- Mat khau mau: Password@123
-- Hash that: bcrypt.hashSync('Password@123', 10)
INSERT INTO users (full_name, email, password, phone, role) VALUES
    ('Administrator',    'admin@elibrary.com',     '$2b$10$REPLACE_HASH', '0900000001', 'admin'),
    ('Nguyen Thi Lan',   'lan.nv@elibrary.com',    '$2b$10$REPLACE_HASH', '0900000002', 'employee'),
    ('Tran Minh Duc',    'duc.tm@elibrary.com',    '$2b$10$REPLACE_HASH', '0900000003', 'employee'),
    ('Le Thi Hoa',       'hoa.lt@gmail.com',       '$2b$10$REPLACE_HASH', '0901111001', 'user'),
    ('Pham Quoc Thang',  'thang.pq@gmail.com',     '$2b$10$REPLACE_HASH', '0901111002', 'user'),
    ('Nguyen Van Binh',  'binh.nv@gmail.com',      '$2b$10$REPLACE_HASH', '0901111003', 'user'),
    ('Tran Thi Mai',     'mai.tt@gmail.com',       '$2b$10$REPLACE_HASH', '0901111004', 'user'),
    ('Hoang Duc Long',   'long.hd@gmail.com',      '$2b$10$REPLACE_HASH', '0901111005', 'user'),
    ('Vo Thi Kim Ngan',  'ngan.vtk@gmail.com',     '$2b$10$REPLACE_HASH', '0901111006', 'user'),
    ('Do Manh Hung',     'hung.dm@gmail.com',      '$2b$10$REPLACE_HASH', '0901111007', 'user');

-- ── 2. categories ────────────────────────────────────────────
INSERT INTO categories (name, description) VALUES
    ('Van hoc',              'Tieu thuyet, truyen ngan, tho ca trong va ngoai nuoc'),
    ('Khoa hoc - Tu nhien',  'Vat ly, hoa hoc, sinh hoc, thien van hoc'),
    ('Lich su - Dia ly',     'Lich su Viet Nam, the gioi va dia ly'),
    ('Ky thuat - Cong nghe', 'Lap trinh, ky thuat, cong nghe thong tin'),
    ('Kinh te - Quan tri',   'Kinh te hoc, quan tri kinh doanh, tai chinh'),
    ('Tam ly - Ky nang song','Phat trien ban than, ky nang mem, tam ly hoc'),
    ('Thieu nhi',            'Sach danh cho tre em va thanh thieu nien'),
    ('Triet hoc - Ton giao', 'Triet hoc Dong Tay, ton giao, nhan sinh quan'),
    ('Y hoc - Suc khoe',     'Sach y khoa, dinh duong, cham soc suc khoe'),
    ('Ngon ngu - Giao duc',  'Hoc ngoai ngu, phuong phap giao duc');

-- ── 3. authors ───────────────────────────────────────────────
INSERT INTO authors (name, bio) VALUES
    ('Nam Cao',        'Nha van hien thuc xuat sac cua Van hoc Viet Nam hien dai'),
    ('Nguyen Du',      'Dai thi hao dan toc, tac gia Truyen Kieu bat hu'),
    ('To Hoai',        'Nha van Viet Nam voi nhieu tac pham noi tieng cho thieu nhi'),
    ('Jules Verne',    'Nha van Phap, cha de cua the loai khoa hoc vien tuong hien dai'),
    ('Dale Carnegie',  'Tac gia nguoi My, chuyen gia ve ky nang giao tiep va lanh dao'),
    ('Stephen Hawking','Nha vat ly ly thuyet nguoi Anh, tac gia A Brief History of Time'),
    ('Nguyen Nhat Anh','Nha van Viet Nam noi tieng voi nhieu tac pham ve tuoi tho'),
    ('Haruki Murakami','Nha van Nhat Ban noi tieng the gioi'),
    ('George Orwell',  'Nha van nguoi Anh, tac gia 1984 va Animal Farm'),
    ('Paulo Coelho',   'Nha van Brazil, tac gia The Alchemist');

-- ── 4. publishers ────────────────────────────────────────────
INSERT INTO publishers (name, country, website) VALUES
    ('NXB Van hoc',          'Viet Nam', 'https://nxbvanhoc.com.vn'),
    ('NXB Giao duc Viet Nam','Viet Nam', 'https://nxbgd.vn'),
    ('NXB Kim Dong',         'Viet Nam', 'https://nxbkimdong.com.vn'),
    ('NXB Tong hop TP.HCM',  'Viet Nam', 'https://nxbhcm.com.vn'),
    ('NXB Tre',              'Viet Nam', 'https://nxbtre.com.vn'),
    ('NXB Chinh tri QG',     'Viet Nam', NULL),
    ('NXB Khoa hoc KT',      'Viet Nam', NULL),
    ('Penguin Books',        'Anh',      'https://www.penguin.co.uk'),
    ('Oxford University',    'Anh',      'https://global.oup.com'),
    ('HarperCollins',        'My',       'https://www.harpercollins.com');

-- ── 5. books ─────────────────────────────────────────────────
INSERT INTO books (title, author_id, publisher_id, isbn, publish_year, description, total_copies, available_copies) VALUES
    ('Chi Pheo',                  1,  1, '9786041182714', 1941, 'Truyen ngan kinh dien cua Nam Cao ve nguoi nong dan bi tha hoa',          5, 4),
    ('Truyen Kieu',               2,  2, '9786041000001', 1820, 'Tac pham tho Nom vi dai nhat cua van hoc co dien Viet Nam',               3, 3),
    ('De Men Phieu Luu Ky',       3,  3, '9786041000010', 1941, 'Cuoc phieu luu cua chu De Men dung cam trong the gioi con trung',         6, 6),
    ('Hai Van Dam Duoi Bien',     4,  8, '9786041000002', 1870, 'Hanh trinh ky bi duoi long dai duong cua thuyen truong Nemo',            4, 3),
    ('Dac Nhan Tam',              5,  4, '9786041000003', 1936, 'Cuon sach ky nang giao tiep ban chay nhat moi thoi dai',                  6, 5),
    ('Lich Su Thoi Gian',         6,  8, '9786041000004', 1988, 'Giai thich vu tru tu Big Bang den lo den cho ban doc pho thong',         4, 4),
    ('Mat Biec',                  7,  5, '9786041000005', 1990, 'Cau chuyen tinh yeu trong sang va day xu cam cua Nguyen Nhat Anh',       5, 3),
    ('Rung Na Uy',                8,  4, '9786041000006', 1987, 'Tieu thuyet cua Murakami ve tinh yeu mat mat va truong thanh',           3, 3),
    ('1984',                      9,  8, '9786041000007', 1949, 'Tac pham kinh dien canh bao ve che do doc tai toan tri',                 4, 2),
    ('Nha Gia Kim',               10, 4, '9786041000008', 1988, 'Hanh trinh tim kiem huyen thoai va y nghia cuoc doi cua chiec Santiago', 5, 5);

-- ── 6. book_categories ───────────────────────────────────────
INSERT INTO book_categories (book_id, category_id) VALUES
    (1, 1),   -- Chi Pheo          -> Van hoc
    (2, 1),   -- Truyen Kieu       -> Van hoc
    (3, 7),   -- De Men            -> Thieu nhi
    (3, 1),   -- De Men            -> Van hoc
    (4, 2),   -- Hai Van Dam       -> Khoa hoc - Tu nhien
    (4, 1),   -- Hai Van Dam       -> Van hoc
    (5, 6),   -- Dac Nhan Tam      -> Tam ly - Ky nang song
    (5, 5),   -- Dac Nhan Tam      -> Kinh te - Quan tri
    (6, 2),   -- Lich Su Thoi Gian -> Khoa hoc - Tu nhien
    (7, 1),   -- Mat Biec          -> Van hoc
    (8, 1),   -- Rung Na Uy        -> Van hoc
    (9, 1),   -- 1984              -> Van hoc
    (9, 8),   -- 1984              -> Triet hoc - Ton giao
    (10, 1),  -- Nha Gia Kim       -> Van hoc
    (10, 6);  -- Nha Gia Kim       -> Tam ly - Ky nang song

-- ── 7. borrows ───────────────────────────────────────────────
-- user_id 4-10 la cac user thuong (id 4=Hoa, 5=Thang, 6=Binh, 7=Mai, 8=Long, 9=Ngan, 10=Hung)
-- handled_by 2=Lan(employee), 3=Duc(employee)
INSERT INTO borrows (user_id, book_id, handled_by, borrow_date, due_date, return_date, renewed_count, status, fine_amount, fine_paid) VALUES
    (4,  1,  2, '2025-04-01', '2025-04-15', '2025-04-14', 0, 'returned',  0, 0),
    (5,  2,  2, '2025-04-05', '2025-04-19', '2025-04-20', 0, 'returned',  1000, 1),
    (6,  3,  3, '2025-04-10', '2025-04-24', NULL,         1, 'renewed',   0, 0),
    (7,  4,  2, '2025-04-12', '2025-04-26', NULL,         0, 'borrowing', 0, 0),
    (8,  5,  3, '2025-03-20', '2025-04-03', '2025-04-10', 0, 'returned',  7000, 1),
    (9,  6,  2, '2025-03-15', '2025-03-29', NULL,         0, 'overdue',   12000, 0),
    (10, 7,  3, '2025-04-15', '2025-04-29', NULL,         0, 'borrowing', 0, 0),
    (4,  8,  2, '2025-04-18', '2025-05-02', NULL,         0, 'borrowing', 0, 0),
    (5,  9,  3, '2025-04-02', '2025-04-16', '2025-04-16', 0, 'returned',  0, 0),
    (6, 10,  2, '2025-04-20', '2025-05-04', NULL,         0, 'borrowing', 0, 0);

-- ── 8. borrow_renewals ───────────────────────────────────────
-- Chi borrow_id=3 (Binh muon De Men) da gia han 1 lan
-- renewed_by: user tu gia han (6=Binh) hoac employee (2=Lan)
INSERT INTO borrow_renewals (borrow_id, renewed_by, old_due_date, new_due_date) VALUES
    (3,  6,  '2025-04-24', '2025-05-08'),
    (5,  8,  '2025-04-03', '2025-04-17'),
    (1,  4,  '2025-04-15', '2025-04-22'),
    (9,  5,  '2025-04-16', '2025-04-23'),
    (7,  10, '2025-04-29', '2025-05-06'),
    (2,  5,  '2025-04-19', '2025-04-26'),
    (4,  7,  '2025-04-26', '2025-05-03'),
    (8,  4,  '2025-05-02', '2025-05-09'),
    (6,  9,  '2025-03-29', '2025-04-05'),
    (10, 6,  '2025-05-04', '2025-05-11');

-- ── 9. reviews ───────────────────────────────────────────────
-- Chi user da tung muon sach moi duoc review (validate o backend)
INSERT INTO reviews (user_id, book_id, rating, comment) VALUES
    (4,  1, 5, 'Tac pham xuc dong, phan anh ro net xa hoi cu'),
    (5,  2, 5, 'Ngon ngu dep, y nghia sau sac, xung dang la quoc thi'),
    (6,  3, 4, 'Cau chuyen thu vi, phu hop cho ca tre em lan nguoi lon'),
    (7,  4, 5, 'Cuon hut tu dau den cuoi, tri tuong tuong cua Verne that phi thuong'),
    (8,  5, 5, 'Cuon sach thay doi cach minh giao tiep voi moi nguoi'),
    (9,  6, 4, 'Kho hieu o mot so chuong nhung rat mo rong tam nhin'),
    (10, 7, 5, 'Nguyen Nhat Anh viet rat cam xuc, doc ma nho mai tuoi tho'),
    (4,  8, 4, 'Van phong Murakami doc dao, cau chuyen buon ma dep'),
    (5,  9, 5, 'Canh bao dang so nhung rat can thiet, sach phai doc truoc 30 tuoi'),
    (6, 10, 4, 'Triet ly nhan sinh sau sac, du ngan nhung day y nghia');