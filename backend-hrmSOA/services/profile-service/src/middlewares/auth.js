const jwt = require("jsonwebtoken");

//  Ưu tiên secret giống identity-service
// (bạn đặt env này giống bên identity-service là chuẩn nhất)
const JWT_SECRET =
  process.env.ACCESS_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  process.env.SECRET ||
  "dev_secret";

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    //  normalize user object để các service dùng chung
    req.user = {
      id: payload.id || payload.userId || payload.user_id || payload.sub,
      email: payload.email,
      role: payload.role || payload.type || payload.user_role || "staff",
      ...payload, // giữ lại field gốc nếu cần
    };

    if (!req.user.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    //  chỉ check role ở đây, không can thiệp requireAuth
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
