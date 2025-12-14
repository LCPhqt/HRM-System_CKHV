import { useAuth } from "../providers/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { updateProfile as updateProfileApi } from "../api/auth";
import { useMemo } from "react";
import { Link } from "react-router-dom";

export default function DashboardEmployee() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));

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

  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(weekStart, i));
    }
    return dates;
  }, [weekStart]);

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
          <Link
            className={`nav-item ${location.pathname === "/employee" ? "active" : ""}`}
            to="/employee"
          >
            Trang chủ
          </Link>
          <Link
            className={`nav-item ${
              location.pathname === "/employee/schedule" ? "active" : ""
            }`}
            to="/employee/schedule"
          >
            Lịch làm việc
          </Link>
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
                {editing ? "Đóng" : "✏️ Chỉnh sửa"}
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

        {/* Lịch làm việc */}
        <section className="panel schedule-panel">
          <div className="schedule-header">
            <button
              className="nav-arrow"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              aria-label="Tuần trước"
            >
              ❮
            </button>
            <div className="schedule-title">
              Tuần: {formatDate(weekStart)} - {formatDate(addDays(weekStart, 6))}
            </div>
            <button
              className="nav-arrow"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              aria-label="Tuần sau"
            >
              ❯
            </button>
          </div>
          <div className="schedule-grid">
            {weekDates.map((d) => {
              const s = getScheduleForDate(d, mockSchedules, user);
              const isTodayFlag = isToday(d);
              return (
                <div
                  key={d.toISOString()}
                  className={`schedule-card ${isTodayFlag ? "today" : ""}`}
                >
                  <div className="schedule-day">
                    <div className="schedule-weekday">
                      {d.getDay() === 0 ? "CN" : `Th ${d.getDay()}`}
                    </div>
                    <div className="schedule-date">
                      {pad2(d.getDate())}-{pad2(d.getMonth() + 1)}
                    </div>
                  </div>
                  {isTodayFlag && <div className="schedule-badge">Hôm nay</div>}
                  <div className="schedule-status">{s?.status || "Nghỉ"}</div>
                  {s?.note && <div className="schedule-note">{s.note}</div>}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

// Helpers
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay() === 0 ? 7 : d.getDay(); // Monday first
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDate(d) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function isToday(d) {
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

// Mock lịch làm việc (có thể thay bằng API sau này)
const mockSchedules = [
  { email: "1@gmail.com", date: "2025-12-15", status: "Đi làm", note: "Ca sáng 8:00-12:00" },
  { email: "1@gmail.com", date: "2025-12-16", status: "Nghỉ", note: "Nghỉ phép" },
  { email: "1@gmail.com", date: "2025-12-17", status: "Đi làm", note: "Ca chiều 13:00-17:00" },
  { email: "1@gmail.com", date: "2025-12-18", status: "Đi làm", note: "Ca sáng 8:00-12:00" },
  { email: "1@gmail.com", date: "2025-12-19", status: "Đi làm", note: "Ca chiều 13:00-17:00" },
];

function getScheduleForDate(date, schedules, user) {
  const iso = date.toISOString().slice(0, 10);
  return schedules.find(
    (s) => s.date === iso && (!user?.email || s.email === user.email)
  );
}

