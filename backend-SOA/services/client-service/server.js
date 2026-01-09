require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDb = require("./src/config/db");
const customersRouter = require("./src/routes/customers");
const { setupSwagger } = require("./swagger");

// Lưu ý Windows: `localhost` đôi khi resolve sang IPv6 (::1) trong khi Mongo chỉ listen IPv4.
// Dùng 127.0.0.1 mặc định để tránh ECONNREFUSED ::1:27017.
const { PORT = 5007, MONGO_URL = "mongodb://127.0.0.1:27017/hrm-client" } = process.env;

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "client-service" }));

// Swagger UI
setupSwagger(app);

let dbReady = false;
// Nếu DB chưa sẵn sàng, trả 503 thay vì để gateway timeout/ECONNREFUSED khó debug
app.use("/client", (_req, res, next) => {
  if (dbReady) return next();
  return res.status(503).json({
    message:
      "Client database chưa sẵn sàng. Hãy khởi động MongoDB và cấu hình MONGO_URL (ưu tiên 127.0.0.1 trên Windows)."
  });
});

// Keep prefix consistent with gateway: gateway proxies /client -> service handles /client/*
app.use("/client/customers", customersRouter);

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

function startServer() {
  if (startServer.started) return;
  startServer.started = true;

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Client service listening on port ${PORT}`);
  });
}
startServer.started = false;

let connecting = false;
async function connectWithRetry() {
  if (dbReady || connecting) return;
  connecting = true;
  try {
    await connectDb(MONGO_URL);
    dbReady = true;
    // eslint-disable-next-line no-console
    console.log("Client database connected");
  } catch (err) {
    dbReady = false;
    // eslint-disable-next-line no-console
    console.error("Client database connection failed:", err?.message || err);
    setTimeout(connectWithRetry, 5000);
  } finally {
    connecting = false;
  }
}

// Start HTTP first to avoid gateway 504; DB sẽ retry đến khi sẵn sàng
startServer();
connectWithRetry();

