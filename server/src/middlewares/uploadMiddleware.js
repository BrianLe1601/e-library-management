'use strict';
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Cấu hình kết nối với Cloudinary bằng biến môi trường
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Cấu hình nơi lưu trữ (Storage)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'e_library_books', // Tên thư mục nó sẽ tự tạo trên Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'], // Chỉ cho phép up ảnh
    // Tự động nén và resize ảnh bìa sách cho chuẩn kích thước, tránh web bị lag
    transformation: [{ width: 600, height: 1000, crop: 'fill' }] 
  },
});

// 3. Khởi tạo multer với storage vừa cấu hình
const upload = multer({ storage: storage });

module.exports = upload;