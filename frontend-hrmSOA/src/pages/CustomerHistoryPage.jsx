import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import StaffSidebar from "../components/StaffSidebar";

function CustomerHistoryPage() {
  const { client, token, role } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sidebar = role === "admin" ? <AdminSidebar /> : <StaffSidebar />;
  const backPath = role === "admin" ? "/crm" : "/staff/customers";

  const fetchDeleted = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await client.get("/crm/customers/deleted", {
        params: { page: 1, limit: 200 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setItems([]);
      setError(err?.response?.data?.message || err?.message || "Không tải được lịch sử xóa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, [token]);

  const handleRestore = async (id) => {
    if (!id) return;
    try {
      await client.post(
        `/crm/customers/${id}/restore`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      await fetchDeleted();
      alert("Khôi phục thành công");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || "Khôi phục thất bại");
    }
  };

  const rows = useMemo(() => items || [], [items]);

  return (
    <div className="h-screen bg-white text-slate-900 flex overflow-hidden">
      {sidebar}
      <main className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="px-10 pt-8 pb-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Lịch sử khách hàng (đã xóa)</p>
              <h1 className="text-2xl font-bold text-slate-900">Khôi phục khách hàng</h1>
              <p className="text-sm text-slate-500">
                Xem ai đã xóa và khôi phục khách hàng. Chỉ hiển thị tối đa 200 bản ghi gần nhất.
              </p>
            </div>
            <button
              onClick={() => (window.location.href = backPath)}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm hover:border-indigo-200"
            >
              ← Quay lại
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="font-semibold text-slate-800">
                Danh sách đã xóa{" "}
                <span className="text-slate-500 text-sm font-normal">({rows.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDeleted}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-indigo-200"
                >
                  ⟳ Tải lại
                </button>
                {loading && <span className="text-sm text-slate-500">Đang tải...</span>}
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Tên</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Phụ trách</th>
                    <th className="px-4 py-3 text-left font-semibold">Xóa lúc</th>
                    <th className="px-4 py-3 text-left font-semibold">Người xóa</th>
                    <th className="px-4 py-3 text-right font-semibold">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={6}>
                        Chưa có bản ghi đã xóa.
                      </td>
                    </tr>
                  )}
                  {rows.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                      <td className="px-4 py-3 text-slate-600">{c.email || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{c.ownerName || c.ownerId || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.deletedAt ? new Date(c.deletedAt).toLocaleString("vi-VN") : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.deletedByEmail || c.deletedBy || "Admin"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRestore(c.id || c._id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100"
                        >
                          Khôi phục
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomerHistoryPage;

