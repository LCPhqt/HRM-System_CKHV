// Middleware cuối cùng: chuẩn hóa phản hồi lỗi
function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
}

module.exports = errorHandler;
