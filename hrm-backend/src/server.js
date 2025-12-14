require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

const { connectMongo } = require("./core/db/mongo");
const errorHandler = require("./core/middleware/errorHandler");
const authRouter = require("./modules/auth/auth.router");
const employeeRouter = require("./modules/employee/employee.router");
const { seedAdminFromEnv } = require("./modules/auth/adminSeed");

const app = express();

// Middleware toàn cục
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

// Kiểm tra tình trạng service
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "HRM API is running 🚀" });
});

// Đăng ký router cho từng module
app.use("/api/auth", authRouter);
app.use("/api/employees", employeeRouter);

// Trả về 404 cho đường dẫn không khớp
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Not found" });
});

// error handler cuối cùng
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  await connectMongo(process.env.MONGODB_URI);
  await seedAdminFromEnv();

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

start();
