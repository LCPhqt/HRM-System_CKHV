import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function StaffSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menu = [
    { label: "Phòng ban", icon: "🏢", path: "/departments" },
    { label: "Nhân viên", icon: "👥", path: "/staff/profile" },
  ];

  return (
    <aside className="w-[280px] bg-[#0b1437] text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-lg font-bold">
          🏢
        </div>
        <div>
          <p className="font-bold text-lg leading-tight">HRM Core</p>
          <p className="text-xs text-white/50 uppercase">ENTERPRISE SOA</p>
        </div>
      </div>

      {/* MENU */}
      <div className="px-6 mt-6">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-4">
          Menu chính
        </p>

        <nav className="space-y-2">
          {menu.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* USER CARD */}
      <div className="mt-auto px-6 pb-6">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg">
            S
          </div>
          <div className="flex-1 leading-tight">
            <p className="font-bold text-white text-sm">Nhân viên</p>
            <p className="text-xs text-white/50">Staff</p>
            <p className="text-xs text-emerald-400 font-semibold mt-1">
              Đang trực tuyến
            </p>
          </div>
          <button
            onClick={logout}
            className="text-white/60 hover:text-white text-lg"
            title="Đăng xuất"
          >
            ↪
          </button>
        </div>
      </div>
    </aside>
  );
}
