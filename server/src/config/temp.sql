
-- ============================================================
-- THÔNG BÁO HỆ THỐNG MỚI — Tách 2 luồng rõ ràng
-- Chạy sau init.sql, DROP bảng notifications cũ trước
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS system_alerts;
DROP TABLE IF EXISTS admin_alert_reads;
DROP TABLE IF EXISTS announcements;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- BẢNG 1: system_alerts
-- Lưu các sự kiện hệ thống (mượn sách, quá hạn, đăng ký mới...)
-- 1 sự kiện = 1 row duy nhất — tất cả admin/employee đều thấy
-- KHÔNG tạo 1 row per admin → tránh spam
-- ============================================================
CREATE TABLE system_alerts (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type         ENUM(
                   'new_borrow',        -- Người dùng tạo yêu cầu mượn sách
                   'overdue',           -- Sách quá hạn chưa trả
                   'renewal_request',   -- Yêu cầu gia hạn
                   'new_registration',  -- Tài khoản mới chờ duyệt
                   'book_returned',     -- Người dùng trả sách
                   'system'             -- Cảnh báo hệ thống tự động
                 ) NOT NULL,
    title        VARCHAR(255) NOT NULL,
    message      TEXT NOT NULL,
    -- Liên kết đến đối tượng liên quan (để bấm vào nhảy đúng trang)
    ref_type     ENUM('borrow', 'user', 'book') DEFAULT NULL,
    ref_id       INT UNSIGNED DEFAULT NULL,
    -- Link điều hướng khi admin bấm vào
    action_url   VARCHAR(255) DEFAULT NULL,  -- vd: /admin/borrowing?id=12
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- BẢNG 2: admin_alert_reads
-- Theo dõi admin/employee nào đã đọc alert nào
-- Tách riêng để: 1 alert có thể "chưa đọc" với admin A nhưng "đã đọc" với admin B
-- ============================================================
CREATE TABLE admin_alert_reads (
    alert_id     INT UNSIGNED NOT NULL,
    admin_id     INT UNSIGNED NOT NULL,
    read_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (alert_id, admin_id),
    CONSTRAINT fk_read_alert FOREIGN KEY (alert_id) REFERENCES system_alerts(id) ON DELETE CASCADE,
    CONSTRAINT fk_read_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- BẢNG 3: notifications
-- Thông báo CÁ NHÂN gửi đến từng user (giữ nguyên logic cũ, mở rộng thêm)
-- Bao gồm cả thông báo admin broadcast xuống user
-- ============================================================
CREATE TABLE notifications (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,          -- Người nhận
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    type            ENUM('info','warning','success','error') DEFAULT 'info',
    -- Liên kết đến đối tượng (để bấm vào xem chi tiết)
    ref_type        ENUM('borrow','book','announcement') DEFAULT NULL,
    ref_id          INT UNSIGNED DEFAULT NULL,
    is_read         TINYINT(1) NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- BẢNG 4: announcements
-- Admin tạo thông báo broadcast — lưu nội dung 1 lần duy nhất
-- KHÔNG INSERT 1 row per user → dùng audience để lọc khi query
-- ============================================================
CREATE TABLE announcements (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_by  INT UNSIGNED NOT NULL,
    title       VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL,
    audience    ENUM('all', 'student', 'faculty') NOT NULL DEFAULT 'all',
    -- Nếu cần gửi đến 1 user cụ thể thì dùng target_user_id
    target_user_id INT UNSIGNED DEFAULT NULL,
    published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ann_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ann_target  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_alerts_type       ON system_alerts(type);
CREATE INDEX idx_alerts_created    ON system_alerts(created_at DESC);
CREATE INDEX idx_alerts_ref        ON system_alerts(ref_type, ref_id);
CREATE INDEX idx_notif_user        ON notifications(user_id);
CREATE INDEX idx_notif_read        ON notifications(user_id, is_read);
CREATE INDEX idx_ann_audience      ON announcements(audience);
CREATE INDEX idx_ann_published     ON announcements(published_at DESC);

-- ============================================================
-- DATA MẪU
-- ============================================================
INSERT INTO system_alerts (type, title, message, ref_type, ref_id, action_url) VALUES
('new_borrow',       'Yêu cầu mượn sách mới',         'Người dùng A vừa yêu cầu mượn "Mắt Biếc".',         'borrow', 1, '/admin/borrowing'),
('overdue',          'Sách quá hạn chưa trả',          '"Dế Mèn" của Người dùng C đã quá hạn 12 ngày.',     'borrow', 3, '/admin/borrowing'),
('renewal_request',  'Yêu cầu gia hạn',                'Người dùng B xin gia hạn "Rừng Na Uy" thêm 7 ngày.','borrow', 5, '/admin/borrowing'),
('new_registration', 'Tài khoản mới chờ duyệt',        'user_new@gmail.com vừa đăng ký tài khoản.',         'user',   NULL, '/admin/users'),
('system',           'Backup hệ thống hoàn tất',        'Backup tự động lúc 02:00 AM đã thành công.',        NULL,     NULL, NULL);

INSERT INTO notifications (user_id, title, message, type, ref_type, ref_id) VALUES
(4, 'Yêu cầu mượn sách đã được duyệt', 'Yêu cầu mượn "Mắt Biếc" của bạn đã được xử lý. Đến thư viện để nhận sách.', 'success', 'borrow', 1),
(5, 'Nhắc nhở: Sách sắp đến hạn',      '"Rừng Na Uy" sẽ đến hạn trả vào ngày 26/05. Vui lòng trả đúng hạn.',        'warning', 'borrow', 5),
(6, 'Sách của bạn đã quá hạn',         '"Dế Mèn" đã quá hạn 12 ngày. Phí phạt đang tích lũy.',                      'error',   'borrow', 3);

INSERT INTO announcements (created_by, title, body, audience) VALUES
(1, 'Giờ mở cửa mùa thi', 'Thư viện mở cửa đến 22:00 từ ngày 1–20/6 để hỗ trợ ôn thi.', 'all'),
(1, 'Sách mới: Khoa học máy tính', 'Đã nhập 45 đầu sách mới chuyên ngành CNTT. Mời bạn đọc tham khảo.', 'student');

