const bcrypt = require("bcryptjs");
const User = require("./auth.model");

async function seedAdminFromEnv() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const roles = process.env.ADMIN_ROLES
    ? process.env.ADMIN_ROLES.split(",").map((r) => r.trim()).filter(Boolean)
    : ["admin"];
  const forceReset = String(process.env.ADMIN_FORCE_RESET || "").toLowerCase() === "true";

  if (!email || !password) {
    console.log("ℹ️ ADMIN_EMAIL/ADMIN_PASSWORD không được set, bỏ qua seed admin");
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (forceReset) {
      const passwordHash = await bcrypt.hash(password, 10);
      existing.passwordHash = passwordHash;
      existing.roles = roles.length ? roles : ["admin"];
      await existing.save();
      console.log(`✅ Cập nhật lại mật khẩu/role cho admin: ${email}`);
    } else {
      console.log("ℹ️ Admin đã tồn tại, bỏ qua seed (bật ADMIN_FORCE_RESET=true để ghi đè)");
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    email,
    passwordHash,
    roles: roles.length ? roles : ["admin"],
  });
  console.log(`✅ Seed admin thành công cho email: ${email}`);
}

module.exports = { seedAdminFromEnv };

