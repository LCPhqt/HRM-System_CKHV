const logger = require('../../../shared/logger');

// Chuẩn hóa phản hồi lỗi JSON
const errorMiddleware = (err, req, res, _next) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal Server Error';

  if (status >= 500) {
    logger.error(err);
  } else {
    logger.warn(err);
  }

  res.status(status).json({
    error: {
      code,
      message,
      details: err.details,
    },
  });
};

module.exports = errorMiddleware;
