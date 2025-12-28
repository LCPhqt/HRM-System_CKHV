const jwt = require("jsonwebtoken");

const { JWT_SECRET = "secret" } = process.env;

function verify(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { verify };

