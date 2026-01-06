# Quản Lý Bug - Automation Tests

## Dashboard

| Tổng số bug | Đang mở | Đã fix | Đang fix | Đã đóng |
|------------|---------|--------|----------|---------|
| 4 | 3 | 1 | 0 | 0 |

---

##  Danh Sách Bug

### Bug #BUG-001: MongoDB Connection Timeout trong Backend Tests

| Thông tin | Chi tiết |
|-----------|----------|
| **ID** | BUG-001 |
| **Tiêu đề** | MongoDB Connection Timeout trong Backend Tests |
| **Severity** |  HIGH |
| **Priority** | P0 - Critical |
| **Status** |  Open |
| **Assignee** | - |
| **Reporter** | AI Assistant |
| **Ngày tạo** | Hôm nay |
| **Ngày cập nhật** | Hôm nay |
| **File liên quan** | `test-hrmSOA/backend/identity-service/__tests__/authController.test.js` |
| **Test Cases ảnh hưởng** | 10/13 backend tests (77%) |

#### Mô tả
Backend tests bị lỗi "buffering timed out" do MongoDB connection chưa sẵn sàng khi models được load.

#### Lỗi
```
Operation users.findOne() buffering timed out after 10000ms
Operation users.insertOne() buffering timed out after 10000ms
```

---

### Bug #BUG-002: Alert Handling Không Ổn Định trong Frontend Tests

| Thông tin | Chi tiết |
|-----------|----------|
| **ID** | BUG-002 |
| **Tiêu đề** | Alert Handling Không Ổn Định trong Frontend Tests |
| **Severity** |  MEDIUM |
| **Priority** | P1 - High |
| **Status** |  Open (có workaround) |
| **Assignee** | - |
| **Reporter** | AI Assistant |
| **Ngày tạo** | Hôm nay |
| **Ngày cập nhật** | Hôm nay |
| **File liên quan** | `test-hrmSOA/frontend/ui/staff-customer.test.js` |
| **Test Cases ảnh hưởng** | Frontend login/register tests |

#### Mô tả
Frontend tests gặp lỗi "unexpected alert open" khi xử lý alert dialog, đặc biệt là khi đăng nhập/đăng ký.

#### Lỗi
```
unexpected alert open: {Alert text : Sai mật khẩu hoặc tài khoản}
```

---

### Bug #BUG-003: Element Finding Không Chính Xác (XPath Selectors)

| Thông tin | Chi tiết |
|-----------|----------|
| **ID** | BUG-003 |
| **Tiêu đề** | Element Finding Không Chính Xác (XPath Selectors) |
| **Severity** |  MEDIUM |
| **Priority** | P1 - High |
| **Status** |  Open (partial fix) |
| **Assignee** | - |
| **Reporter** | AI Assistant |
| **Ngày tạo** | Hôm nay |
| **Ngày cập nhật** | Hôm nay |
| **File liên quan** | `test-hrmSOA/frontend/ui/staff-customer.test.js` |
| **Test Cases ảnh hưởng** | Frontend form tests |

#### Mô tả
Một số test fail do không tìm thấy elements, đặc biệt là khi form chuyển đổi giữa login/register mode.

#### Lỗi
```
Should have 2 password inputs (password and confirm password) but only found 1
```

---

### Bug #BUG-004: Export Excel Không Có Thông Báo Khi Danh Sách Rỗng

| Thông tin | Chi tiết |
|-----------|----------|
| **ID** | BUG-004 |
| **Tiêu đề** | Export Excel Không Có Thông Báo Khi Danh Sách Rỗng |
| **Severity** |  MEDIUM |
| **Priority** | P2 - Medium |
| **Status** |  Fixed (đã thêm validation) |
| **Assignee** | - |
| **Reporter** | AI Assistant |
| **Ngày tạo** | Hôm nay |
| **Ngày cập nhật** | Hôm nay (đã fix) |
| **File liên quan** | `frontend-hrmSOA/src/pages/StaffCustomersPage.jsx`, `frontend-hrmSOA/src/pages/CRMPage.jsx` |
| **Test Cases ảnh hưởng** | 3 test cases (1 cần cập nhật, 2 không bị ảnh hưởng) |

#### Mô tả
Khi nhân viên bấm nút "Xuất Excel" nhưng danh sách khách hàng đang rỗng, hệ thống vẫn tải file Excel xuống (file rỗng hoặc chỉ có header) mà không có thông báo hoặc hướng dẫn người dùng thêm khách hàng trước.

#### Kết quả hiện tại (trước khi fix)
- File Excel được tải xuống ngay cả khi danh sách rỗng
- File chỉ có header, không có dữ liệu
- Không có thông báo cho người dùng

#### Kết quả mong đợi (đã đạt được)
- Hiển thị thông báo: "Danh sách khách hàng đang trống. Vui lòng thêm khách hàng trước khi xuất file."
- Hoặc disable nút "Xuất Excel" khi danh sách rỗng
- Hoặc hiển thị modal hướng dẫn thêm khách hàng

---

##  Thống Kê Bug

### Theo Severity
-  HIGH: 1 bug (25%)
-  MEDIUM: 3 bugs (75%)
-  LOW: 0 bug (0%)

### Theo Status
-  Open: 2 bugs (50%)
-  Open (có workaround): 2 bugs (50%)
-  Fixed: 1 bug (25%) - BUG-004
-  In Progress: 0 bug (0%)

### Theo Priority
- P0 - Critical: 1 bug (25%)
- P1 - High: 2 bugs (50%)
- P2 - Medium: 1 bug (25%)

---

##  Roadmap Fix Bug

### Sprint 1 (Ưu tiên cao)
- [ ] **BUG-001**: MongoDB Connection Timeout
  - Ước tính: 4-6 giờ
  - Impact: Fix được 77% backend tests

### Sprint 2 (Ưu tiên trung bình)
- [ ] **BUG-002**: Alert Handling
  - Ước tính: 2-3 giờ
  - Impact: Cải thiện stability của frontend tests

- [ ] **BUG-003**: Element Finding
  - Ước tính: 2-3 giờ
  - Impact: Cải thiện stability của form tests

### Sprint 3 (Ưu tiên thấp)
- [x] **BUG-004**: Export Excel khi danh sách rỗng
  - Ước tính: 1-2 giờ
  - Impact: Cải thiện UX
  - Status:  Đã fix - đã thêm validation vào CRMPage.jsx và StaffCustomersPage.jsx

---

##  Template Bug Report

```markdown
### Bug #[ID]

| Thông tin | Chi tiết |
|-----------|----------|
| **ID** | BUG-XXX |
| **Tiêu đề** | [Tiêu đề bug] |
| **Severity** |  HIGH /  MEDIUM /  LOW |
| **Priority** | P0-P3 |
| **Status** |  Open /  In Progress /  Fixed |
| **Assignee** | [Người được giao] |
| **Reporter** | [Người báo bug] |
| **Ngày tạo** | [Ngày] |
| **Ngày cập nhật** | [Ngày] |
| **File liên quan** | [Đường dẫn file] |

#### Mô tả
[Chi tiết bug]

#### Lỗi
[Error message hoặc screenshot]

#### Nguyên nhân
[Phân tích nguyên nhân]

#### Giải pháp đề xuất
[Giải pháp]

#### Test Cases ảnh hưởng
[List test cases]

#### Ghi chú
[Ghi chú thêm]
```

