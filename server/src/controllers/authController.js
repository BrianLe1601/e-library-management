'use strict';
/**
 * 
 * Endpoints:
 *   POST /api/auth/register
 *   POST /api/auth/verify-otp
 *   POST /api/auth/login
 *   GET  /api/users/profile
 *   PUT  /api/users/profile
 *   PUT  /api/users/change-password
 */

const bcrypt    = require('bcrypt');
const db        = require('../config/db');
const userModel = require('../models/userModel');
const { signToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const nodemailer = require('nodemailer');

const SALT_ROUNDS = 10;

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = async (req, res) => {
    // Thêm trường role nếu bạn muốn phân quyền ngay từ lúc tạo (mặc định trong DB là 'user')
    const { full_name, email, password, phone, role } = req.body; 
    
    try {
        // 1. SỬA LỖI: Lấy thêm cột 'status' để kiểm tra điều kiện bên dưới
        const [existingUsers] = await db.query('SELECT id, status FROM users WHERE email = ?', [email]);

        let userId;
        // SỬA LỖI: Dùng đồng bộ tên biến existingUsers
        if (existingUsers.length > 0) { 
            const user = existingUsers[0];

            // TRƯỜNG HỢP 1 & 2: Tài khoản đã kích hoạt (active) hoặc đã bị khóa (banned)
            if (user.status !== 'pending') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email này đã được sử dụng bởi một tài khoản khác.' 
                });
            }

            // TRƯỜNG HỢP 3: Tài khoản đang 'pending' -> Tiến hành CẬP NHẬT ĐÈ thông tin mới
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Nếu form có truyền role thì cập nhật luôn role, nếu không thì giữ nguyên
            await db.query(
                'UPDATE users SET full_name = ?, password = ?, phone = ?, role = ?, updated_at = NOW() WHERE id = ?',
                [full_name, hashedPassword, phone, role || 'user', user.id]
            );
            
            userId = user.id; // Lấy lại id cũ để dùng tiếp
        } else {
            // TRƯỜNG HỢP MỚI HOÀN TOÀN: Thêm mới tài khoản vào DB với status mặc định là 'pending'
            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await db.query(
                'INSERT INTO users (full_name, email, password, phone, role, status) VALUES (?, ?, ?, ?, ?, "pending")',
                [full_name, email, hashedPassword, phone, role || 'user']
            );
            
            userId = result.insertId; // Lấy id mới vừa sinh ra
        }

        // 2. XÓA BỎ CÁC MÃ OTP CŨ CỦA EMAIL NÀY (Nếu có) ĐỂ TRÁNH RÁC DATABASE
        await db.query('DELETE FROM otps WHERE email = ? AND action_type = "register"', [email]);

        // 3. Sinh mã OTP 6 số ngẫu nhiên
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Có hiệu lực trong 5 phút

        // 4. Lưu OTP vào cơ sở dữ liệu
        await db.query(
            'INSERT INTO otps (email, otp_code, action_type, expires_at) VALUES (?, ?, "register", ?)',
            [email, otpCode, expiresAt]
        );

        // 5. Gửi mã OTP bằng Nodemailer nếu có cấu hình mail
        const mailUser = process.env.MAIL_USER;
        const mailPass = process.env.MAIL_PASS;
        const mailFrom = process.env.MAIL_FROM || '"E-Library" <no-reply@elibrary.com>';
        const mailHost = process.env.MAIL_HOST || 'smtp.gmail.com';
        const mailPort = Number(process.env.MAIL_PORT) || 587;

        let mailSent = false;
        if (mailUser && mailPass) {
            try {
                const transporter = nodemailer.createTransport({
                    host: mailHost,
                    port: mailPort,
                    secure: false, // true cho cổng 465, false cho các cổng khác như 587
                    auth: { user: mailUser, pass: mailPass }
                });

                await transporter.sendMail({
                    from: mailFrom,
                    to: email,
                    subject: 'Mã xác thực OTP kích hoạt tài khoản E-Library',
                    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-xl">
                            <h2 style="color: #4f46e5; text-align: center;">Xác thực tài khoản E-Library</h2>
                            <p>Xin chào,</p>
                            <p>Cảm ơn bạn đã đăng ký tài khoản tại hệ thống Thư viện điện tử của chúng tôi. Mã OTP kích hoạt tài khoản của bạn là:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <span style="font-size: 28px; font-weight: bold; color: #4f46e5; letter-spacing: 4px; background-color: #f3f4f6; padding: 10px 20px; border-radius: 8px;">
                                    ${otpCode}
                                </span>
                            </div>
                            <p style="color: #ef4444;">* Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                           </div>`
                });
                mailSent = true;
            } catch (mailError) {
                console.warn(`[authController.register] Gửi mail thất bại tới ${email}:`, mailError.message);
                if (process.env.NODE_ENV === 'production') {
                    throw mailError; // Đưa ra lỗi lớn nếu ở môi trường chạy thật
                }
            }
        } else {
            console.warn(`Thiếu cấu hình Mail trong file .env. Mã OTP của ${email} là: ${otpCode}`);
        }

        // 6. Trả về kết quả cho Frontend phản hồi
        const responsePayload = {
            success: true,
            message: mailSent
                ? 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP xác thực.'
                : 'Đăng ký thành công! Hệ thống đã tạo mã OTP (nhưng gửi mail không thành công ở môi trường thử nghiệm).',
        };

        // Nếu gửi mail thất bại hoặc đang ở môi trường Dev (thiếu config mail), trả luôn OTP về để test cho nhanh
        if (!mailSent || !mailUser || !mailPass) {
            responsePayload.debugOtp = otpCode;
        }

        return res.status(200).json(responsePayload);

    } catch (error) {
        console.error('[authController.register] Lỗi hệ thống:', error);
        const response = {
            success: false,
            message: 'Đã có lỗi xảy ra trong quá trình đăng ký tài khoản.',
        };
        if (process.env.NODE_ENV !== 'production') {
            response.detail = error.message;
        }
        return res.status(500).json(response);
    }
};

// ── POST /api/auth/verify-otp ───────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
    const { email, otpCode } = req.body;
    try {
        // Tìm kiếm mã OTP mới nhất của email này
        const [rows] = await db.query('SELECT * FROM otps WHERE email = ? AND otp_code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1', [email, otpCode]);
        
        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn.' });
        }

        // Kích hoạt trạng thái hoạt động tài khoản
        await db.query('UPDATE users SET status = "active" WHERE email = ?', [email]);
        
        // Xóa sạch bộ nhớ đệm OTP cũ của user này
        await db.query('DELETE FROM otps WHERE email = ?', [email]);

        res.status(200).json({ success: true, message: 'Xác thực tài khoản thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xử lý xác thực.' });
    }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ message: 'Tài khoản không tồn tại.' });

        const user = users[0];

        // Chặn tài khoản chưa verify OTP
        if (user.status === 'pending') return res.status(401).json({ message: 'Tài khoản chưa được xác thực OTP.' });
        if (user.status === 'banned') return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa.' });

        // Đối chiếu mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Mật khẩu không chính xác.' });

        // Ký Token đính kèm dữ liệu Role bảo mật
        const token = signToken({ id: user.id, email: user.email, role: user.role });

        res.status(200).json({
            success: true,
            data: {
                token,
                user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi đăng nhập hệ thống.' });
    }
};

// ── GET /api/users/profile ────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  // Vì authMiddleware cải tiến của chúng ta đã bốc sẵn object user từ DB nên ở đây phản hồi thẳng, giảm 1 lượt query thừa
  if (!req.user) return error(res, 'Không tìm thấy thông tin người dùng', 404);
  return success(res, req.user);
};

// ── PUT /api/users/profile ────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone, avatar_url } = req.body;
    const updated = await userModel.updateProfile(req.user.id, { full_name, phone, avatar_url });
    if (!updated) return error(res, 'Không có dữ liệu thay đổi hợp lệ', 400);

    const user = await userModel.findById(req.user.id);
    return success(res, user, 'Cập nhật thông tin hồ sơ thành công');
  } catch (err) {
    console.error('[authController.updateProfile] Error:', err);
    return error(res, 'Lỗi server nội bộ', 500);
  }
};

// ── PUT /api/users/change-password ───────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    // Lấy credentials để so sánh password cũ
    const userCredentials = await userModel.findCredentialsByEmail(req.user.email);
    if (!userCredentials) return error(res, 'Người dùng không tồn tại', 404);

    const match = await bcrypt.compare(old_password, userCredentials.password);
    if (!match) return error(res, 'Mật khẩu hiện tại không đúng', 400);

    if (old_password === new_password) {
      return error(res, 'Mật khẩu mới không được trùng với mật khẩu cũ', 400);
    }

    const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
    await userModel.updatePassword(req.user.id, hashed);

    return success(res, null, 'Thay đổi mật khẩu thành công');
  } catch (err) {
    console.error('[authController.changePassword] Error:', err);
    return error(res, 'Lỗi server nội bộ', 500);
  }
};
