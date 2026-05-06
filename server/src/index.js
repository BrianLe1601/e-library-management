const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Quan trọng: Trỏ đúng ra file .env ở thư mục server

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
// Không nên gán cứng giá trị 'root' hay '' ở đây để bảo mật, hãy để hết trong .env
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306 // MySQL mặc định chạy cổng 3306
});

db.connect((err) => {
    if (err) {
        console.error('Kết nối Database thất bại:', err.message);
    } else {
        console.log('Đã kết nối với MySQL Database');
    }
});

// Basic Route for Testing
app.get('/', (req, res) => {
    res.json({ message: 'E-Library Backend is Running...' }); // Trả về JSON sẽ tốt hơn cho API
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});