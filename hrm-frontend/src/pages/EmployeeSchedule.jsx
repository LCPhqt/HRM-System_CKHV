import { useAuth } from "../providers/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function EmployeeSchedule() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));

  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) dates.push(addDays(weekStart, i));
    return dates;
  }, [weekStart]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
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
          <Link className={`nav-item ${location.pathname === "/employee" ? "active" : ""}`} to="/employee">
            Trang chủ
          </Link>
          <Link
            className={`nav-item ${location.pathname === "/employee/schedule" ? "active" : ""}`}
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
                <div key={d.toISOString()} className={`schedule-card ${isTodayFlag ? "today" : ""}`}>
                  <div className="schedule-day">
                    <div className="schedule-weekday">{d.getDay() === 0 ? "CN" : `Th ${d.getDay()}`}</div>
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

// Helpers và mock
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay() === 0 ? 7 : d.getDay();
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
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

const mockSchedules = [
  { email: "1@gmail.com", date: "2025-12-15", status: "Nghỉ", note: "" },
  { email: "1@gmail.com", date: "2025-12-16", status: "Nghỉ", note: "" },
  { email: "1@gmail.com", date: "2025-12-17", status: "Nghỉ", note: "" },
  { email: "1@gmail.com", date: "2025-12-18", status: "Nghỉ", note: "" },
  { email: "1@gmail.com", date: "2025-12-19", status: "Nghỉ", note: "" },
  { email: "1@gmail.com", date: "2025-12-20", status: "Nghỉ", note: "" },
  { email: "1@gmail.com", date: "2025-12-21", status: "Nghỉ", note: "" },
];

function getScheduleForDate(date, schedules, user) {
  const iso = date.toISOString().slice(0, 10);
  return schedules.find((s) => s.date === iso && (!user?.email || s.email === user.email));
}

