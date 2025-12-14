# HRM Frontend (React + Vite, JS)

Giao diện web cho hệ thống quản lý nhân sự, dùng React, React Router, React Query, Axios. Không dùng TypeScript.

## Yêu cầu
- Node.js LTS (>= 18)
- Đã có backend chạy sẵn (mặc định `http://localhost:4000/api`), hoặc bạn sẽ chỉnh URL này trong `.env`
- Đã cài npm (đi kèm Node)

## Cài đặt & chuẩn bị
1) Mở terminal tại thư mục dự án gốc, vào thư mục frontend:
   ```bash
   cd hrm-frontend
   ```
2) Cài dependencies:
   ```bash
   npm install
   ```
3) (Khuyến nghị) Tạo file `.env` trong `hrm-frontend/` để cấu hình URL API:
   ```bash
   VITE_API_URL=http://localhost:4000/api
   ```
   - Nếu backend chạy port khác, sửa lại cho đúng.
   - Nếu không tạo `.env`, mặc định dùng `http://localhost:4000/api`.

## Cấu hình môi trường
Tạo file `.env` (cùng thư mục) nếu muốn override API URL:
```
VITE_API_URL=http://localhost:4000/api
```

## Chạy dev
```bash
npm run dev
```
Terminal sẽ hiển thị địa chỉ dev (thường http://localhost:5173). Mở địa chỉ này trên trình duyệt.

## Build & preview (sản phẩm)
```bash
npm run build
npm run preview
```
`npm run preview` sẽ phục vụ bản build tĩnh để kiểm tra trước khi deploy.

## Cấu trúc chính
- `src/main.jsx`: entry, khởi tạo React Query, Router, AuthProvider.
- `src/App.jsx`: khai báo route.
- `src/providers/AuthProvider.jsx`: quản lý token/user trong localStorage.
- `src/components/ProtectedRoute.jsx`: chặn truy cập nếu chưa đăng nhập.
- `src/api/*`: axios client và API calls (auth, employees).
- `src/pages/*`: Login, Register, Dashboard, NotFound.
- `src/style.css`: style đơn giản cho auth/dashboard.

## Luồng sử dụng (UI)
1) Mở http://localhost:5173 → nếu chưa đăng nhập sẽ chuyển tới trang Login.
2) Đăng ký hoặc đăng nhập → nhận accessToken, lưu vào localStorage.
3) Dashboard tự gọi `/employees` (cần token). Nếu token hết hạn hoặc thiếu, sẽ bị chuyển về `/login`.

## Lỗi thường gặp
- **Không thấy giao diện**: đảm bảo đang chạy `npm run dev` trong thư mục `hrm-frontend` và mở đúng URL dev. Không mở file `index.html` trực tiếp.
- **React/JSX không chạy**: chắc chắn đã `npm install` và có file `vite.config.js` với plugin React (đã cấu hình sẵn).
- **API lỗi CORS/401**: backend phải chạy, token phải hợp lệ; chỉnh `VITE_API_URL` nếu backend không ở `http://localhost:4000`.
- **Muốn logout sạch**: vào DevTools > Application > Local Storage, xóa key `hrm_auth`, hoặc bấm “Đăng xuất” trên giao diện.

