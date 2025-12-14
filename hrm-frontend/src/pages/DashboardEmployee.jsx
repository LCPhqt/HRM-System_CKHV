import { useAuth } from "../providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { updateProfile as updateProfileApi } from "../api/auth";

export default function DashboardEmployee() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const deriveNameFromEmail = (email) => {
    if (!email) return "";
    const local = email.split("@")[0] || "";
    return local
      .split(/[.\-_]/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Dữ liệu giả lập (placeholder) cho giao diện nhân viên
  const stats = [
    { label: "Công tháng này", value: 0, suffix: "Ngày đi làm" },
    { label: "Đi trễ", value: 0, suffix: "Lần" },
    { label: "Vắng", value: 0, suffix: "Ngày" },
    { label: "Đơn chờ duyệt", value: 1, suffix: "Đơn" },
  ];

  const name = user?.fullName || deriveNameFromEmail(user?.email) || "Người dùng";
  const [profile, setProfile] = useState({
    name,
    email: user?.email || "Đang cập nhật",
    position: user?.position || "Đang cập nhật",
    department: user?.department || "Đang cập nhật",
    phone: user?.phone || "",
    roles: (user?.roles || []).join(", ") || "Nhân viên",
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        fullName: profile.name,
        phone: profile.phone,
        position: profile.position,
        department: profile.department,
      };
      const res = await updateProfileApi(payload);
      if (res?.user) {
        setProfile((prev) => ({
          ...prev,
          name: res.user.fullName || prev.name,
          phone: res.user.phone || prev.phone,
          position: res.user.position || prev.position,
          department: res.user.department || prev.department,
          roles: (res.user.roles || []).join(", ") || prev.roles,
          email: res.user.email || prev.email,
        }));
        updateUser(res.user);
      }
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="employee-layout">
      <aside className="employee-sidebar">
        <div className="brand">
          <div className="brand-logo">HR</div>
          <div className="brand-text">
            <div className="brand-title">HR System</div>
            <div className="brand-sub">Nhân viên</div>
          </div>
        </div>
        <nav className="nav">
          <button className="nav-item active">Trang chủ</button>
          <button className="nav-item">Lịch làm việc</button>
          <button className="nav-item">Chấm công</button>
          <button className="nav-item">Đơn nghỉ phép</button>
          <button className="nav-item">Bảng lương</button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="employee-main">
        <header className="employee-header">
          <div>
            <h1>Trang chủ</h1>
            <p>Xin chào, {profile.name}</p>
          </div>
          <div className="avatar-chip">
            <div className="avatar-circle">{profile.name?.[0] || "N"}</div>
            <div className="avatar-meta">
              <div className="avatar-name">{profile.name}</div>
              <div className="avatar-role">{profile.position}</div>
            </div>
          </div>
        </header>

        <section className="stat-grid stat-large">
          {stats.map((item) => (
            <div key={item.label} className="stat-card employee">
              <div className="stat-label">{item.label}</div>
              <div className="stat-value">{item.value}</div>
              <div className="stat-suffix">{item.suffix}</div>
            </div>
          ))}
        </section>

        <section className="content-grid employee-two">
          <div className="panel">
            <h3>Chấm công hôm nay</h3>
            <div className="empty-box">
              <div className="icon-placeholder">📅</div>
              <p>Bạn không có lịch làm việc hôm nay</p>
            </div>
          </div>

          <div className="panel info-panel">
            <div className="panel-header">
              <h3>Thông tin cá nhân</h3>
              <button className="link-btn" onClick={() => setEditing((v) => !v)}>
                {editing ? "Đóng" : "Chỉnh sửa"}
              </button>
            </div>

            {!editing && (
              <div className="info-list table-style">
                <div className="info-row">
                  <span>Họ tên:</span>
                  <strong>{profile.name}</strong>
                </div>
                <div className="info-row">
                  <span>Email:</span>
                  <strong>{profile.email}</strong>
                </div>
                <div className="info-row">
                  <span>Vị trí:</span>
                  <strong>{profile.position}</strong>
                </div>
                <div className="info-row">
                  <span>Phòng ban:</span>
                  <strong>{profile.department}</strong>
                </div>
                <div className="info-row">
                  <span>Số điện thoại:</span>
                  <strong>{profile.phone || "Chưa cập nhật"}</strong>
                </div>
                <div className="info-row">
                  <span>Vai trò:</span>
                  <strong className="badge">{profile.roles}</strong>
                </div>
              </div>
            )}

            {editing && (
              <form className="info-form" onSubmit={handleSaveProfile}>
                <label>
                  Họ tên
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </label>
                <label>
                  Email
                  <input type="email" value={profile.email} readOnly />
                </label>
                <label>
                  Vị trí
                  <input
                    type="text"
                    value={profile.position}
                    onChange={(e) =>
                      setProfile({ ...profile, position: e.target.value })
                    }
                  />
                </label>
                <label>
                  Phòng ban
                  <input
                    type="text"
                    value={profile.department}
                    onChange={(e) =>
                      setProfile({ ...profile, department: e.target.value })
                    }
                  />
                </label>
                <label>
                  Số điện thoại
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </label>
                <div className="form-actions">
                  <button type="button" onClick={() => setEditing(false)}>
                    Hủy
                  </button>
                  <button type="submit" disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
                <p className="hint">Thay đổi sẽ lưu vào hồ sơ tài khoản của bạn.</p>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

