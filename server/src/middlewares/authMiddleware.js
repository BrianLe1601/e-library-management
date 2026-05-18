'use strict';

const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

// Middleware 1: Kiểm tra xem Token có hợp lệ không
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Truy cập bị từ chối, thiếu mã Token.' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Đính thông tin { id, email, role } vào request
        next();
    } catch (err) {
        res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

// Middleware 2: Kiểm tra danh sách quyền được phép gọi API
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này.' });
        }
        next();
    };
};

module.exports = {
    authenticate: verifyToken,
    authorize: checkRole,
};