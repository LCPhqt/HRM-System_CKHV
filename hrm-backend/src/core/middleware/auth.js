const jwt = require("jsonwebtoken");

// Kiểm tra JWT từ header Authorization và gắn thông tin user vào req
function authGuard(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    return next(err);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
    };
    return next();
  } catch (error) {
    const err = new Error("Invalid or expired token");
    err.statusCode = 401;
    return next(err);
  }
}

// Kiểm tra quyền đơn giản: cần ít nhất một role phù hợp
function requireRoles(roles = []) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const allowed = roles.some((r) => userRoles.includes(r));
    if (!allowed) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      return next(err);
    }
    return next();
  };
}

module.exports = { authGuard, requireRoles };

