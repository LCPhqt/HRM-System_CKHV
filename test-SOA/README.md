# Test HRM SOA - Tập trung tất cả Tests

Folder này chứa tất cả các tests cho dự án HRM SOA, được tổ chức tập trung để dễ quản lý.

## 📁 Cấu trúc

```
test-hrmSOA/
├── backend/
│   └── identity-service/
│       ├── __tests__/
│       │   └── authController.test.js  # Unit tests cho API đăng ký/đăng nhập
│       ├── setup.js                    # Jest setup cho database
│       └── jest.config.js              # Jest configuration
├── frontend/
│   └── ui/
│       └── run-tests.js                # Selenium UI tests
├── package.json                        # Dependencies chung
└── README.md                           # File này
```

## 🚀 Cài đặt

### Cài đặt tất cả dependencies:

```bash
cd test-hrmSOA
npm install
npm run install:all
```

Hoặc cài đặt riêng:

**Backend tests:**
```bash
cd backend/identity-service
npm install
```

**Frontend tests:**
```bash
cd ../../frontend-hrmSOA
npm install
```

## 🧪 Chạy Tests

### ⚡ Cách nhanh nhất - Sử dụng Script (Khuyến nghị):

```powershell
cd test-hrmSOA

# Chạy tất cả (khởi động services + tests)
.\start-services-and-test.ps1

# Hoặc chỉ chạy tests cụ thể
.\start-services-and-test.ps1 backend    # Chỉ backend tests
.\start-services-and-test.ps1 frontend   # Chỉ frontend UI tests
.\start-services-and-test.ps1 admin      # Chỉ admin tests
.\start-services-and-test.ps1 all-ui     # Tất cả UI tests

# Dừng services sau khi test
.\stop-services.ps1
```

### Chạy thủ công:

**Chạy tất cả tests:**
```bash
cd test-hrmSOA
npm run test:all
```

**Chạy riêng từng loại:**

**Backend Unit Tests:**
```bash
cd test-hrmSOA
npm run test:backend
```

**Frontend UI Tests:**
```bash
cd test-hrmSOA
npm run test:frontend  # Login/Register tests
npm run test:admin     # Admin Search & Filter tests
npm run test:all-ui    # Tất cả UI tests
```

> 💡 **Lưu ý**: Với UI tests, cần khởi động frontend server trước (`npm run dev` trong `frontend-hrmSOA`)

## 📋 Yêu cầu

### Backend Tests:
- Node.js 18+
- MongoDB đang chạy
- Dependencies: jest, supertest

### Frontend Tests:
- Node.js 18+
- Chrome browser
- Frontend server đang chạy (`npm run dev` hoặc `npm run preview`)
- Backend services đang chạy (Gateway + Identity Service + Admin HR Service)

## 🔧 Cấu hình

### Backend Tests:
```bash
TEST_MONGO_URI=mongodb://localhost:27017/hrm_identity_test npm run test:backend
JWT_SECRET=your_secret npm run test:backend
```

### Frontend Tests:
```bash
TEST_BASE_URL=http://localhost:5173 npm run test:frontend
HEADLESS=true npm run test:frontend
TEST_USER_EMAIL=admin@gmail.com TEST_USER_PASSWORD=admin123 npm run test:frontend
```

## 📝 Test Cases

### Backend - Registration API:
- ✅ Đăng ký thành công
- ✅ Validate form (thiếu email, thiếu password)
- ✅ Password không khớp
- ✅ Email trùng (409 error)
- ✅ Hash password đúng cách

### Backend - Login API:
- ✅ Đăng nhập thành công
- ✅ Validate form
- ✅ Sai email/user không tồn tại (401)
- ✅ Sai password (401)
- ✅ Trả về JWT token hợp lệ

### Frontend - UI Tests (Login/Register):
- ✅ Mở form đăng ký đúng URL
- ✅ Đăng ký user mới và chuyển sang login
- ✅ Đăng nhập bằng tài khoản vừa tạo
- ✅ Đăng nhập thành công → redirect đúng
- ✅ Hiển thị lỗi khi sai credentials
- ✅ Validate password length

### Frontend - Admin Search & Filter Tests:
- ✅ Tìm kiếm theo tên nhân viên
- ✅ Tìm kiếm theo email
- ✅ Filter theo trạng thái "Tất cả"
- ✅ Filter theo trạng thái "Đang làm việc"
- ✅ Filter theo trạng thái "Nghỉ phép"
- ✅ Filter theo trạng thái "Đã nghỉ việc"
- ✅ Kết hợp search + filter
- ✅ Hiển thị thông báo khi không có kết quả

## 🔗 Liên kết

- Backend source: `../../backend-hrmSOA/services/identity-service/`
- Frontend source: `../../frontend-hrmSOA/`
- CI/CD config: `../../.github/workflows/test.yml`

