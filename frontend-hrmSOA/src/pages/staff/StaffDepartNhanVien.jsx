import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import StaffSidebar from "../../components/StaffSidebar";

export default function StaffDepartNhanVien() {
  const { client } = useAuth();

  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const loadDepartments = async () => {
      setLoading(true);
      try {
        const depRes = await client.get("/departments");
        setDepartments(Array.isArray(depRes.data) ? depRes.data : []);
      } catch (err) {
        console.error(err);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, [client]);

  return (
    <div className="h-screen bg-white text-slate-900 flex overflow-hidden">
      {/*  Dùng sidebar chuẩn cho staff */}
      <StaffSidebar />

      {/* Main */}
      <main className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="px-10 pt-8 pb-4">
          <p className="text-sm text-slate-500 font-medium">Chế độ xem</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Phòng ban
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Bạn chỉ có thể xem!
          </p>
        </div>

        <div className="px-10 pb-10">
          {loading ? (
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
                    <p className="text-2xl font-extrabold text-slate-900">
                      {dep.name}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold">
                      📍 {dep.location || "—"}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-end justify-between text-sm text-slate-600">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Trưởng phòng
                      </p>
                      <div className="mt-2 flex items-center gap-3 font-semibold text-slate-800">
                        <span className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-extrabold">
                          {(dep.manager || "N").trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="text-base font-bold">
                          {dep.manager || "Đang cập nhật"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Nhân sự
                      </p>
                      <div className="mt-2 inline-flex items-center gap-2 text-slate-800 font-bold">
                        👥 <span className="text-base">{dep.staffCount ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
