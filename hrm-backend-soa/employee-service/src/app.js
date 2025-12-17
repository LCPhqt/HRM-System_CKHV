const express = require('express');
const cors = require('cors');
const routes = require('./interfaces/http/routes');
const swaggerDocs = require('./interfaces/http/docs/swagger');
const errorMiddleware = require('./interfaces/http/middlewares/error.middleware');

const app = express();

// Middlewares nền tảng: CORS + parse JSON body
app.use(cors());
app.use(express.json());

// Tài liệu API tại /api/docs (Swagger UI)
app.use('/api/docs', swaggerDocs.serve, swaggerDocs.setup);
// Tất cả route nghiệp vụ nằm dưới /api
app.use('/api', routes);

// Xử lý lỗi cuối chuỗi middleware
app.use(errorMiddleware);

module.exports = app;
