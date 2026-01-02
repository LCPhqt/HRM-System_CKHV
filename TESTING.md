# Hướng dẫn Kiểm thử Tự động

Dự án này có 2 loại tests:
1. **Unit Tests** cho Backend API (đăng ký và đăng nhập)
2. **UI Tests** cho Frontend (Selenium)

## 🚀 Chạy Tests

### Backend Unit Tests

```bash
cd backend-hrmSOA/services/identity-service
npm install
npm test
```

**Test Cases:**
- ✅ Validate form đăng ký (thiếu email, thiếu password, password không khớp)
- ✅ Email trùng (409 error)
- ✅ Đăng ký thành công
- ✅ Đăng nhập đúng credentials
- ✅ Sai mật khẩu (401 error)
- ✅ Sai email / user không tồn tại (401 error)

### Frontend UI Tests

```bash
cd frontend-hrmSOA

# 1. Khởi động server
npm run dev
# Hoặc
npm run build && npm run preview

# 2. Chạy tests (terminal khác)
npm install
npm run test:ui
```

**Test Cases:**
- ✅ Mở trang đăng ký tại URL đúng
- ✅ Điền form đăng ký và submit
- ✅ Sau khi đăng ký → chuyển sang đăng nhập
- ✅ Đăng nhập bằng tài khoản vừa tạo
- ✅ Sau khi login thành công → điều hướng tới trang đúng
- ✅ Không hiển thị thông báo lỗi sau khi login thành công
- ✅ Hiển thị lỗi khi đăng nhập sai credentials

## 📋 Yêu cầu

### Backend Tests
- Node.js 18+
- MongoDB đang chạy
- Test database sẽ tự động được tạo và xóa

### Frontend Tests
- Node.js 18+
- Chrome browser
- Frontend server đang chạy

## 🔧 Cấu hình

### Backend
```bash
TEST_MONGO_URI=mongodb://localhost:27017/hrm_identity_test npm test
```

### Frontend
```bash
TEST_BASE_URL=http://localhost:5173 npm run test:ui
HEADLESS=true npm run test:ui  # Chạy không hiển thị browser
```

## 🎯 CI/CD

Tests tự động chạy trên GitHub Actions khi:
- Push code lên `main` hoặc `develop`
- Tạo Pull Request

Xem file `.github/workflows/test.yml` để biết chi tiết.

## ✅ Acceptance Criteria

### Unit Tests - Đăng ký
- [x] Tất cả test case đăng ký chạy PASS
- [x] Build CI không bị fail do test

### Unit Tests - Đăng nhập
- [x] Tất cả test case đăng nhập chạy PASS
- [x] Sai cred → API trả lỗi đúng như mong đợi

### UI Tests - Selenium
- [x] Form Đăng ký được mở đúng URL
- [x] Sau khi submit, user mới được tạo (login được bằng account đó)
- [x] Sau khi login thành công:
  - [x] Điều hướng tới trang đúng (VD: /home, /customers, /dashboard)
  - [x] Không hiển thị thông báo lỗi
- [x] Test chạy tự động, không cần thao tác tay

## 📝 Ghi chú

- Backend tests sử dụng Jest và Supertest
- Frontend tests sử dụng Selenium WebDriver
- Tests được thiết kế để chạy độc lập và có thể chạy song song
- Database test được tự động cleanup sau mỗi test run

