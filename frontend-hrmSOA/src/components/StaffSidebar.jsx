import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function StaffSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();


  const menu = [
    { label: "Tổng quan", icon: "📊", path: "/home" },
    { label: "Hồ sơ", icon: "👥", path: "/staff/employees" },
    { label: "Khách hàng", icon: "🤝", path: "/staff/customers" },
    { label: "Phòng ban", icon: "🏢", path: "/staff/departments" },
  ];

  const isActive = (path) => {
    if (path === "/home") return location.pathname.startsWith("/home");
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col sticky top-0 h-screen">
      {/* Logo */}
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

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menu.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive(item.path)
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "hover:bg-slate-800"
              }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-2 rounded-lg">
          <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
            {(user?.email?.[0] || "S").toUpperCase()}
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {user?.email || "Nhân viên"}
            </p>
            <p className="text-xs text-emerald-400">Đang trực tuyến</p>
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
  );
}
