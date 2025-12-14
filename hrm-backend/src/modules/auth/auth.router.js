const express = require("express");
const { register, login, refresh, updateProfile } = require("./auth.controller");
const { authGuard } = require("../../core/middleware/auth");

const router = express.Router();

// Các route công khai cho auth
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.patch("/profile", authGuard, updateProfile);

module.exports = router;

