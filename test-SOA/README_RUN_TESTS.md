# Hướng dẫn Chạy Tests Tự động

## 🚀 Cách 1: Sử dụng Script PowerShell (Khuyến nghị)

### Chạy tất cả tests (Backend + Frontend):
```powershell
cd C:\Users\OS\Duan-tLam\test-hrmSOA
.\start-services-and-test.ps1
```

### Chạy riêng từng loại:
```powershell
# Chỉ Backend Unit Tests
.\start-services-and-test.ps1 backend

# Chỉ Frontend UI Tests (Login/Register)
.\start-services-and-test.ps1 frontend

# Chỉ Admin Search & Filter Tests
.\start-services-and-test.ps1 admin

# Chỉ Navigation Tests
.\start-services-and-test.ps1 navigation

# Tất cả UI Tests
.\start-services-and-test.ps1 all-ui
```

### Dừng services sau khi test:
```powershell
.\stop-services.ps1
```

## 📋 Cách 2: Chạy thủ công

### Bước 1: Khởi động Services

**Terminal 1 - Identity Service:**
```powershell
cd C:\Users\OS\Duan-tLam\backend-hrmSOA\services\identity-service
npm start
```

**Terminal 2 - Admin HR Service:**
```powershell
cd C:\Users\OS\Duan-tLam\backend-hrmSOA\services\admin-hr-service
npm start
```

**Terminal 3 - Gateway:**
```powershell
cd C:\Users\OS\Duan-tLam\backend-hrmSOA\gateway
npm start
```

**Terminal 4 - Frontend (cho UI tests):**
```powershell
cd C:\Users\OS\Duan-tLam\frontend-hrmSOA
npm run dev
```

### Bước 2: Chạy Tests

**Terminal 5 - Backend Tests:**
```powershell
cd C:\Users\OS\Duan-tLam\test-hrmSOA\backend\identity-service
npm test
```

**Terminal 6 - Frontend UI Tests:**
```powershell
cd C:\Users\OS\Duan-tLam\test-hrmSOA
npm run test:frontend    # Login/Register
npm run test:admin       # Admin Search & Filter
npm run test:navigation  # Navigation tests
npm run test:all-ui      # Tất cả UI tests
```

## ⚙️ Yêu cầu

- Node.js 18+
- MongoDB đang chạy (hoặc mongodb-memory-server sẽ tự động khởi động)
- Chrome browser (cho UI tests)
- PowerShell (cho scripts)

## 👀 Xem Browser khi Test chạy

**Mặc định browser sẽ hiển thị** để bạn quan sát quá trình test và tìm lỗi.

Nếu muốn chạy ở chế độ headless (không hiển thị browser):
```powershell
$env:HEADLESS = "true"
npm run test:frontend
```

## 🔧 Troubleshooting

### Services không khởi động:
- Kiểm tra ports: 4000, 5001, 5003 có đang được sử dụng không
- Kiểm tra dependencies: `npm install` trong mỗi service folder

### Tests fail:
- Đảm bảo tất cả services đã khởi động hoàn toàn (đợi 5-10 giây)
- Kiểm tra MongoDB đang chạy
- Kiểm tra frontend server đang chạy (cho UI tests)
- **Quan sát browser** để thấy lỗi cụ thể

### Browser không hiển thị:
- Đảm bảo không set `HEADLESS=true`
- Kiểm tra Chrome đã được cài đặt
- Thử chạy lại với: `$env:HEADLESS = $null; npm run test:frontend`

### Dừng tất cả services:
```powershell
.\stop-services.ps1
```

