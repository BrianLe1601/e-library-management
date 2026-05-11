# E-Library Management

Project web quản lý thư viện số trực tuyến xây dựng với ReactJS + Vite + TailwindCSS và NodeJS + Express + MySQL.

---

# 🚀 Công nghệ sử dụng

## Frontend

- ReactJS
- Vite
- Tailwind CSS
- JavaScript
- React Router DOM
- Axios

## Backend

- NodeJS
- ExpressJS
- MySQL
- dotenv
- cors

---

# 📚 Chức năng dự kiến

## Người dùng

- Đăng ký / đăng nhập
- Xem danh sách sách
- Tìm kiếm sách
- Xem chi tiết sách
- Mượn / trả sách
- Quản lý thông tin cá nhân

## Admin

- CRUD sách
- Quản lý người dùng
- Quản lý lượt mượn sách
- Dashboard thống kê

---

# 📁 Cấu trúc project

```bash
e-library-management/
│
├── client/                 # Frontend ReactJS + TailwindCSS
│
├── server/                 # Backend NodeJS + Express + MySQL
│
├── README.md
└── .gitignore
```

---
# 📂 Cấu trúc Frontend (`client/src`)

```bash
src/
│
├── assets/                 # Chứa ảnh, logo, icon (file tĩnh)
│
├── components/             # Chứa component dùng chung (Button, Navbar, Footer...)
│
├── context/                # Quản lý state toàn cục bằng Context API
│
├── hooks/                  # Custom hooks (ví dụ: useFetch.js)
│
├── layouts/                # Layout giao diện dùng chung cho User/Admin
│
├── pages/                  # Chứa các trang hoàn chỉnh (Home, Login, Admin...)
│
├── routes/                 # Định nghĩa routing (AppRoutes.jsx)
│
├── services/               # Chứa các file gọi API bằng Axios
│
├── styles/                 # CSS bổ sung nếu Tailwind chưa xử lý hết
│
├── App.jsx                 # Component gốc của ứng dụng
│
├── main.jsx                # Điểm khởi chạy React app
│
└── index.css               # Import TailwindCSS và global CSS
```

---

## Cấu trúc thư mục Backend

```
server/
├── src/
│   ├── config/
│   │   └── db.js                  ← MySQL connection pool (dùng chung)
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js      ← authenticate + authorize(role)
│   │   ├── validateMiddleware.js  ← bắt lỗi express-validator
│   │   └── errorMiddleware.js     ← 404 + global error handler
│   │
│   ├── utils/
│   │   ├── response.js            ← success / error / paginated helper
│   │   ├── jwt.js                 ← signToken helper
│   │   └── mailer.js              ← nodemailer (TV3 dùng)
│   │
│   ├── models/          ← SQL queries (KHÔNG có business logic)
│   │   ├── userModel.js           ← TV1
│   │   ├── bookModel.js           ← TV2
│   │   ├── borrowModel.js         ← TV3
│   │   └── reportModel.js         ← TV4
│   │
│   ├── controllers/     ← Nhận req → gọi model → trả res
│   │   ├── authController.js      ← TV1
│   │   ├── bookController.js      ← TV2
│   │   ├── borrowController.js    ← TV3
│   │   └── adminController.js     ← TV4
│   │
│   ├── routes/          ← Khai báo endpoint + middleware chain
│   │   ├── authRoutes.js          ← TV1
│   │   ├── bookRoutes.js          ← TV2
│   │   ├── borrowRoutes.js        ← TV3
│   │   └── adminRoutes.js         ← TV4
│   │
│   └── index.js                   ← Entry point, mount routes
│
├── .env.example
├── .gitignore
└── package.json
```

---

## Phân công công việc

| File cần làm                                     | Thành viên |
|--------------------------------------------------|-----------|
| `models/userModel.js` + `controllers/authController.js` + `routes/authRoutes.js` | **TV1** |
| `models/bookModel.js` + `controllers/bookController.js` + `routes/bookRoutes.js` | **TV2** |
| `models/borrowModel.js` + `controllers/borrowController.js` + `routes/borrowRoutes.js` | **TV3** |
| `models/reportModel.js` + `controllers/adminController.js` + `routes/adminRoutes.js` | **TV4** |

