'use strict';
/**
 * * Endpoints:
 * POST /api/auth/register
 * POST /api/auth/verify-otp
 * POST /api/auth/login
 * POST /api/auth/google       
 * GET  /api/users/profile
 * PUT  /api/users/profile
 * PUT  /api/users/change-password
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const userModel = require('../models/userModel');
const { signToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const nodemailer = require('nodemailer');

const SALT_ROUNDS = 10;

// HÀM TIỆN ÍCH CHUYÊN DÙNG ĐỂ TẠO TRÌNH GỬI MAIL (CHỐNG TREO)
const createTransporter = (mailUser, mailPass) => {
    return nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: 465,           // ĐỔI SANG CỔNG 465 ĐỂ DÙNG SSL
        secure: true,        // BẬT SSL TRỰC TIẾP CHỐNG TREO STARTTLS
        auth: { user: mailUser, pass: mailPass },
        family: 4,           // Bắt buộc dùng IPv4
        connectionTimeout: 5000, // Cực kỳ quan trọng: Quá 5 giây không kết nối được -> Hủy ngay để khỏi đơ web
        greetingTimeout: 5000,
        socketTimeout: 5000
    });
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = async (req, res) => {
    const { full_name, email, password, phone, role } = req.body;
    try {
        const [existingUsers] = await db.query('SELECT id, status FROM users WHERE email = ?', [email]);
        let userId;
        if (existingUsers.length > 0) {
            const user = existingUsers[0];
            if (user.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'This email is already in use. If you forgot your password, please use the "Forgot Password" feature.'
                });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.query(
                'UPDATE users SET full_name = ?, password = ?, phone = ?, role = ?, updated_at = NOW() WHERE id = ?',
                [full_name, hashedPassword, phone, role || 'user', user.id]
            );
            userId = user.id;
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await db.query(
                "INSERT INTO users (full_name, email, password, phone, role, status) VALUES (?, ?, ?, ?, ?, 'pending')",
                [full_name, email, hashedPassword, phone, role || 'user']
            );
            userId = result.insertId;
        }

        await db.query("DELETE FROM otps WHERE email = ? AND action_type = 'register'", [email]);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.query(
            "INSERT INTO otps (email, otp_code, action_type, expires_at) VALUES (?, ?, 'register', ?)",
            [email, otpCode, expiresAt]
        );

        const mailUser = process.env.MAIL_USER;
        const mailPass = process.env.MAIL_PASS;
        let mailSent = false;

        if (mailUser && mailPass) {
            try {
                const transporter = createTransporter(mailUser, mailPass);
                await transporter.sendMail({
                    from: process.env.MAIL_FROM || '"E-Library" <no-reply@elibrary.com>',
                    to: email,
                    subject: 'E-Library Account Activation OTP',
                    html: `<h2>E-Library Account Verification</h2><p>Your activation OTP is: <b>${otpCode}</b></p>`
                });
                mailSent = true;
            } catch (mailError) {
                console.warn(`[authController.register] Lỗi gửi mail (Đã bỏ qua để không đơ web):`, mailError.message);
            }
        }

        const responsePayload = {
            success: true,
            message: mailSent
                ? 'Registration successful! Please check your email for the OTP verification code.'
                : 'Registration successful! System generated an OTP.',
        };

        // LUÔN TRẢ VỀ OTP TRONG MẠNG ĐỂ CỨU CÁNH LÚC DEMO NẾU MAIL BỊ LỖI
        if (!mailSent) responsePayload.debugOtp = otpCode;

        return res.status(200).json(responsePayload);
    } catch (error) {
        console.error('[authController.register] System error:', error);
        return res.status(500).json({ success: false, message: 'An error occurred.' });
    }
};

// ── POST /api/auth/resend-otp ────────────────────────────────────────────────
exports.resendOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'Account not found.' });

        const user = users[0];
        if (user.status !== 'pending') return res.status(400).json({ success: false, message: 'This account has already been verified.' });

        await db.query("DELETE FROM otps WHERE email = ? AND action_type = 'register'", [email]);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.query(
            "INSERT INTO otps (email, otp_code, action_type, expires_at) VALUES (?, ?, 'register', ?)",
            [email, otpCode, expiresAt]
        );

        const mailUser = process.env.MAIL_USER;
        const mailPass = process.env.MAIL_PASS;
        let mailSent = false;

        if (mailUser && mailPass) {
            try {
                const transporter = createTransporter(mailUser, mailPass);
                await transporter.sendMail({
                    from: process.env.MAIL_FROM || '"E-Library" <no-reply@elibrary.com>',
                    to: email,
                    subject: 'E-Library Account Activation OTP',
                    html: `<h2>E-Library Account Verification</h2><p>Your activation OTP is: <b>${otpCode}</b></p>`
                });
                mailSent = true;
            } catch (err) { console.warn('Lỗi gửi mail (Đã bỏ qua):', err.message); }
        }

        const responsePayload = { success: true, message: 'New OTP code has been sent to your email.' };
        if (!mailSent) responsePayload.debugOtp = otpCode;

        return res.status(200).json(responsePayload);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error on server.' });
    }
};

// ── POST /api/auth/verify-otp ───────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const [otps] = await db.query(
            `SELECT * FROM otps WHERE email = ? AND otp_code = ? AND action_type = 'register' AND is_used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
            [email, otp]
        );
        if (otps.length === 0) return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });

        await db.query('UPDATE otps SET is_used = 1 WHERE id = ?', [otps[0].id]);
        await db.query("UPDATE users SET status = 'active' WHERE email = ?", [email]);
        return res.status(200).json({ success: true, message: 'Verification successful. Now you can login.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ message: 'Account does not exist.' });

        const user = users[0];

        if (user.status === 'pending') return res.status(401).json({ message: 'Account has not been verified with OTP.' });
        if (user.status === 'banned') return res.status(403).json({ message: 'Your account has been banned.' });

        if (user.password === 'GOOGLE_AUTH_ACCOUNT' || user.login_method === 'google') {
            return res.status(400).json({ message: 'This account was registered via Google.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect password.' });

        const token = signToken({ id: user.id, email: user.email, role: user.role });
        res.status(200).json({
            success: true,
            data: { token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } }
        });
    } catch (error) {
        res.status(500).json({ message: 'System login error.' });
    }
};

// ── POST /api/auth/google ──────────────────────────────────────────
exports.googleLogin = async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ success: false, message: 'Missing token.' });

    try {
        const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
        if (!googleRes.ok) return res.status(400).json({ success: false, message: 'Invalid token.' });
        
        const payload = await googleRes.json();
        const { sub: googleId, email, name, picture } = payload;
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        let user;

        if (users.length > 0) {
            user = users[0];
            if (user.status === 'banned') return res.status(403).json({ success: false, message: 'Account banned.' });
            if (user.login_method === 'local' || !user.google_id) {
                await db.query("UPDATE users SET google_id = ?, login_method = 'google', avatar_url = COALESCE(avatar_url, ?), updated_at = NOW() WHERE id = ?", [googleId, picture, user.id]);
                user.login_method = 'google';
            }
            if (user.status === 'pending') {
                await db.query("UPDATE users SET status = 'active', updated_at = NOW() WHERE id = ?", [user.id]);
                user.status = 'active';
            }
        } else {
            const [result] = await db.query(
                `INSERT INTO users (full_name, email, password, avatar_url, role, status, login_method, google_id) VALUES (?, ?, 'GOOGLE_AUTH_ACCOUNT', ?, 'user', 'active', 'google', ?)`,
                [name, email, picture, googleId]
            );
            const [newUsers] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = newUsers[0];
        }

        const token = signToken({ id: user.id, email: user.email, role: user.role });
        return res.status(200).json({ success: true, data: { token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ── POST /api/auth/forgot-password ──────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'Email does not exist in the system.' });

        const user = users[0];
        if (user.status === 'pending') return res.status(400).json({ success: false, message: 'Account is not verified.' });
        if (user.status === 'banned') return res.status(403).json({ success: false, message: 'Your account has been banned.' });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.query("DELETE FROM otps WHERE email = ? AND action_type = 'forgot_password'", [email]);
        await db.query("INSERT INTO otps (email, otp_code, action_type, expires_at) VALUES (?, ?, 'forgot_password', ?)", [email, otpCode, expiresAt]);

        const mailUser = process.env.MAIL_USER;
        const mailPass = process.env.MAIL_PASS;
        let mailSent = false;

        if (mailUser && mailPass) {
            try {
                const transporter = createTransporter(mailUser, mailPass);
                await transporter.sendMail({
                    from: process.env.MAIL_FROM || '"E-Library" <no-reply@elibrary.com>',
                    to: email,
                    subject: 'E-Library Password Reset OTP',
                    html: `<h2>Reset E-Library Account Password</h2><p>Your password reset OTP is: <b>${otpCode}</b></p>`
                });
                mailSent = true;
            } catch (mailError) {
                console.warn('[authController.forgotPassword] Lỗi gửi mail (Đã bỏ qua):', mailError.message);
            }
        }

        const responsePayload = { success: true, message: 'OTP sent successfully' };
        if (!mailSent) responsePayload.debugOtp = otpCode;
        return res.status(200).json(responsePayload);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ── POST /api/auth/verify-forgot-otp ───────────────────────────────────────────────────
exports.verifyForgotOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const [otps] = await db.query(
            `SELECT * FROM otps WHERE email = ? AND otp_code = ? AND action_type = 'forgot_password' AND is_used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
            [email, otp]
        );
        if (otps.length === 0) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

        await db.query('UPDATE otps SET is_used = 1 WHERE id = ?', [otps[0].id]);
        const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        return res.status(200).json({ success: true, message: 'Verification successful.', resetToken });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ── POST /api/auth/reset-password ───────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE users SET password = ?, login_method = 'local', google_id = NULL WHERE email = ?", [hashedPassword, email]);
        return res.status(200).json({ success: true, message: 'Password changed successfully!' });
    } catch (error) {
        return res.status(400).json({ success: false, message: 'Password reset session has expired (over 15 minutes).' });
    }
};

// ── GET /api/users/profile ────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
    if (!req.user) return error(res, 'User information not found', 404);
    return success(res, req.user);
};

// ── PUT /api/users/profile ────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { full_name, phone, avatar_url } = req.body;
        const updated = await userModel.updateProfile(req.user.id, { full_name, phone, avatar_url });
        if (!updated) return error(res, 'No valid data to update', 400);

        const user = await userModel.findById(req.user.id);
        return success(res, user, 'Profile updated successfully');
    } catch (err) {
        console.error('[authController.updateProfile] Error:', err);
        return error(res, 'Internal server error', 500);
    }
};

// ── PUT /api/users/change-password ───────────────────────────────────────────
exports.changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        const userCredentials = await userModel.findCredentialsByEmail(req.user.email);
        if (!userCredentials) return error(res, 'User does not exist', 404);

        const match = await bcrypt.compare(old_password, userCredentials.password);
        if (!match) return error(res, 'Current password is incorrect', 400);

        if (old_password === new_password) return error(res, 'New password cannot be the same as the old password', 400);

        const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
        await userModel.updatePassword(req.user.id, hashed);
        return success(res, null, 'Change password successful');
    } catch (err) {
        console.error('[authController.changePassword] Error:', err);
        return error(res, 'Internal Server Error', 500);
    }
};