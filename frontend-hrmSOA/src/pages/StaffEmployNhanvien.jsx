import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function StaffEmployNhanvien() {
  const { client, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        //  Staff dùng endpoint public
        const { data } = await client.get("/profiles/public");
        setEmployees(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        alert(err?.response?.data?.message || "Không tải được danh sách nhân viên");
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [client]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return employees;

    return employees.filter((e) => {
      const name = (e.full_name || "").toLowerCase();
      const email = (e.email || "").toLowerCase();
      const dep = (e.department || "").toLowerCase();
      const pos = (e.position || "").toLowerCase();
      return (
        name.includes(kw) ||
        email.includes(kw) ||
        dep.includes(kw) ||
        pos.includes(kw)
      );
    });
  }, [employees, q]);

  const today = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const statusBadge = (s) => {
    if (s === "leave") return "bg-amber-100 text-amber-700";
    if (s === "quit") return "bg-rose-100 text-rose-700";
    return "bg-emerald-100 text-emerald-700";
  };

  const statusText = (s) => {
    if (s === "leave") return "Nghỉ phép";
    if (s === "quit") return "Đã nghỉ";
    return "Đang làm việc";
  };

  //  Sidebar staff
  const navItems = [
    { label: "Tổng quan", icon: "📊", path: "/home" },
    { label: "Phòng ban", icon: "🏢", path: "/staff/departments" },
    { label: "Nhân viên", icon: "👥", path: "/staff/employees" },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold">
            HR
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              HRM Core
            </p>
            <p className="text-sm font-semibold">Enterprise SOA</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive(item.path)
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "hover:bg-slate-800"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
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
        <div className="px-10 pt-8 pb-4 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Nhân viên</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Nhân sự
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý hồ sơ và thông tin nhân viên toàn công ty (chỉ xem).
            </p>
          </div>

          <div className="text-sm text-slate-600 text-right">
            <p>Hôm nay</p>
            <p className="font-semibold text-slate-800">{today}</p>
          </div>
        </div>

        <div className="px-10 pb-10 space-y-4">
          {/* Toolbar giống admin nhưng KHÔNG có nút Thêm */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-slate-400">🔍</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm kiếm nhân viên theo tên, email..."
                className="w-full bg-transparent outline-none text-slate-700 font-medium"
              />
            </div>

            <button
              type="button"
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Bộ lọc (chỉ hiển thị)"
              onClick={() => {}}
            >
              ⚙️ Bộ lọc: Tất cả
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-5 px-6 py-4 text-xs font-semibold text-slate-400 uppercase bg-slate-50">
              <p>Thông tin nhân viên</p>
              <p>Vị trí &amp; Phòng ban</p>
              <p>Ngày gia nhập</p>
              <p>Trạng thái</p>
              <p className="text-right">Hành động</p>
            </div>

            {loading ? (
              <div className="p-8 text-slate-500">Đang tải...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-slate-500">Không có dữ liệu.</div>
            ) : (
              filtered.map((e) => {
                const id = e.user_id || e.id || e._id;
                const name = e.full_name || "Đang cập nhật";
                const email = e.email || "—";
                const department = e.department || "Chưa gán";
                const position = e.position || "Đang cập nhật";
                const join = (e.created_at || "").slice(0, 10) || today;
                const st = e.status || "working";

                return (
                  <div
                    key={id}
                    className="grid grid-cols-5 px-6 py-6 border-t hover:bg-slate-50 transition items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center font-extrabold text-indigo-600">
                        {(name?.[0] || "N").toUpperCase()}
                      </div>
                      <div className="leading-tight">
                        <p className="text-xs text-slate-400">ID: {id || "—"}</p>
                        <p className="text-lg font-bold text-slate-900">{name}</p>
                        <p className="text-sm text-slate-600">{email}</p>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">{position}</p>
                      <span className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-sm">
                        🏢 {department}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900">
                      {String(join).split("T")[0]}
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${statusBadge(st)}`}
                      >
                        ● {statusText(st)}
                      </span>
                    </div>

                    {/*  CHỈ CÓ XEM */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setViewing({
                            id,
                            name,
                            email,
                            department,
                            position,
                            st,
                            join,
                          })
                        }
                        className="px-6 py-2 rounded-full bg-slate-100 text-slate-900 font-bold hover:bg-slate-200 transition"
                      >
                        Xem
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Modal Xem */}
      {viewing && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900">
                Thông tin nhân viên
              </h3>
              <button
                onClick={() => setViewing(null)}
                className="text-slate-500 hover:text-slate-900 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3 text-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">ID</span>
                <span className="font-semibold">{viewing.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Họ tên</span>
                <span className="font-semibold">{viewing.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="font-semibold">{viewing.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phòng ban</span>
                <span className="font-semibold">{viewing.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vị trí</span>
                <span className="font-semibold">{viewing.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái</span>
                <span className="font-semibold">{statusText(viewing.st)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày gia nhập</span>
                <span className="font-semibold">
                  {String(viewing.join).split("T")[0]}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewing(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
