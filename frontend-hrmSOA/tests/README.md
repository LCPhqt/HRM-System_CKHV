# Hướng dẫn chạy UI Tests với Selenium

## Cài đặt

```bash
npm install
```

## Yêu cầu

- Node.js 18+
- Chrome browser đã được cài đặt
- Frontend server đang chạy (hoặc sử dụng preview build)

## Chạy tests

### 1. Khởi động frontend server

```bash
# Development mode
npm run dev

# Hoặc build và preview
npm run build
npm run preview
```

### 2. Chạy UI tests

```bash
npm run test:ui
```

## Cấu hình

Có thể cấu hình qua biến môi trường:

```bash
# URL của frontend (mặc định: http://localhost:5173)
TEST_BASE_URL=http://localhost:5173 npm run test:ui

# Chạy ở headless mode (không hiển thị browser)
HEADLESS=true npm run test:ui

# Credentials cho test user (nếu cần)
TEST_USER_EMAIL=admin@gmail.com
TEST_USER_PASSWORD=admin123
```

## Test Cases

### Registration Flow
- ✅ Mở form đăng ký tại URL đúng
- ✅ Đăng ký user mới và chuyển sang trang đăng nhập
- ✅ Đăng nhập bằng tài khoản vừa tạo
- ✅ Validate độ dài password

### Login Flow
- ✅ Đăng nhập thành công với credentials đúng
- ✅ Hiển thị lỗi khi password sai
- ✅ Hiển thị lỗi khi email không tồn tại
- ✅ Điều hướng tới trang đúng sau khi đăng nhập
- ✅ Không hiển thị thông báo lỗi sau khi đăng nhập thành công

## Troubleshooting

### Chrome driver không tìm thấy
Đảm bảo Chrome đã được cài đặt và chromedriver package đã được cài đặt:
```bash
npm install chromedriver --save-dev
```

### Tests fail với timeout
- Kiểm tra frontend server đang chạy
- Tăng TIMEOUT trong file test nếu cần
- Kiểm tra network connectivity

### Headless mode không hoạt động
Thử thêm các Chrome options:
```javascript
options.addArguments('--disable-gpu');
options.addArguments('--remote-debugging-port=9222');
```

