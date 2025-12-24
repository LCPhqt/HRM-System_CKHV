import React, { useEffect, useState } from "react";
import StaffSidebar from "../components/StaffSidebar";
import { useAuth } from "../context/AuthContext";

export default function DepartmentsPage() {
  const { client } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await client.get("/departments");
      setDepartments(data || []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Không tải được phòng ban");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-100">
      <StaffSidebar />

      <main className="flex-1">
        {/* Top Header */}
        <div className="h-16 bg-white border-b border-slate-200 px-10 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Phòng ban</h2>

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 cursor-pointer">
              🔔
            </span>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="text-right">
              <p className="text-xs">Hôm nay</p>
              <p className="font-semibold text-slate-700">
                {new Date().toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-10">
          <h1 className="text-4xl font-bold text-slate-900">
            Phòng ban & Tổ chức
          </h1>
          <p className="text-slate-500 mt-2">
            Cấu trúc doanh nghiệp và quản lý các đơn vị.
          </p>

          {/* Loading */}
          {loading && (
            <div className="mt-10 text-slate-500">Đang tải dữ liệu...</div>
          )}

          {/* Empty */}
          {!loading && departments.length === 0 && (
            <div className="mt-10 text-slate-500">
              Chưa có phòng ban nào trong hệ thống.
            </div>
          )}

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {departments.map((dep, idx) => (
              <div
                key={dep._id || idx}
                className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className={`h-2 ${idx % 2 === 0 ? "bg-indigo-600" : "bg-purple-500"}`}></div>

                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl">
                      🏢
                    </div>
                    <button className="text-slate-200 hover:text-slate-400 transition">
                      🗑
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {dep.name}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <span className="text-slate-400">📍</span>
                    <span className="bg-slate-100 px-3 py-1 rounded-full">
                      {dep.location || "Đang cập nhật"}
                    </span>
                  </div>

                  <hr className="my-6" />

                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">
                        Trưởng phòng
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                          {(dep.manager || "A").charAt(0).toUpperCase()}
                        </div>
                        <p className="text-slate-700 font-semibold">
                          {dep.manager || "Đang cập nhật"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-semibold uppercase">
                        Nhân sự
                      </p>
                      <div className="flex items-center gap-2 justify-end mt-2 text-slate-700 font-semibold">
                        👥 <span>{dep.staffCount ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
