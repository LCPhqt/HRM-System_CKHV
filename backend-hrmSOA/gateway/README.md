cách chạy gateway

```
cd backend-hrmSOA/gateway
npm install
npm run dev
```

ENV cần có (tệp `.env`):
```
PORT=4000
IDENTITY_SERVICE_URL=http://localhost:5001
PROFILE_SERVICE_URL=http://localhost:5002
ADMIN_HR_SERVICE_URL=http://localhost:5003
PAYROLL_SERVICE_URL=http://localhost:5004
DEPARTMENT_SERVICE_URL=http://localhost:5006
```

Chạy từng service tương ứng với các URL trên trước khi khởi động gateway.