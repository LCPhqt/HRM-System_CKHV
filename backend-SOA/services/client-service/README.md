# Client Service (Customers MVP)

Service Client độc lập theo kiến trúc SOA của dự án HRM.

## Chạy service

```bash
cd backend-SOA/services/client-service
npm i
npm run dev
```

## Biến môi trường (gợi ý)

- `PORT`: mặc định `5007`
- `MONGO_URL`: mặc định `mongodb://127.0.0.1:27017/hrm-client` (tránh lỗi IPv6 `::1` trên Windows)
- `JWT_SECRET` (hoặc `ACCESS_TOKEN_SECRET` / `SECRET`): nên đặt giống identity-service để verify token OK.

## Swagger UI

Truy cập: http://localhost:5007/api-docs

## Endpoints (MVP)

- `GET /health`
- `GET /client/customers?search=&status=&ownerId=&page=&limit=`
- `GET /client/customers/:id`
- `POST /client/customers/import` (nhập danh sách từ file sau khi frontend parse JSON/CSV)
- `POST /client/customers` (mặc định **admin**)
- `PUT /client/customers/:id` (mặc định **admin**)
- `DELETE /client/customers/:id` (mặc định **admin**)

## File mẫu để import

- `samples/customers_100_vn.csv`

