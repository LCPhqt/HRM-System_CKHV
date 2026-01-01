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

        //  CRM: tổng khách hàng (best-effort, không làm crash trang nếu CRM chưa chạy)
        try {
          const crmRes = await client.get("/crm/customers/count", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const count = Number(crmRes.data?.count ?? 0);
          setCustomerCount(Number.isFinite(count) ? count : 0);
        } catch (err) {
          console.warn("Cannot load customer count", err?.response?.data || err?.message || err);
          setCustomerCount(0);
        }
      } catch (err) {
        console.error(err);
        setEmployees([]);
        setDepartments([]);
        setCustomerCount(0);
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

  return (
    <div className="min-h-screen bg-white text-slate-900 flex">
      {role === "admin" ? <AdminSidebar /> : <StaffSidebar />}

      {/* Main */}
      <main className="flex-1 bg-slate-50">
        <div className="px-10 pt-8 pb-4 space-y-6">
          <header className="bg-gradient-to-r from-indigo-700 to-indigo-500 text-white rounded-3xl p-8 shadow-xl">
            <p className="text-sm opacity-90 mb-1">
              Xin chào, {role === "admin" ? "Admin" : user?.email}
            </p>
            <h1 className="text-3xl font-bold">Hệ thống đang hoạt động ổn định.</h1>
            <p className="mt-2 text-sm text-indigo-100">
              Dưới đây là báo cáo tổng quan về tình hình nhân sự của công ty trong tháng này.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              onClick={() => navigate(departmentsPath)} //  FIX
            >
              <p className="text-sm text-slate-500">Phòng ban</p>
              <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 tracking-tight break-all leading-tight">
                {formatCount(totalDepartments)}
              </div>
              <p className="text-xs text-indigo-600 mt-1">Đang hoạt động</p>
            </div>

            <div
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 cursor-pointer hover:border-indigo-200 hover:shadow-md transition"
              onClick={() => navigate(customersPath)}
            >
              <p className="text-sm text-slate-500">Khách hàng</p>
              <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 tracking-tight break-all leading-tight">
                {formatCount(customerCount)}
              </div>
              <p className="text-xs text-indigo-600 mt-1">Xem danh sách</p>
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

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 xl:col-span-2">
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
                <div className="relative h-80 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div
                    className="absolute inset-4 rounded-xl pointer-events-none"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to top, transparent, transparent 38px, rgba(148,163,184,0.2) 39px, rgba(148,163,184,0.2) 40px)",
                    }}
                  />
                  <div className="relative h-full flex items-end justify-around gap-6">
                    {deptStats.length === 0 && (
                      <div className="text-sm text-slate-500">
                        Chưa có dữ liệu phân bổ phòng ban.
                      </div>
                    )}
                    {deptStats.map(([dep, count]) => (
                      <div key={dep} className="flex flex-col items-center gap-2">
                        <div
                          className="w-12 rounded-xl bg-indigo-500 shadow-lg shadow-indigo-200"
                          style={{
                            height: `${(count / maxDeptCount) * 80 + 40}px`,
                            minHeight: "40px",
                          }}
                          title={`${dep}: ${count}`}
                        />
                        <span className="text-xs text-slate-600 text-center w-24 leading-snug">
                          {dep}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <p className="text-sm text-slate-500">Xu hướng tuyển dụng</p>
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Tăng trưởng nhân sự 6 tháng
              </h3>

              <div className="flex-1 flex items-center justify-center">
                <div className="w-full h-56 bg-white rounded-2xl relative overflow-hidden border border-slate-100">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/80 via-white to-white" />
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 300 200"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path
                      d="
                        M 0 140
                        C 40 110, 70 120, 100 140
                        C 120 150, 140 140, 160 110
                        C 190 70, 230 60, 300 40
                        L 300 200 L 0 200 Z
                      "
                      fill="url(#trendFill)"
                      stroke="none"
                    />
                    <path
                      d="
                        M 0 140
                        C 40 110, 70 120, 100 140
                        C 120 150, 140 140, 160 110
                        C 190 70, 230 60, 300 40
                      "
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute inset-x-0 bottom-12 px-4 flex justify-between text-xs text-slate-500">
                    {["T1", "T2", "T3", "T4", "T5", "T6"].map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-500">
                Hôm nay: <span className="font-semibold text-slate-800">{today}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
