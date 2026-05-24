'use strict';
/**
 * * Endpoints:
 * POST /api/auth/register
 * POST /api/auth/verify-otp
 * POST /api/auth/login
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

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = async (req, res) => {
    // Add role field if you want to assign permissions at creation (default in DB is 'user')
    const { full_name, email, password, phone, role } = req.body;

    try {
        // 1. FIX: Fetch 'status' column to check the conditions below
        const [existingUsers] = await db.query('SELECT id, status FROM users WHERE email = ?', [email]);

        let userId;
        // FIX: Consistently use the existingUsers variable
        if (existingUsers.length > 0) {
            const user = existingUsers[0];

            // CASE 1 & 2: Account is already activated (active) or banned
            if (user.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'This email is already in use. If you forgot your password, please use the "Forgot Password" feature.'
                });
            }

            // CASE 3: Account is 'pending' -> OVERWRITE with new information
            const hashedPassword = await bcrypt.hash(password, 10);

            // If the form provides a role, update it; otherwise, keep the default
            await db.query(
                'UPDATE users SET full_name = ?, password = ?, phone = ?, role = ?, updated_at = NOW() WHERE id = ?',
                [full_name, hashedPassword, phone, role || 'user', user.id]
            );

            userId = user.id; // Reuse the existing id
        } else {
            // BRAND NEW CASE: Add new account to DB with default status 'pending'
            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await db.query(
                'INSERT INTO users (full_name, email, password, phone, role, status) VALUES (?, ?, ?, ?, ?, "pending")',
                [full_name, email, hashedPassword, phone, role || 'user']
            );

            userId = result.insertId; // Get the newly generated id
        }

        // 2. DELETE OLD OTPS FOR THIS EMAIL (If any) TO AVOID JUNK DATA
        await db.query('DELETE FROM otps WHERE email = ? AND action_type = "register"', [email]);

        // 3. Generate a random 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Valid for 5 minutes

        // 4. Save OTP to database
        await db.query(
            'INSERT INTO otps (email, otp_code, action_type, expires_at) VALUES (?, ?, "register", ?)',
            [email, otpCode, expiresAt]
        );

        // 5. Send OTP via Nodemailer if mail is configured
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
                    secure: false, // true for port 465, false for other ports like 587
                    auth: { user: mailUser, pass: mailPass }
                });

                await transporter.sendMail({
                    from: mailFrom,
                    to: email,
                    subject: 'E-Library Account Activation OTP',
                    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <h2 style="color: #4f46e5; text-align: center;">E-Library Account Verification</h2>
                            <p>Hello,</p>
                            <p>Thank you for registering an account on our E-Library system. Your account activation OTP is:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <span style="font-size: 28px; font-weight: bold; color: #4f46e5; letter-spacing: 4px; background-color: #f3f4f6; padding: 10px 20px; border-radius: 8px;">
                                    ${otpCode}
                                </span>
                            </div>
                            <p style="color: #ef4444;">* This OTP is valid for 5 minutes. Please do not share this code with anyone.</p>
                           </div>`
                });
                mailSent = true;
            } catch (mailError) {
                console.warn(`[authController.register] Failed to send email to ${email}:`, mailError.message);
                if (process.env.NODE_ENV === 'production') {
                    throw mailError; // Throw error if in production environment
                }
            }
        } else {
            console.warn(`Missing Mail configuration in .env. OTP for ${email} is: ${otpCode}`);
        }

        // 6. Return response to Frontend
        const responsePayload = {
            success: true,
            message: mailSent
                ? 'Registration successful! Please check your email for the OTP verification code.'
                : 'Registration successful! The system generated an OTP (but email sending failed in test environment).',
        };

        // If email sending fails or in Dev environment (missing mail config), return OTP for quick testing
        if (!mailSent || !mailUser || !mailPass) {
            responsePayload.debugOtp = otpCode;
        }

        return res.status(200).json(responsePayload);

    } catch (error) {
        console.error('[authController.register] System error:', error);
        const response = {
            success: false,
            message: 'An error occurred during account registration.',
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
        // Search for the latest OTP for this email
        const [rows] = await db.query(
            'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND action_type = "register" AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otpCode]
        );

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
        }

        // Activate account status
        await db.query('UPDATE users SET status = "active" WHERE email = ?', [email]);

        // Clear old OTP cache for this user
        await db.query('DELETE FROM otps WHERE email = ?', [email]);

        res.status(200).json({ success: true, message: 'Account verification successful.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing verification.' });
    }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ message: 'Account does not exist.' });

        const user = users[0];

        // Block accounts that have not verified OTP
        if (user.status === 'pending') return res.status(401).json({ message: 'Account has not been verified with OTP.' });
        if (user.status === 'banned') return res.status(403).json({ message: 'Your account has been banned.' });

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect password.' });

        // Sign Token appending Role data for security
        const token = signToken({ id: user.id, email: user.email, role: user.role });

        res.status(200).json({
            success: true,
            data: {
                token,
                user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'System login error.' });
    }
};

// ── POST /api/auth/forgot-password ──────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        // Check if email exists and account is active
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Email does not exist in the system.' });
        }

        const user = users[0];
        if (user.status === 'pending') {
            return res.status(400).json({ success: false, message: 'Account is not verified. Please complete registration first.' });
        }
        if (user.status === 'banned') {
            return res.status(403).json({ success: false, message: 'Your account has been banned.' });
        }

        // Generate 6-digit OTP and set 5-minute expiry
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Delete old OTP (if any) and save new OTP with action_type = 'forgot_password'
        await db.query('DELETE FROM otps WHERE email = ? AND action_type = "forgot_password"', [email]);
        await db.query(
            'INSERT INTO otps (email, otp_code, action_type, expires_at) VALUES (?, ?, "forgot_password", ?)',
            [email, otpCode, expiresAt]
        );

        // Send Email via Nodemailer
        const mailUser = process.env.MAIL_USER;
        const mailPass = process.env.MAIL_PASS;
        const mailFrom = process.env.MAIL_FROM || '"E-Library" <no-reply@elibrary.com>';
        const mailHost = process.env.MAIL_HOST || 'smtp.gmail.com';
        const mailPort = Number(process.env.MAIL_PORT) || 587;
        let mailSent = false;

        if (mailUser && mailPass) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.MAIL_HOST || 'smtp.gmail.com',
                    port: Number(process.env.MAIL_PORT) || 587,
                    secure: false,
                    auth: { user: mailUser, pass: mailPass }
                });

                await transporter.sendMail({
                    from: mailFrom,
                    to: email,
                    subject: 'E-Library Password Reset OTP',
                    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <h2 style="color: #4f46e5; text-align: center;">Reset E-Library Account Password</h2>
                            <p>Hello,</p>
                            <p>You recently requested a password reset on our E-Library system. Your password reset OTP is:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <span style="font-size: 28px; font-weight: bold; color: #4f46e5; letter-spacing: 4px; background-color: #f3f4f6; padding: 10px 20px; border-radius: 8px;">
                                    ${otpCode}
                                </span>
                            </div>
                            <p style="color: #ef4444;">* This OTP is valid for 5 minutes. Please do not share this code with anyone.</p>
                           </div>`
                });
                mailSent = true;
            } catch (mailError) {
                console.warn('[authController.forgotPassword] Email sending failed:', mailError.message);
            }
        } else {
            console.warn(`[forgotPassword] Missing Mail config. OTP for ${email}: ${otpCode}`);
        }

        const responsePayload = { success: true, message: 'OTP sent successfully' };
        if (!mailSent || !mailUser || !mailPass) {
            responsePayload.debugOtp = otpCode;
        }

        return res.status(200).json(responsePayload);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ── POST /api/auth/verify-forgot-otp ───────────────────────────────────────────────────
exports.verifyForgotOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        // Find valid OTP based on DB
        const [otpRecord] = await db.query(
            `SELECT * FROM otps WHERE email = ? AND otp_code = ? AND action_type = 'forgot_password' AND is_used = 0 AND expires_at > NOW()`,
            [email, otp]
        );

        if (otpRecord.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        // Mark this code as used
        await db.query('UPDATE otps SET is_used = 1 WHERE id = ?', [otpRecord[0].id]);

        // SECURITY: Issue a temporary key (Reset Token) valid for 15 minutes.
        // Frontend must hold this key to proceed to the password change page.
        const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });

        return res.status(200).json({ success: true, resetToken, message: 'OTP verified successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ── POST /api/auth/reset-password ───────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        // Decode key to get email
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;

        // Hash new password and save to DB
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

        return res.status(200).json({ success: true, message: 'Password changed successfully!' });
    } catch (error) {
        return res.status(400).json({ success: false, message: 'Password reset session has expired (over 15 minutes).' });
    }
};

// ── GET /api/users/profile ────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
    // Since our improved authMiddleware already fetches the user object from the DB, we respond directly here to reduce a redundant query
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

        // Fetch credentials to compare old password
        const userCredentials = await userModel.findCredentialsByEmail(req.user.email);
        if (!userCredentials) return error(res, 'User does not exist', 404);

        const match = await bcrypt.compare(old_password, userCredentials.password);
        if (!match) return error(res, 'Current password is incorrect', 400);

        if (old_password === new_password) {
            return error(res, 'New password cannot be the same as the old password', 400);
        }

        const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
        await userModel.updatePassword(req.user.id, hashed);

        return success(res, null, 'Change password successful');
    } catch (err) {
        console.error('[authController.changePassword] Error:', err);
        return error(res, 'Internal Server Error', 500);
    }
};