> **Shared files** (`config/`, `middlewares/`, `utils/`, `index.js`): ai cũng được sửa,  
> nhưng cần **thông báo nhóm** trước khi thay đổi để tránh conflict.

---

## Quy ước Response

Mọi controller dùng utils/response.js – **không** viết `res.json(...)` trực tiếp:

```js
const { success, error, paginated } = require('../utils/response');

// Thành công
return success(res, data, 'Thông báo', 201);

// Lỗi
return error(res, 'Lỗi server', 500);

// Danh sách có phân trang
return paginated(res, rows, total, page, limit);
```

Format response chuẩn:
```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}
```

---

## Setup & Chạy

```bash
# 1. Cài dependencies
npm install

# 2. Tạo .env
cp .env.example .env
# Điền DB_*, JWT_SECRET, MAIL_* vào .env

# 3. Import database
mysql -u root -p < src/config/init.sql

# 4. Chạy dev
npm run dev
```

---

## Biến môi trường (.env)

| Biến | Mô tả |
|------|-------|
| `PORT` | Cổng server (mặc định 3000) |
| `NODE_ENV` | `development` / `production` |
| `CLIENT_URL` | URL frontend React (CORS) |
| `DB_HOST` | Host MySQL |
| `DB_PORT` | Cổng MySQL (3306) |
| `DB_USER` | User MySQL |
| `DB_PASSWORD` | Mật khẩu MySQL |
| `DB_NAME` | Tên database (`e_library`) |
| `JWT_SECRET` | Khóa ký JWT (**bắt buộc, giữ bí mật**) |
| `JWT_EXPIRES_IN` | Thời hạn token (vd: `7d`) |
| `MAIL_HOST` | SMTP host (TV3) |
| `MAIL_USER` | Email gửi (TV3) |
| `MAIL_PASS` | App password (TV3) |

---

## API Endpoints

### TV1 – Auth & User

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/auth/register` | Public | Đăng ký |
| POST | `/api/auth/login` | Public | Đăng nhập → JWT |
| GET | `/api/users/profile` | Token | Lấy profile |
| PUT | `/api/users/profile` | Token | Cập nhật profile |
| PUT | `/api/users/change-password` | Token | Đổi mật khẩu |

### TV2 – Books

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/books` | Public | Danh sách (?search=&category=&page=) |
| GET | `/api/books/featured` | Public | Sách nổi bật |
| GET | `/api/books/categories` | Public | Danh mục |
| GET | `/api/books/:id` | Public | Chi tiết sách |
| POST | `/api/books` | Admin | Tạo sách |
| PUT | `/api/books/:id` | Admin | Cập nhật sách |
| DELETE | `/api/books/:id` | Admin | Xóa sách |

### TV3 – Borrow & Return

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/borrow` | Token | Mượn sách |
| PUT | `/api/borrow/return/:id` | Token | Trả sách |
| PUT | `/api/borrow/extend/:id` | Token | Gia hạn |
| GET | `/api/borrow/my-books` | Token | Sách đang mượn |
| GET | `/api/borrow/history` | Token | Lịch sử |
| GET | `/api/admin/borrows` | Admin/Emp | Tất cả lượt mượn |
| GET | `/api/admin/borrows/overdue` | Admin/Emp | Quá hạn |
| PUT | `/api/admin/borrows/approve/:id` | Admin/Emp | Duyệt |
| PUT | `/api/admin/borrows/reject/:id` | Admin/Emp | Từ chối |

### TV4 – Admin Dashboard

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/admin/stats` | Admin/Emp | Dashboard stats |
| GET | `/api/admin/reports` | Admin/Emp | Báo cáo (?from=&to=&type=) |
| GET | `/api/admin/reports/top-books` | Admin/Emp | Top sách |
| GET | `/api/admin/reports/export` | Admin/Emp | Xuất báo cáo |
| GET | `/api/admin/users` | Admin/Emp | Danh sách user |
| PATCH | `/api/admin/users/:id/status` | Admin | Khóa/mở khóa |
| DELETE | `/api/admin/users/:id` | Admin | Xóa user |

