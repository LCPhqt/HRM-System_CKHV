import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import StaffSidebar from "../components/StaffSidebar";

function HomePage() {
  const { user, role, client, token } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]); // admin only
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerCount, setCustomerCount] = useState(0);
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    active: 0,
    lead: 0,
    inactive: 0,
    other: 0,
  });

  //  routes theo role
  const employeesPath = role === "admin" ? "/admin" : "/staff/employees";
  const departmentsPath = role === "admin" ? "/departments" : "/staff/departments";
  const customersPath = role === "admin" ? "/crm" : "/staff/customers";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const depRes = await client.get("/departments");
        setDepartments(depRes.data || []);

        //  chỉ admin mới gọi danh sách nhân viên full
        if (role === "admin") {
          const empRes = await client.get("/admin/employees");
          setEmployees(empRes.data || []);
        } else {
          setEmployees([]); // staff không dùng list này
        }

        //  CRM: thống kê trạng thái (role-sensitive, staff chỉ thấy của mình)
        try {
          const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
          const statsRes = await client.get("/crm/customers/stats", { headers: authHeaders });
          const stats = statsRes.data || {};

          // fallback tính lại từ danh sách (tối đa 500) để bảo đảm khớp hiển thị
          const listRes = await client.get("/crm/customers", {
            params: { page: 1, limit: 500 },
            headers: authHeaders,
          });
          const items = Array.isArray(listRes.data) ? listRes.data : [];
          const recompute = (arr) =>
            arr.reduce(
              (acc, c) => {
                const status = String(c?.status || "").trim().toLowerCase();
                if (status === "inactive" || status.includes("ngung")) acc.inactive += 1;
                else if (status === "active" || status.includes("đang hoạt động")) acc.active += 1;
                else if (status === "lead" || status.includes("tiềm năng")) acc.lead += 1;
                else acc.other += 1;
                acc.total += 1;
                return acc;
              },
              { total: 0, active: 0, lead: 0, inactive: 0, other: 0 }
            );

          const fallbackStats = recompute(items);
          const normalized = {
            total: Number(fallbackStats.total || stats.total || 0),
            active: Number(fallbackStats.active || stats.active || 0),
            lead: Number(fallbackStats.lead || stats.lead || 0),
            inactive: Number(fallbackStats.inactive || stats.inactive || 0),
            other: Number(fallbackStats.other || stats.other || 0),
          };

          setCustomerStats(normalized);
          setCustomerCount(normalized.total);
        } catch (err) {
          console.warn("Cannot load customer stats", err?.response?.data || err?.message || err);
          setCustomerStats({ total: 0, active: 0, lead: 0, inactive: 0, other: 0 });
          setCustomerCount(0);
        }
      } catch (err) {
        console.error(err);
        setEmployees([]);
        setDepartments([]);
        setCustomerCount(0);
        setCustomerStats({ total: 0, active: 0, lead: 0, inactive: 0, other: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [client, role, token]);

  //  totalDepartments luôn lấy từ departments
  const totalDepartments = departments.length;

  //  totalEmployees:
  // - admin: đếm employees
  // - staff: cộng staffCount của các phòng ban (lấy từ admin tạo)
  const totalEmployees = useMemo(() => {
    if (role === "admin") return employees.length;

    const sum = (departments || []).reduce((acc, dep) => {
      const v = dep?.staffCount ?? 0;
      return acc + Number(v || 0);
    }, 0);

    return sum;
  }, [role, employees, departments]);

  //  staff không xem lương
  const avgSalary = useMemo(() => {
    if (role !== "admin") return 0;

    const salaries = employees
      .map((e) => e.profile?.salary ?? e.salary)
      .filter((v) => v !== undefined && v !== null && v !== "");

    if (!salaries.length) return 0;
    const sum = salaries.reduce((a, b) => a + Number(b || 0), 0);
    return Math.round(sum / salaries.length);
  }, [employees, role]);

  //  deptStats:
  // - admin: thống kê từ employees (chuẩn)
  // - staff: thống kê theo staffCount từng phòng ban (chuẩn view-only)
  const deptStats = useMemo(() => {
    if (role === "admin") {
      const counter = new Map();
      employees.forEach((e) => {
        const dep = e.department || e.profile?.department || "Chưa phân";
        counter.set(dep, (counter.get(dep) || 0) + 1);
      });
      const arr = Array.from(counter.entries());
      arr.sort((a, b) => b[1] - a[1]);
      return arr;
    }

    const arr = (departments || []).map((d) => [
      d?.name || "Chưa phân",
      Number(d?.staffCount ?? 0),
    ]);
    arr.sort((a, b) => b[1] - a[1]);
    return arr;
  }, [role, employees, departments]);

  const maxDeptCount = useMemo(
    () => Math.max(1, ...deptStats.map(([, count]) => count)),
    [deptStats]
  );

  const formatCount = (v) =>
    Number(v || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 });

  const formatMoney = (v) =>
    Number(v || 0).toLocaleString("vi-VN", { minimumFractionDigits: 0 }) + " đ";

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  //  Chuẩn bị dữ liệu biểu đồ trạng thái
  const statusSegmentsAll = useMemo(() => {
    const total = Math.max(1, customerStats.total);
    const mk = (label, value, color) => ({
      label,
      value,
      color,
      percent: Math.round((value / total) * 100),
    });
    return [
      mk("Active", customerStats.active, "#10b981"),
      mk("Lead", customerStats.lead, "#f59e0b"),
      mk("Inactive", customerStats.inactive, "#94a3b8"),
      mk("Khác", customerStats.other, "#8b5cf6"),
    ];
  }, [customerStats]);

  //  Vẽ chart chỉ với segment > 0 để tránh stroke 0 length
  const statusSegmentsChart = useMemo(
    () => statusSegmentsAll.filter((s) => s.value > 0),
    [statusSegmentsAll]
  );

  const circumference = 2 * Math.PI * 60; // r=60 giống biểu đồ admin
  const cumulativeDash = (segments) => {
    let offset = 0;
    return segments.map((s) => {
      const length = (s.percent / 100) * circumference;
      const current = { ...s, length, offset };
      offset -= length;
      return current;
    });
  };

  return (
    <div className="h-screen bg-white text-slate-900 flex overflow-hidden">
      {role === "admin" ? <AdminSidebar /> : <StaffSidebar />}

      {/* Main */}
      <main className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="px-10 pt-8 pb-4 space-y-6">
          <header className="bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-500 text-white rounded-3xl p-8 shadow-xl">
            <p className="text-sm opacity-90 mb-1">
              Xin chào, {role === "admin" ? "Admin" : user?.email}
            </p>
            <h1 className="text-3xl font-bold">
              {role === "admin" ? "Hệ thống HRM & CRM" : "Quản lý Khách hàng"}
            </h1>
            <p className="mt-2 text-sm text-indigo-100">
              {role === "admin"
                ? "Tổng quan về tình hình nhân sự và quản lý khách hàng của công ty."
                : "Tổng quan về danh sách khách hàng bạn đang phụ trách."}
            </p>
          </header>

          {/* HRM Section - Chỉ Admin */}
          {role === "admin" && (
            <>
              <div className="mb-2">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-indigo-500">📊</span> Quản lý Nhân sự (HRM)
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 cursor-pointer hover:border-indigo-200 hover:shadow-md transition"
                  onClick={() => navigate(employeesPath)}
                >
                  <p className="text-sm text-slate-500">Tổng nhân sự</p>
                  <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 tracking-tight break-all leading-tight">
                    {formatCount(totalEmployees)}
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">↗ ổn định</p>
                </div>

                <div
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 cursor-pointer hover:border-indigo-200 hover:shadow-md transition"
                  onClick={() => navigate(departmentsPath)}
                >
                  <p className="text-sm text-slate-500">Phòng ban</p>
                  <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 tracking-tight break-all leading-tight">
                    {formatCount(totalDepartments)}
                  </div>
                  <p className="text-xs text-indigo-600 mt-1">Đang hoạt động</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <p className="text-sm text-slate-500">Quỹ lương tháng (ước tính)</p>
                  <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 tracking-tight break-words leading-tight">
                    {formatMoney(avgSalary * totalEmployees || 0)}
                  </div>
                  <p className="text-xs text-amber-600 mt-1">Tính từ lương trung bình</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <p className="text-sm text-slate-500">Lương trung bình</p>
                  <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 tracking-tight break-words leading-tight">
                    {formatMoney(avgSalary)}
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">Trên mỗi nhân viên</p>
                </div>
              </div>
            </>
          )}

          {/* CRM Section - Cả Admin và Staff */}
          <div className={role === "admin" ? "mt-6 mb-2" : "mb-2"}>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="text-purple-500">🤝</span> Quản lý Khách hàng (CRM)
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-200 shadow-sm p-6 cursor-pointer hover:border-purple-300 hover:shadow-md transition"
              onClick={() => navigate(customersPath)}
            >
              <p className="text-sm text-purple-600">Tổng khách hàng</p>
              <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 tracking-tight break-all leading-tight">
                {formatCount(customerCount)}
              </div>
              <p className="text-xs text-purple-500 mt-1">Xem danh sách →</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-200 shadow-sm p-6">
              <p className="text-sm text-emerald-600">Khách hàng mới</p>
              <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 tracking-tight break-all leading-tight">
                —
              </div>
              <p className="text-xs text-emerald-500 mt-1">Tháng này</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-200 shadow-sm p-6">
              <p className="text-sm text-amber-600">Đang chờ xử lý</p>
              <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 tracking-tight break-all leading-tight">
                —
              </div>
              <p className="text-xs text-amber-500 mt-1">Yêu cầu mới</p>
            </div>
          </div>

          {/* Biểu đồ - Admin */}
          {role === "admin" && (
            <div className="grid gap-6 xl:grid-cols-2">
              {/* Biểu đồ phân bổ nhân viên theo phòng ban */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500">Thống kê nhân sự</p>
                    <h3 className="text-xl font-bold text-slate-900">
                      Phân bổ nhân viên theo phòng ban
                    </h3>
                  </div>
                  <span className="text-sm text-indigo-600 cursor-default flex items-center gap-1">
                    Chi tiết <span className="text-base">↗</span>
                  </span>
                </div>
                {loading ? (
                  <p className="text-sm text-slate-500">Đang tải...</p>
                ) : (
                  <div className="relative h-64 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <div
                      className="absolute inset-4 rounded-xl pointer-events-none"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to top, transparent, transparent 38px, rgba(148,163,184,0.2) 39px, rgba(148,163,184,0.2) 40px)",
                      }}
                    />
                    <div className="relative h-full flex items-end justify-around gap-4">
                      {deptStats.length === 0 && (
                        <div className="text-sm text-slate-500">
                          Chưa có dữ liệu phân bổ phòng ban.
                        </div>
                      )}
                      {deptStats.slice(0, 5).map(([dep, count]) => (
                        <div key={dep} className="flex flex-col items-center gap-2">
                          <div
                            className="w-10 rounded-xl bg-indigo-500 shadow-lg shadow-indigo-200"
                            style={{
                              height: `${(count / maxDeptCount) * 80 + 30}px`,
                              minHeight: "30px",
                            }}
                            title={`${dep}: ${count}`}
                          />
                          <span className="text-xs text-slate-600 text-center w-16 leading-snug truncate">
                            {dep}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Biểu đồ tròn thống kê khách hàng (theo dữ liệu thực tế) */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-purple-500">Thống kê CRM</p>
                    <h3 className="text-xl font-bold text-slate-900">
                      Tổng quan khách hàng
                    </h3>
                  </div>
                  <span
                    className="text-sm text-purple-600 cursor-pointer flex items-center gap-1 hover:underline"
                    onClick={() => navigate(customersPath)}
                  >
                    Xem chi tiết <span className="text-base">↗</span>
                  </span>
                </div>
                <div className="relative h-64 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl p-4 flex items-center justify-center gap-6">
                  {/* Pie Chart SVG */}
                  <div className="relative">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="24"
                      />
                      {statusSegmentsChart.length > 0 ? (
                        cumulativeDash(statusSegmentsChart).map((seg, idx) => (
                          <circle
                            key={seg.label + idx}
                            cx="80"
                            cy="80"
                            r="60"
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="24"
                            strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                            strokeDashoffset={seg.offset}
                            transform="rotate(-90 80 80)"
                            className="transition-all duration-500"
                          />
                        ))
                      ) : null}
                      <text
                        x="80"
                        y="75"
                        textAnchor="middle"
                        className="fill-purple-600 text-2xl font-bold"
                        style={{ fontSize: "28px", fontWeight: "700" }}
                      >
                        {formatCount(customerStats.total)}
                      </text>
                      <text
                        x="80"
                        y="95"
                        textAnchor="middle"
                        className="fill-slate-500 text-xs"
                        style={{ fontSize: "11px" }}
                      >
                        Khách hàng
                      </text>
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-col gap-3">
                    {statusSegmentsAll.every((s) => s.value === 0) && (
                      <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
                    )}
                    {statusSegmentsAll.map((seg) => (
                      <div key={seg.label} className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: seg.color }}
                        ></div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{seg.label}</p>
                          <p className="text-xs text-slate-500">
                            {formatCount(seg.value)} · {seg.percent}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-500">
                  Hôm nay: <span className="font-semibold text-slate-800">{today}</span>
                </div>
              </div>
            </div>
          )}

          {/* Biểu đồ - Staff: thống kê khách hàng của riêng họ */}
          {role !== "admin" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-purple-500">Thống kê CRM</p>
                  <h3 className="text-xl font-bold text-slate-900">Tổng quan khách hàng</h3>
                </div>
                <span
                  className="text-sm text-purple-600 cursor-pointer flex items-center gap-1 hover:underline"
                  onClick={() => navigate(customersPath)}
                >
                  Xem chi tiết <span className="text-base">↗</span>
                </span>
              </div>

              <div className="relative h-64 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl p-4 flex items-center justify-center gap-6">
                <div className="relative">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle
                      cx="80"
                      cy="80"
                      r="60"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="24"
                    />
                    {statusSegmentsChart.length > 0
                      ? cumulativeDash(statusSegmentsChart).map((seg, idx) => (
                          <circle
                            key={seg.label + idx}
                            cx="80"
                            cy="80"
                            r="60"
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="24"
                            strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                            strokeDashoffset={seg.offset}
                            transform="rotate(-90 80 80)"
                            className="transition-all duration-500"
                          />
                        ))
                      : null}
                    <text
                      x="80"
                      y="75"
                      textAnchor="middle"
                      className="fill-purple-600 text-2xl font-bold"
                      style={{ fontSize: "28px", fontWeight: "700" }}
                    >
                      {formatCount(customerStats.total)}
                    </text>
                    <text
                      x="80"
                      y="95"
                      textAnchor="middle"
                      className="fill-slate-500 text-xs"
                      style={{ fontSize: "11px" }}
                    >
                      Khách hàng
                    </text>
                  </svg>
                </div>

                <div className="flex flex-col gap-3">
                    {statusSegmentsAll.every((s) => s.value === 0) && (
                    <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
                  )}
                  {statusSegmentsAll.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: seg.color }}
                      ></div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{seg.label}</p>
                        <p className="text-xs text-slate-500">
                          {formatCount(seg.value)} · {seg.percent}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-500">
                Hôm nay: <span className="font-semibold text-slate-800">{today}</span>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default HomePage;
