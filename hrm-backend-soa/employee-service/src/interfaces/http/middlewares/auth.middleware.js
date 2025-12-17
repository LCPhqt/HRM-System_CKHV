const jwt = require('jsonwebtoken');
const config = require('../../../config/env');
const AppError = require('../../../shared/AppError');
const logger = require('../../../shared/logger');

// Middleware bảo vệ API: xác thực JWT, cho bypass khi dev chưa set key
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  // Dev bypass: nếu chưa cấu hình JWT_PUBLIC_KEY và không gửi token, cho qua.
  if (!token && !config.jwtPublicKey) {
    logger.warn('JWT_PUBLIC_KEY not set and no token provided; bypassing auth (dev only).');
    req.user = { sub: 'dev-bypass' };
    return next();
  }

  if (!token) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }

  try {
    const payload = jwt.verify(token, config.jwtPublicKey);
    req.user = payload;
    return next();
  } catch (err) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }
};

module.exports = authMiddleware;
