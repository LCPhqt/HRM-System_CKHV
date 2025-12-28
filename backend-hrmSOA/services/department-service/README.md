# Department Service

Service quản lý phòng ban (SOA).

## Chạy dev
```
npm install
npm run dev
```

Env mẫu (`.env`):
```
PORT=5006
MONGO_URL=mongodb://localhost:27017/hrm-department
JWT_SECRET=change_me
```

## API chính
- `GET /departments` (auth staff/admin)
- `GET /departments/:id` (auth staff/admin)
- `POST /departments` (admin) — body: `name` (bắt buộc), `code?`, `parentId?`, `location?`, `manager?`, `staffCount?`, `description?`, `status?`
- `PUT /departments/:id` (admin)
- `DELETE /departments/:id` (admin)

## Ghi chú
- `name` và `code` phải duy nhất.
- `status` mặc định `active`.

