import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import StaffSidebar from "../../components/StaffSidebar";

export default function StaffEmployNhanvien() {
  const { client, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        //  staff chỉ gọi /profiles/me
        const res = await client.get("/profiles/me");
        setProfile(res.data || null);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) setError("Bạn chưa có hồ sơ nhân sự. Vui lòng cập nhật hồ sơ.");
        else setError(err?.response?.data?.message || "Không tải được hồ sơ.");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [client]);

  const safe = profile || {};
  const fullName = safe.full_name || safe.fullName || "Chưa cập nhật";
  const email = safe.email || user?.email || "—";
  const department = safe.department || "Chưa gán";
  const position = safe.position || "Chưa cập nhật";
  const status = safe.status || "working";

  const statusLabel = (s) => {
    if (s === "leave") return { text: "Nghỉ phép", cls: "bg-amber-100 text-amber-700" };
    if (s === "quit") return { text: "Đã nghỉ", cls: "bg-rose-100 text-rose-700" };
    return { text: "Đang làm", cls: "bg-emerald-100 text-emerald-700" };
  };
  const st = statusLabel(status);

  return (
    <div className="h-screen bg-white text-slate-900 flex overflow-hidden">
      <StaffSidebar />

      <main className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="px-10 pt-8 pb-4">
          <p className="text-sm text-slate-500 font-medium">Nhân viên</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Hồ sơ của tôi
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Trang này chỉ hiển thị thông tin của chính bạn.
          </p>
        </div>

        <div className="px-10 pb-10">
          {loading ? (
            <div className="text-slate-500 bg-white border border-slate-200 rounded-2xl p-8">
              Đang tải hồ sơ...
            </div>
          ) : error ? (
            <div className="bg-white border border-rose-200 rounded-2xl p-8">
              <p className="text-rose-600 font-semibold">{error}</p>
              <button
                onClick={() => navigate("/staff/profile")}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
              >
                Đi cập nhật hồ sơ
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-8 border-b bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
                <p className="text-sm opacity-90">Thông tin cá nhân</p>
                <h2 className="text-3xl font-extrabold mt-1">{fullName}</h2>
                <p className="text-sm opacity-90 mt-2">{email}</p>
              </div>

              <div className="p-8 grid gap-6 md:grid-cols-2">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Phòng ban
                  </p>
                  <p className="text-lg font-bold text-slate-900 mt-2">🏢 {department}</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Chức vụ
                  </p>
                  <p className="text-lg font-bold text-slate-900 mt-2">👔 {position}</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Trạng thái
                  </p>
                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${st.cls}`}>
                      ● {st.text}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    THÔNG TIN CÁ NHÂN ĐẦY ĐỦ
                  </p>
                  <p className="text-sm text-slate-600 mt-2">Bạn chỉ được xem tại đây.</p>
                  <button
                    onClick={() => navigate("/staff/profile")}
                    className="mt-3 px-4 py-2 rounded-xl border border-slate-300 text-slate-800 font-semibold hover:bg-white"
                  >
                    Xem hồ sơ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
