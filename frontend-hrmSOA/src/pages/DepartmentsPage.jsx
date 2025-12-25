import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import StaffSidebar from "../components/StaffSidebar";

export default function DepartmentsPage() {
  const { client } = useAuth();
  const [departments, setDepartments] = useState([]);

  // ✅ Hover để hiện mũi tên kéo qua (không hiện sẵn)
  const [hoveredId, setHoveredId] = useState(null);

  // ✅ Drawer kéo từ phải ra
  const [selectedDep, setSelectedDep] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  // ✅ Load departments từ API
  const fetchDepartments = async () => {
    try {
      const { data } = await client.get("/departments");
      setDepartments(data || []);
    } catch (err) {
      console.error(err);
      alert("Không tải được phòng ban");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [client]);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* ✅ Sidebar staff */}
      <StaffSidebar />

      {/* ✅ Main content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">Phòng ban</h2>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>🔔</span>
            <div className="text-right">
              <p className="text-xs">Hôm nay</p>
              <p className="font-semibold text-slate-700">
                {new Date().toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
        </header>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-slate-900 mb-2">
            Phòng ban & Tổ chức
          </h1>
          <p className="text-slate-500 text-lg">
            Cấu trúc doanh nghiệp và quản lý các đơn vị.
          </p>
        </div>

        {/* Department cards */}
        {departments.length === 0 ? (
          <p className="text-slate-500">Chưa có phòng ban nào trong hệ thống.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((dep) => (
              <div
                key={dep._id}
                onMouseEnter={() => setHoveredId(dep._id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 cursor-pointer
                  ${hoveredId === dep._id ? "shadow-xl -translate-y-1" : ""}
                `}
              >
                {/* Top line gradient */}
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

                <div className="p-6 space-y-4">
                  {/* Icon + trash */}
                  <div className="flex justify-between items-start">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
                      🏢
                    </div>

                    {/* ✅ Trash chỉ hiện khi hover (staff không có quyền xóa) */}
                    {hoveredId === dep._id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert("Nhân viên không có quyền xóa phòng ban.");
                        }}
                        className="text-slate-200 hover:text-slate-300 transition cursor-not-allowed"
                        title="Chỉ Admin mới có quyền xóa"
                      >
                        🗑
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-slate-900">{dep.name}</h3>

                  {/* Location */}
                  <div className="flex items-center gap-2">
                    <span className="text-rose-500">📍</span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-600 font-medium">
                      {dep.location || "Chưa có vị trí"}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                    {/* Manager */}
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold">TRƯỞNG PHÒNG</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                          {dep.manager?.[0] || "?"}
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{dep.manager || "Chưa có"}</p>
                      </div>
                    </div>

                    {/* Staff count + arrow */}
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase font-semibold">NHÂN SỰ</p>
                      <div className="flex items-center justify-end gap-3 mt-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          👥 {dep.staffCount || 0}
                        </div>

                        {/* ✅ Arrow chỉ hiện khi hover */}
                        {hoveredId === dep._id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDep(dep);
                              setOpenDrawer(true);
                            }}
                            className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition"
                            title="Xem chi tiết"
                          >
                            ➜
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ Drawer kéo từ phải sang */}
        {openDrawer && selectedDep && (
          <div className="fixed inset-0 z-50 flex">
            {/* overlay */}
            <div
              className="flex-1 bg-black/40"
              onClick={() => setOpenDrawer(false)}
            ></div>

            {/* drawer */}
            <div className="w-[420px] bg-white shadow-2xl p-6 space-y-4 animate-slideInRight">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">{selectedDep.name}</h2>
                <button
                  onClick={() => setOpenDrawer(false)}
                  className="text-slate-500 hover:text-slate-800 text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-slate-700">
                <p><b>📍 Vị trí:</b> {selectedDep.location || "Chưa có"}</p>
                <p><b>👤 Trưởng phòng:</b> {selectedDep.manager || "Chưa có"}</p>
                <p><b>👥 Nhân sự:</b> {selectedDep.staffCount || 0}</p>

                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-500">
                  Không có thông tin mô tả
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setOpenDrawer(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
