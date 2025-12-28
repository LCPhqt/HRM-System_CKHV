require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDb = require("./src/config/db");
const departmentsRouter = require("./src/routes/departments");

const {
  PORT = 5006,
  MONGO_URL = "mongodb://localhost:27017/hrm-department",
} = process.env;

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "department-service" }));

app.use("/departments", departmentsRouter);

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

connectDb(MONGO_URL).then(() => {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Department service listening on port ${PORT}`);
  });
});

