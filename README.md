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

# 📂 Cấu trúc Backend (`server/src`)

```bash
server/src/
├── config/
│   └── db.js                 ← Pool MySQL dùng chung
├── middlewares/
│   ├── authMiddleware.js      ← authenticate + authorize('admin','employee'...)
│   ├── validateMiddleware.js  ← Bắt lỗi express-validator
│   └── errorMiddleware.js     ← 404 + global error handler
├── utils/
│   ├── response.js            ← success() / error() / paginated()
│   ├── jwt.js                 ← signToken()
│   └── mailer.js              ← sendMail() (TV3 dùng)
├── models/     ← CHỈ có SQL, không có logic
│   ├── userModel.js           ← TV1
│   ├── bookModel.js           ← TV2
│   ├── borrowModel.js         ← TV3
│   └── reportModel.js         ← TV4
├── controllers/← Nhận req → gọi model → gọi response helper
│   ├── authController.js      ← TV1
│   ├── bookController.js      ← TV2
│   ├── borrowController.js    ← TV3
│   └── adminController.js     ← TV4
├── routes/     ← Khai báo endpoint + gắn middleware
│   ├── authRoutes.js          ← TV1
│   ├── bookRoutes.js          ← TV2
│   ├── borrowRoutes.js        ← TV3
│   └── adminRoutes.js         ← TV4
└── index.js                   ← Mount tất cả routes
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
