import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";

function DepartmentPage() {
  const { client, role } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [managerLookup, setManagerLookup] = useState("");
  const [managerUserId, setManagerUserId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
    manager: "",
    staffCount: 0,
  });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await client.get("/departments");
      setDepartments(data || []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Không tải được danh sách phòng ban");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [client]);

  useEffect(() => {
    if (role === "admin") {
      const fetchEmployees = async () => {
        try {
          const { data } = await client.get("/admin/employees");
          setEmployees(data || []);
        } catch (err) {
          console.error("Cannot load employees for manager lookup", err);
        }
      };
      fetchEmployees();
    }
  }, [client, role]);

  const items = useMemo(() => departments, [departments]);

  const resetForm = () =>
    setForm({
      name: "",
      location: "",
      manager: "",
      staffCount: 0,
    });
  const resetManager = () => {
    setManagerLookup("");
    setManagerUserId(null);
  };

  const openAdd = () => {
    resetForm();
    resetManager();
    setAdding(true);
  };

  const submitAdd = async () => {
    if (!form.name) {
      alert("Tên phòng ban là bắt buộc");
      return;
    }
    try {
      await client.post("/departments", form);
      if (managerUserId) {
        await client.put(`/admin/employees/${managerUserId}`, {
          position: `Trưởng phòng ${form.name}`,
          department: form.name,
        });
      }
      setAdding(false);
      await fetchDepartments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Tạo phòng ban thất bại");
    }
  };

  const submitEdit = async () => {
    if (!editing?._id) return;
    try {
      await client.put(`/departments/${editing._id}`, form);
      if (managerUserId) {
        await client.put(`/admin/employees/${managerUserId}`, {
          position: `Trưởng phòng ${form.name}`,
          department: form.name,
        });
      }
      setEditing(null);
      await fetchDepartments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Cập nhật phòng ban thất bại");
    }
  };

  const remove = async (dep) => {
    if (!window.confirm(`Xóa phòng ban ${dep.name}?`)) return;
    try {
      await client.delete(`/departments/${dep._id}`);
      await fetchDepartments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Xóa phòng ban thất bại");
    }
  };

  const findManagerByInput = (val) => {
    const trimmed = (val || "").trim();
    if (!trimmed) return null;
    return employees.find((emp) => {
      const id = String(emp.id || emp.userId || emp._id || "");
      const email = emp.email || emp.profile?.email || "";
      return id === trimmed || email.toLowerCase() === trimmed.toLowerCase();
    });
  };

  const handleManagerChange = (val) => {
    setManagerLookup(val);
    const match = findManagerByInput(val);
    if (match) {
      const name =
        match.full_name ||
        match.fullName ||
        match.profile?.full_name ||
        match.profile?.fullName ||
        match.name ||
        "";
      setForm((p) => ({ ...p, manager: name }));
      setManagerUserId(match.id || match.userId || match._id || null);
    } else {
      setManagerUserId(null);
      setForm((p) => ({ ...p, manager: "" }));
    }
  };

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="h-screen bg-white text-slate-900 flex overflow-hidden">
      <AdminSidebar />

      {/* Main */}
      <main className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="px-10 pt-8 pb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Phòng ban</p>
            <h1 className="text-3xl font-bold text-slate-900">Phòng ban &amp; Tổ chức</h1>
            <p className="text-sm text-slate-500 mt-1">
              Cấu trúc doanh nghiệp và quản lý các đơn vị.
            </p>
          </div>
          <div className="text-sm text-slate-600 text-right">
            <p>Hôm nay</p>
            <p className="font-semibold text-slate-800">{today}</p>
          </div>
        </div>

        <div className="px-10 pb-10">
          {loading && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, idx) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={idx}
                  className="h-64 bg-white border border-slate-200 rounded-3xl animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-16 text-slate-500 bg-white border border-dashed border-slate-200 rounded-3xl">
              Chưa có phòng ban. {role === "admin" ? "Nhấn nút + để thêm mới." : ""}
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {items.map((dep) => (
                <div
                  key={dep._id}
                  className="relative bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 cursor-pointer"
                  onClick={() => {
                    if (role === "admin") {
                      setEditing(dep);
                      setForm({
                        name: dep.name || "",
                        location: dep.location || "",
                        manager: dep.manager || "",
                        staffCount: dep.staffCount || 0,
                      });
                      setManagerLookup(dep.manager || "");
                      setManagerUserId(null);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
                      🏢
                    </div>
                    {role === "admin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(dep);
                        }}
                        className="text-slate-400 hover:text-rose-500"
                        title="Xóa phòng ban"
                      >
                        🗑
                      </button>
                    )}
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {dep.name}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold">
                      📍 {dep.location || "—"}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-sm text-slate-600">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Trưởng phòng
                      </p>
                      <div className="mt-1 flex items-center gap-2 font-semibold text-slate-800">
                        <span className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold">
                          {(dep.manager || "N").charAt(0).toUpperCase()}
                        </span>
                        <span>{dep.manager || "Đang cập nhật"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Nhân sự
                      </p>
                      <div className="mt-1 inline-flex items-center gap-2 text-slate-800 font-semibold">
                        👥 <span>{dep.staffCount ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {role === "admin" && (
          <div className="pb-12 flex justify-center">
            <button
              onClick={openAdd}
              className="h-16 w-16 rounded-full bg-white border border-dashed border-slate-300 text-3xl text-slate-400 shadow-sm hover:border-indigo-300 hover:text-indigo-500 transition"
              title="Thêm phòng ban"
            >
              +
            </button>
          </div>
        )}
      </main>

      {/* Add / Edit modal */}
      {(adding || editing) && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">
                {adding ? "Thêm phòng ban" : "Chỉnh sửa phòng ban"}
              </h3>
              <button
                className="text-slate-500 hover:text-slate-800"
                onClick={() => {
                  setAdding(false);
                  setEditing(null);
                  resetManager();
                }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-600 font-medium">Tên phòng ban</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ví dụ: Công nghệ thông tin"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 font-medium">Vị trí</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="Tầng 3, Tòa A"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 font-medium">Trưởng phòng</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                  value={managerLookup}
                  onChange={(e) => handleManagerChange(e.target.value)}
                  placeholder="Nhập ID hoặc email"
                />
                {managerUserId && (
                  <p className="mt-1 text-sm text-emerald-600">
                    Tự động chọn: {form.manager}
                  </p>
                )}
                {!managerUserId && managerLookup && role === "admin" && (
                  <p className="mt-1 text-sm text-amber-600">
                    Không tìm thấy nhân viên với ID/email này
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-600 font-medium">Số lượng nhân sự</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                  value={form.staffCount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, staffCount: Number(e.target.value) || 0 }))
                  }
                  placeholder="2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  setAdding(false);
                  setEditing(null);
                  resetManager();
                }}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                onClick={adding ? submitAdd : submitEdit}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentPage;

