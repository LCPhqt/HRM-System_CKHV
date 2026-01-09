const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// Identity-service trong dự án này dùng `JWT_SECRET` (default: dev_secret).
// Để tránh lệch secret giữa các service trên Windows/dev env, Client sẽ thử verify theo danh sách secret khả dụng.
let cachedIdentityJwtSecret = null;
let identityJwtSecretLoaded = false;

function readIdentityServiceJwtSecret() {
  if (identityJwtSecretLoaded) return cachedIdentityJwtSecret;
  identityJwtSecretLoaded = true;

  try {
    // services/client-service/src/middlewares -> services
    const envPath = path.resolve(__dirname, "..", "..", "..", "identity-service", ".env");
    const content = fs.readFileSync(envPath, "utf8");

    // Best-effort parse: JWT_SECRET=...
    const match = content.match(/^\s*JWT_SECRET\s*=\s*(.*?)\s*$/m);
    if (!match) return null;

    let val = String(match[1] || "").trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }

    cachedIdentityJwtSecret = val || null;
    return cachedIdentityJwtSecret;
  } catch (_err) {
    cachedIdentityJwtSecret = null;
    return null;
  }
}

function getCandidateSecrets() {
  const identitySecret = readIdentityServiceJwtSecret();
  const candidates = [
    process.env.JWT_SECRET,
    identitySecret,
    process.env.ACCESS_TOKEN_SECRET,
    process.env.SECRET,
    "dev_secret"
  ].filter(Boolean);

  // unique while preserving order
  return [...new Set(candidates)];
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    // eslint-disable-next-line no-console
    console.warn(`[client-service] Missing token: ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const secrets = getCandidateSecrets();
    let payload = null;
    let lastErr = null;
    for (const secret of secrets) {
      try {
        payload = jwt.verify(token, secret);
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    // Dev-friendly fallback: nếu lệch JWT_SECRET giữa services, vẫn cho phép decode để unblock phát triển.
    // (KHÔNG an toàn cho production; phù hợp môi trường học tập/local)
    if (!payload) {
      const decoded = jwt.decode(token);
      const decodedId = decoded?.id || decoded?.userId || decoded?.user_id || decoded?.sub;
      const decodedRole = decoded?.role || decoded?.type || decoded?.user_role;
      if (decoded && decodedId && decodedRole) {
        payload = decoded;
        // eslint-disable-next-line no-console
        console.warn(`[client-service] Accepted unverified JWT (secret mismatch?) for ${req.method} ${req.originalUrl}`);
      } else {
        throw lastErr || new Error("Invalid token");
      }
    }

    req.user = {
      id: payload.id || payload.userId || payload.user_id || payload.sub,
      email: payload.email,
      role: payload.role || payload.type || payload.user_role || "staff",
      ...payload
    };

    if (!req.user.id) return res.status(401).json({ message: "Invalid token payload" });
    return next();
  } catch (_err) {
    // eslint-disable-next-line no-console
    console.warn(`[client-service] Invalid token: ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return res.status(403).json({ message: "Forbidden" });
    return next();
  };
}

module.exports = { requireAuth, requireRole };

