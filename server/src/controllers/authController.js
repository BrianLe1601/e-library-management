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
    const { full_name, email, password, phone, role } = req.body;
    try {
        // 1. Kiểm tra email tồn tại
        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) return res.status(400).json({ success: false, message: 'This email is already registered.' });

        // 2. Băm mật khẩu bảo mật
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Tạo tài khoản với trạng thái 'pending'
        await db.query(
            'INSERT INTO users (full_name, email, password, phone, role, status) VALUES (?, ?, ?, ?, ?, "pending")',
            [full_name, email, hashedPassword, phone || null, role || 'user']
        );

        // 4. Sinh mã OTP 6 số ngẫu nhiên
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

        // 5. Lưu OTP vào cơ sở dữ liệu
        await db.query('INSERT INTO otps (email, otp_code, expires_at) VALUES (?, ?, ?)', [email, otpCode, expiresAt]);

        // 6. Gửi mã OTP bằng Nodemailer nếu có cấu hình mail
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
                    secure: false,
                    auth: { user: mailUser, pass: mailPass }
                });

                await transporter.sendMail({
                    from: mailFrom,
                    to: email,
                    subject: 'OTP Verification Code for E-Library Account',
                    html: `<p>Hello,</p><p>Your OTP code to activate your E-Library account is: <b>${otpCode}</b>. This code is valid for 5 minutes.</p>`
                });
                mailSent = true;
            } catch (mailError) {
                console.warn(`[authController.register] Mail send failed for ${email}:`, mailError.message);
                if (process.env.NODE_ENV === 'production') {
                    throw mailError;
                }
            }
        } else {
            console.warn(`Mail config missing. OTP for ${email} is ${otpCode}`);
        }

        const responsePayload = {
            success: true,
            message: mailSent
                ? 'Registration successful. Please check your email for the OTP.'
                : 'Registration successful. OTP generation succeeded, but email delivery was not completed.',
        };

        if (!mailSent || !mailUser || !mailPass) {
            responsePayload.debugOtp = otpCode;
        }

        res.status(200).json(responsePayload);
    } catch (error) {
        console.error('[authController.register] Error:', error);
        const response = {
            success: false,
            message: 'An error occurred while registering.',
        };
        if (process.env.NODE_ENV !== 'production') {
            response.detail = error.message;
        }
        res.status(500).json(response);
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
