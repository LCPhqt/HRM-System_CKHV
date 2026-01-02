# Hướng dẫn chạy Unit Tests cho Identity Service

## Cài đặt

```bash
npm install
```

## Chạy tests

```bash
# Chạy tất cả tests
npm test

# Chạy tests với watch mode
npm run test:watch
```

## Yêu cầu

- Node.js 18+
- MongoDB đang chạy (hoặc sử dụng test database)
- Test database sẽ tự động được tạo và xóa sau mỗi test run

## Cấu hình

Có thể cấu hình test database URI qua biến môi trường:

```bash
TEST_MONGO_URI=mongodb://localhost:27017/hrm_identity_test npm test
```

## Test Cases

### Registration API Tests
- ✅ Đăng ký thành công với dữ liệu hợp lệ
- ✅ Trả về 400 khi thiếu email
- ✅ Trả về 400 khi thiếu password
- ✅ Trả về 400 khi password và confirm_password không khớp
- ✅ Trả về 409 khi email đã tồn tại
- ✅ Hash password trước khi lưu vào database
- ✅ Hoạt động không cần full_name

### Login API Tests
- ✅ Đăng nhập thành công với credentials đúng
- ✅ Trả về 400 khi thiếu email
- ✅ Trả về 400 khi thiếu password
- ✅ Trả về 401 khi email không tồn tại
- ✅ Trả về 401 khi password sai
- ✅ Trả về JWT token hợp lệ khi đăng nhập thành công

