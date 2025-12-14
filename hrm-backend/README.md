# HRM Backend (Node/Express + MongoDB)

API cho hệ thống quản lý nhân sự. Công nghệ: Node.js, Express, Mongoose, JWT, BCrypt.

## Yêu cầu
- Node.js LTS (>= 18)
- MongoDB đang chạy (mặc định `mongodb://127.0.0.1:27017/CK-HRM-db`, tùy chỉnh qua `.env`)

## Cấu hình môi trường
Tạo file `.env` trong `hrm-backend/`:
```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/CK-HRM-db
JWT_SECRET=changeme
REFRESH_SECRET=changeme-refresh
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
```

## Cài đặt & chạy
```bash
cd hrm-backend
npm install
npm run dev   # hoặc npm start
```
Kiểm tra log: `✅ MongoDB connected` và `Server running on http://localhost:4000`.

## Cấu trúc chính
- `src/server.js`: bootstrap Express, middleware chung, mount router, 404, error handler.
- `src/core/db/mongo.js`: kết nối Mongoose.
- `src/core/middleware/errorHandler.js`: chuẩn hóa lỗi JSON.
- `src/core/middleware/auth.js`: authGuard (JWT), requireRoles (RBAC đơn giản).
- `src/core/utils/httpError.js`: helper tạo lỗi có statusCode.
- `src/modules/auth/*`: User model, service (register/login/refresh), validator, controller, router.
- `src/modules/employee/*`: Employee model, service CRUD, validator, controller, router.

## API tóm tắt
- Auth:
  - `POST /api/auth/register` {email, password, roles?} → tạo user, trả tokens.
  - `POST /api/auth/login` {email, password} → tokens.
  - `POST /api/auth/refresh` {refreshToken} → tokens mới.
- Employees (yêu cầu Bearer token; tạo/sửa/xóa cần role `admin` hoặc `hr`):
  - `GET /api/employees` (có thể filter `departmentId`, `status`)
  - `GET /api/employees/:id`
  - `POST /api/employees` {code, fullName, ...}
  - `PUT /api/employees/:id`
  - `DELETE /api/employees/:id`
- Health:
  - `GET /api/health` → `{ success: true }`

## Luồng sử dụng
1) Đăng ký admin (hoặc seed) qua `/api/auth/register`.
2) Đăng nhập `/api/auth/login` → lấy `accessToken`.
3) Gọi Employees với header `Authorization: Bearer <accessToken>`.
4) Khi access token hết hạn, dùng `/api/auth/refresh` với refreshToken.

## Lỗi thường gặp
- `ECONNREFUSED ::1:27017`: Mongo chưa chạy hoặc URI dùng IPv6. Đổi `MONGODB_URI` sang `mongodb://127.0.0.1:27017/...` và đảm bảo mongod chạy.
- 401/403: Thiếu hoặc sai token, hoặc không đủ role khi POST/PUT/DELETE employee.
- 400 trùng email/code: Email user và code nhân viên đều unique.

## Kiểm thử nhanh (Postman/Thunder)
- Health: GET `http://localhost:4000/api/health`
- Đăng ký admin: POST `/api/auth/register` body `{"email":"admin@hrm.com","password":"123456","roles":["admin"]}`
- Đăng nhập: POST `/api/auth/login` body `{"email":"admin@hrm.com","password":"123456"}`
- CRUD nhân viên: dùng accessToken cho header Bearer, gọi `/api/employees`.

