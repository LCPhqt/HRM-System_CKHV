import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import StaffSidebar from "../components/StaffSidebar";

function CustomerHistoryPage() {
  const { client, token, role } = useAuth();
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
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
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      setItems([]);
      setError(err?.response?.data?.message || err?.message || "Không tải được lịch sử xóa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") {
      fetchDeleted();
    }
  }, [token, role]);

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

  const handleRestoreSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      await client.post(
        "/crm/customers/restore/bulk",
        { ids: Array.from(selectedIds) },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      await fetchDeleted();
      alert("Khôi phục đã chọn thành công");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || "Khôi phục thất bại");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm("Xóa vĩnh viễn các bản ghi đã chọn? Không thể khôi phục.")) return;
    try {
      await client.post(
        "/crm/customers/hard/bulk",
        { ids: Array.from(selectedIds) },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      await fetchDeleted();
      alert("Đã xóa vĩnh viễn các bản ghi đã chọn");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || "Xóa vĩnh viễn thất bại");
    }
  };

  const handleDeleteHard = async (id) => {
    if (!id) return;
    if (!window.confirm("Xóa vĩnh viễn? Không thể khôi phục sau thao tác này.")) return;
    try {
      await client.delete(`/crm/customers/${id}/hard`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await fetchDeleted();
      alert("Đã xóa vĩnh viễn");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || "Xóa vĩnh viễn thất bại");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === rows.length) return new Set();
      return new Set(rows.map((c) => c.id || c._id));
    });
  };

  const rows = useMemo(() => items || [], [items]);

  return (
    <div className="h-screen bg-white text-slate-900 flex overflow-hidden">
      {sidebar}
      <main className="flex-1 bg-slate-50 overflow-y-auto">
        {role !== "admin" ? (
          <div className="p-10">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Không có quyền truy cập</h1>
              <p className="text-sm text-slate-600">
                Chức năng lịch sử/xóa vĩnh viễn chỉ dành cho quản trị viên.
              </p>
            </div>
          </div>
        ) : (
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
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleRestoreSelected}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100"
                    >
                      Khôi phục đã chọn ({selectedIds.size})
                    </button>
                  )}
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100"
                    >
                      Xóa vĩnh viễn đã chọn
                    </button>
                  )}
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
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={rows.length > 0 && selectedIds.size === rows.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
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
                        <td className="px-4 py-6 text-slate-500" colSpan={7}>
                          Chưa có bản ghi đã xóa.
                        </td>
                      </tr>
                    )}
                    {rows.map((c) => (
                      <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(c.id || c._id)}
                            onChange={() => toggleSelect(c.id || c._id)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
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
                          <button
                            onClick={() => handleDeleteHard(c.id || c._id)}
                            className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100"
                          >
                            Xóa vĩnh viễn
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerHistoryPage;

