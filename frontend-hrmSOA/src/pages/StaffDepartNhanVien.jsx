import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function StaffDepartNhanVien() {
  const { client, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState("departments");
  const [loadingDep, setLoadingDep] = useState(true);
  const [loadingEmp, setLoadingEmp] = useState(true);

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [empError, setEmpError] = useState("");

  //  đọc tab từ URL (?tab=departments | employees)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get("tab");
    if (t === "employees") setTab("employees");
    else setTab("departments");
  }, [location.search]);

  //  load departments
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDep(true);
      try {
        const depRes = await client.get("/departments");
        setDepartments(Array.isArray(depRes.data) ? depRes.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDep(false);
      }
    };
    loadDepartments();
  }, [client]);

  //  load employees public
  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingEmp(true);
      setEmpError("");
      try {
        const empRes = await client.get("/profiles/public");
        setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      } catch (err) {
        console.error(err);
        const status = err?.response?.status;
        if (status === 403) setEmpError("Bạn chưa có quyền xem danh sách nhân viên (403).");
        else setEmpError(err?.response?.data?.message || "Không tải được danh sách nhân viên.");
        setEmployees([]);
      } finally {
        setLoadingEmp(false);
      }
    };
    loadEmployees();
  }, [client]);

  const navItems = [
    { label: "Tổng quan", icon: "📊", path: "/home" },
    { label: "Phòng ban", icon: "🏢", path: "/staff/view?tab=departments" },
    { label: "Nhân viên", icon: "👥", path: "/staff/view?tab=employees" },
  ];

  const activeNav = (path) => {
    const params = new URLSearchParams(path.split("?")[1] || "");
    const t = params.get("tab");
    return location.pathname.startsWith("/staff/view") && (t ? t === tab : false);
  };

  const formatStatus = (s) => {
    if (s === "leave") return { text: "Nghỉ phép", cls: "bg-amber-100 text-amber-700" };
    if (s === "quit") return { text: "Đã nghỉ", cls: "bg-rose-100 text-rose-700" };
    return { text: "Đang làm", cls: "bg-emerald-100 text-emerald-700" };
  };

  const employeeRows = useMemo(() => {
    const arr = [...employees];
    arr.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    return arr;
  }, [employees]);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-confirm">
            HR
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">HRM Core</p>
            <p className="text-sm font-semibold">Enterprise SOA</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const active = item.path === "/home"
              ? location.pathname.startsWith("/home")
              : activeNav(item.path);

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "hover:bg-slate-800"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      <div className="p-4 border-t border-slate-800">
  <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-2 rounded-lg">
    <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
      {(user?.email?.[0] || "S").toUpperCase()}
    </div>

    <div className="flex-1">
      <p className="text-sm font-semibold text-white">
        {user?.email || "Nhân viên"}
      </p>
      <p className="text-xs text-slate-400">Nhân viên</p>
    </div>

    <button
      onClick={logout}
      className="text-slate-400 hover:text-white text-lg"
      title="Đăng xuất"
    >
      ↪
    </button>
  </div>
</div>

      </aside>

      {/* Main */}
      <main className="flex-1 bg-slate-50">
        <div className="px-10 pt-8 pb-4">
          <p className="text-sm text-slate-500 font-medium">Chế độ xem</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Phòng ban &amp; Nhân viên
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Bạn chỉ có thể xem !
          </p>
        </div>

        <div className="px-10 pb-10">
          {tab === "departments" ? (
            loadingDep ? (
              <div className="text-slate-500 bg-white border border-slate-200 rounded-2xl p-8">
                Đang tải phòng ban...
              </div>
            ) : departments.length === 0 ? (
              <div className="text-slate-500 bg-white border border-dashed border-slate-200 rounded-2xl p-8">
                Chưa có phòng ban.
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {departments.map((dep) => (
                  <div
                    key={dep._id}
                    className="relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 flex flex-col gap-5"
                  >
                    <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-2xl">
                      🏢
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-slate-900">{dep.name}</p>
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold">
                        📍 {dep.location || "—"}
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-4 flex items-end justify-between text-sm text-slate-600">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Trưởng phòng</p>
                        <div className="mt-2 flex items-center gap-3 font-semibold text-slate-800">
                          <span className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-extrabold">
                            {(dep.manager || "N").trim().charAt(0).toUpperCase()}
                          </span>
                          <span className="text-base font-bold">{dep.manager || "Đang cập nhật"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Nhân sự</p>
                        <div className="mt-2 inline-flex items-center gap-2 text-slate-800 font-bold">
                          👥 <span className="text-base">{dep.staffCount ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : loadingEmp ? (
            <div className="text-slate-500 bg-white border border-slate-200 rounded-2xl p-8">
              Đang tải nhân viên...
            </div>
          ) : empError ? (
            <div className="text-rose-600 bg-white border border-rose-200 rounded-2xl p-8">
              {empError}
            </div>
          ) : employeeRows.length === 0 ? (
            <div className="text-slate-500 bg-white border border-dashed border-slate-200 rounded-2xl p-8">
              Chưa có nhân viên.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-5 px-6 py-4 text-xs font-semibold text-slate-400 uppercase bg-slate-50">
                <p>Nhân viên</p>
                <p>Vị trí</p>
                <p>Phòng ban</p>
                <p>Trạng thái</p>
                <p className="text-right">Email</p>
              </div>

              {employeeRows.map((emp) => {
                const name = emp.full_name || "Chưa có";
                const email = emp.email || "—";
                const position = emp.position || "Đang cập nhật";
                const department = emp.department || "Chưa gán";
                const status = formatStatus(emp.status || "working");
                const rowId = emp.user_id || emp.id || emp._id;

                return (
                  <div key={rowId} className="grid grid-cols-5 px-6 py-5 border-t hover:bg-slate-50 transition">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                        {name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{name}</p>
                        <p className="text-xs text-slate-400">ID: {rowId || "—"}</p>
                      </div>
                    </div>

                    <div className="flex items-center font-semibold text-slate-800">{position}</div>

                    <div className="flex items-center">
                      <span className="text-sm text-indigo-600 font-medium inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full">
                        🏢 {department}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.cls}`}>
                        ● {status.text}
                      </span>
                    </div>

                    <div className="flex items-center justify-end text-slate-700">{email}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