```

---

# ⚙️ Yêu cầu

- Node.js 18+ (khuyến nghị dùng bản LTS)
- npm
- Git
- MySQL

---
## Cài đặt và chạy

```bash
git clone <LINK_REPO>
cd e-library-management
```

---

# 🖥️ Cài đặt Frontend

## Di chuyển vào frontend

```bash
cd client
```

---

## Cài dependencies

```bash
npm install
```

---

## Thư viện frontend đã sử dụng

### React Router DOM

```bash
npm install react-router-dom
```

---

### Axios

```bash
npm install axios
```

---

### TailwindCSS

```bash
npm install tailwindcss @tailwindcss/vite
```

---

## Chạy frontend

```bash
npm run dev
```

Frontend sẽ chạy tại:

```bash
http://localhost:5173
```

---
# 🛠️ Cài đặt Backend
cd ..
về ...React\e-library-management>

## Di chuyển vào backend
```bash
cd server
```

---

## Cài dependencies

```bash
npm install
```

---

## Thư viện backend đã sử dụng

```bash
npm install express cors dotenv mysql2 nodemon
```

---

## Chạy backend

```bash
npm run dev
```

Backend sẽ chạy tại:

```bash
http://localhost:5000
```

---
# 🗄️ Cài đặt MySQL
Dùng MySQL workbench ( dễ nhất ). Vào project file init.sql copy lệnh tạo database (server/src/init.sql)
Tạo thêm file .env (server/.env) dựa theo .env.example (server/.env.example)
---

# 🛠 Quy trình làm việc nhóm (Git Workflow)

## Quy tắc đặt tên nhánh

- Bắt buộc đặt tên nhánh theo tên cá nhân (viết thường, không dấu, ngăn cách bằng dấu `-`).
- Công thức: tên-cá-nhân-tên-tính-năng
- Ví dụ:
  - `pham-quoc-thang-homepage`
  - `le-kim-buu-loginpage`

---

## Workflow 5 bước chuẩn

### 1. Trước khi code, luôn cập nhật `main` mới nhất

```bash
git checkout main
git pull origin main
```

---

### 2. Tạo nhánh cá nhân theo đúng quy tắc tên

```bash
git checkout -b le-kim-buu-loginpage ( khi xong chức năng sẽ tạo nhánh mới thay đổi chức năng, nếu chưa xong phần chức năng cũ thì vẫn làm tiếp trên nhánh cũ )
Ví dụ: tiếp tục làm nhánh cũ git checkout le-kim-buu-loginpage
Ví dụ: tạo nhánh mới git checkout -b le-kim-buu-homepage
```

---

### 3. Code tính năng, sau đó add và commit rõ ràng

```bash
git add .
git commit -m "feat: mo ta ngan gon thay doi"
```

Ví dụ:

```bash
git commit -m "feat: create login page"
git commit -m "fix: login validation"
```

---

### 4. Push nhánh cá nhân lên GitHub

```bash
git push origin le-kim-buu-loginpage
```

---

### 5. Tạo Pull Request (PR) để Leader review và merge vào `main`

Sau khi push:
- Vào GitHub
- Chọn:
  - `Compare & pull request`
- Leader review code
- Merge vào `main`

---

# ⚠️ Lưu ý quan trọng

- Không bao giờ push trực tiếp lên `main`
- Luôn pull `main` mới nhất trước khi code
- Kiểm tra conflict trước khi merge PR
- Commit message phải rõ ràng
- Mỗi thành viên code trên branch riêng

---

# 📦 Extension VSCode khuyến nghị

- ES7+ React Snippets
- Tailwind CSS IntelliSense
- Prettier
- ESLint
- GitLens

---
