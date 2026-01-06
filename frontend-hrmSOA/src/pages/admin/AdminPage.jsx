import React, { useEffect, useMemo, useState } from "react";
import EmployeeTable from "../../components/EmployeeTable";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";

function AdminPage() {
  const { client } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("");

  //  Dropdown filter trạng thái
  const [openFilter, setOpenFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  //  Edit & Add
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState(null);

  const [addForm, setAddForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    dob: "",
    phone: "",
    address: "",
    salary: "",
    position: "",
    department: "",
  });

  const fetchEmployees = async () => {
    try {
      const { data } = await client.get("/admin/employees");
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filtered = useMemo(() => {
    let list = [...employees];

    // ✅ filter status
    if (statusFilter !== "all") {
      list = list.filter((e) => {
        const st = e.status || e.profile?.status || "working";
        return st === statusFilter;
      });
    }

    //  search text
    if (!filter) return list;

    return list.filter((e) => {
      const profile = e.profile || {};

      //  lấy tên chuẩn: ưu tiên từ profile
      const fullName =
        e.full_name ||
        e.fullName ||
        profile.fullName ||
        profile.full_name ||
        profile.name ||
        e.name ||
        "";

      const email = e.email || profile.email || "";

      const position = e.position || profile.position || "";
      const department = e.department || profile.department || "";

      const text = `${fullName} ${email} ${position} ${department}`.toLowerCase();

      return text.includes(filter.toLowerCase());
    });
  }, [employees, filter, statusFilter]);

  return (
    <div className="h-screen bg-slate-100 text-slate-800 flex overflow-hidden">
      <AdminSidebar />

      {/* Main */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Nhân viên</p>
            <h1 className="text-2xl font-bold text-slate-900">Nhân sự</h1>
            <p className="text-sm text-slate-500">
              Quản lý hồ sơ và thông tin nhân viên toàn công ty.
            </p>
          </div>

          <div className="text-sm text-slate-500 text-right">
            <p>Hôm nay</p>
            <p className="font-semibold text-slate-700">
              {new Date().toLocaleDateString("vi-VN")}
            </p>
          </div>
        </header>

        {/* Search + Filter + Add */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-200 flex-1">
            <span className="text-slate-400">🔍</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Tìm kiếm nhân viên theo tên, email..."
              className="w-full outline-none text-sm text-slate-700"
            />
          </div>

          {/*  Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenFilter((p) => !p)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-200 flex items-center gap-2"
            >
              ⚙ Bộ lọc:{" "}
              {statusFilter === "all"
                ? "Tất cả"
                : statusFilter === "working"
                  ? "Đang làm việc"
                  : statusFilter === "leave"
                    ? "Nghỉ phép"
                    : "Đã nghỉ việc"}
            </button>

            {openFilter && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                {[
                  { label: "Tất cả", value: "all", color: "text-slate-700" },
                  {
                    label: "Đang làm việc",
                    value: "working",
                    color: "text-emerald-600",
                  },
                  {
                    label: "Nghỉ phép",
                    value: "leave",
                    color: "text-amber-600",
                  },
                  {
                    label: "Đã nghỉ việc",
                    value: "quit",
                    color: "text-slate-400",
                  },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setStatusFilter(item.value);
                      setOpenFilter(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm ${item.color}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add */}
          <button
            className="px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-300 hover:bg-indigo-700"
            onClick={() => {
              setAddForm({
                full_name: "",
                email: "",
                password: "",
                confirm_password: "",
                salary: "",
                position: "",
                department: "",
              });
              setAdding(true);
            }}
          >
            + Thêm nhân viên
          </button>
        </div>

        {/* Table */}
        <EmployeeTable
          employees={filtered}
          onView={(emp) => {
            const profile = emp.profile || {};
            setViewing({
              email: emp.email || profile.email || "",
              full_name:
                emp.full_name ||
                emp.fullName ||
                profile.full_name ||
                profile.fullName ||
                "",
              department: emp.department || profile.department || "",
              position: emp.position || profile.position || "",
              dob: profile.dob || "",
              phone: profile.phone || "",
              address: profile.address || "",
              salary: profile.salary ?? "",
              status: emp.status || profile.status || "working",
              joined_at:
                emp.joined_at ||
                profile.createdAt ||
                emp.createdAt ||
                profile.created_at ||
                emp.created_at ||
                "",
            });
          }}
          onStatusChange={async (emp, newStatus) => {
            try {
              await client.put(`/admin/employees/${emp.id || emp.userId || emp._id}`, {
                status: newStatus,
              });
              await fetchEmployees();
            } catch (err) {
              alert(err.response?.data?.message || err.message);
              throw err;
            }
          }}
          onEdit={(emp) => {
            const profile = emp.profile || {};
            setEditing({
              id: emp.id || emp.userId || emp._id,
              email: emp.email || profile.email || "",
              full_name:
                emp.full_name ||
                emp.fullName ||
                profile.full_name ||
                profile.fullName ||
                "",
              department: emp.department || profile.department || "",
              position: emp.position || profile.position || "",
              dob: profile.dob || "",
              phone: profile.phone || "",
              address: profile.address || "",
              salary: profile.salary ?? "",
            });
          }}
          onRemove={async (emp) => {
            if (!window.confirm(`Xóa nhân viên ${emp.full_name || emp.email}?`))
              return;
            try {
              await client.delete(`/admin/employees/${emp.id || emp.userId || emp._id}`);
              await fetchEmployees();
            } catch (err) {
              alert(err.response?.data?.message || err.message);
            }
          }}
        />

        {/*  EDIT MODAL */}
        {editing && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">
                  Chỉnh sửa nhân viên
                </h3>
                <button
                  className="text-slate-500 hover:text-slate-800"
                  onClick={() => setEditing(null)}
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 font-medium">
                    Email
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editing.email}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">
                    Họ và tên
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editing.full_name}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, full_name: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">
                    Chức vụ
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editing.position}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, position: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">
                    Phòng ban
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editing.department}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, department: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">
                    Lương cơ bản
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editing.salary}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, salary: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 font-medium">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editing.dob}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, dob: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">
                    Số điện thoại
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editing.phone}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-slate-600 font-medium">
                    Địa chỉ
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editing.address}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </div>

              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-100"
                  onClick={() => setEditing(null)}
                >
                  Hủy
                </button>

                <button
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={async () => {
                    try {
                      const payload = { ...editing };
                      delete payload.id;
                      await client.put(`/admin/employees/${editing.id}`, payload);
                      setEditing(null);
                      await fetchEmployees();
                    } catch (err) {
                      alert(err.response?.data?.message || err.message);
                    }
                  }}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {viewing && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Thông tin nhân viên</h3>
                <button
                  className="text-slate-500 hover:text-slate-800"
                  onClick={() => setViewing(null)}
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Email</p>
                  <p className="mt-1 px-3 py-2 rounded-lg bg-slate-50 border text-slate-800">
                    {viewing.email || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Họ và tên</p>
                  <p className="mt-1 px-3 py-2 rounded-lg bg-slate-50 border text-slate-800">
                    {viewing.full_name || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-600 font-medium">Chức vụ</p>
                  <p className="mt-1 px-3 py-2 rounded-lg bg-slate-50 border text-slate-800">
                    {viewing.position || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Phòng ban</p>
                  <p className="mt-1 px-3 py-2 rounded-lg bg-slate-50 border text-slate-800">
                    {viewing.department || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-600 font-medium">Ngày sinh</p>
                  <p className="mt-1 px-3 py-2 rounded-lg bg-slate-50 border text-slate-800">
                    {viewing.dob || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Số điện thoại</p>
                  <p className="mt-1 px-3 py-2 rounded-lg bg-slate-50 border text-slate-800">
                    {viewing.phone || "—"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-slate-600 font-medium">Địa chỉ</p>
                  <p className="mt-1 px-3 py-2 rounded-lg bg-slate-50 border text-slate-800">
                    {viewing.address || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-600 font-medium">Lương cơ bản</p>
                  <p className="mt-1 px-3 py-2 rounded-lg bg-slate-50 border text-slate-800">
                    {viewing.salary !== undefined && viewing.salary !== null && viewing.salary !== ""
                      ? viewing.salary
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Trạng thái</p>
                  <p className="mt-1 px-3 py-2 rounded-lg bg-slate-50 border text-slate-800 capitalize">
                    {viewing.status || "working"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-slate-600 font-medium">Ngày gia nhập</p>
                  <p className="mt-1 px-3 py-2 rounded-lg bg-slate-50 border text-slate-800">
                    {viewing.joined_at
                      ? new Date(viewing.joined_at).toLocaleDateString("vi-VN")
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={() => setViewing(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/*  ADD MODAL */}
        {adding && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">
                  Thêm nhân viên
                </h3>
                <button
                  className="text-slate-500 hover:text-slate-800"
                  onClick={() => setAdding(false)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-600 font-medium">
                    Họ và tên
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={addForm.full_name}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, full_name: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">
                    Email
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={addForm.email}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-600 font-medium">
                      Mật khẩu
                    </label>
                    <input
                      type="password"
                      className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                      value={addForm.password}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, password: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 font-medium">
                      Nhập lại mật khẩu
                    </label>
                    <input
                      type="password"
                      className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                      value={addForm.confirm_password}
                      onChange={(e) =>
                        setAddForm((p) => ({
                          ...p,
                          confirm_password: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-600 font-medium">
                      Chức vụ
                    </label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                      value={addForm.position}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, position: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600 font-medium">
                      Phòng ban
                    </label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                      value={addForm.department}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, department: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-600 font-medium">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                      value={addForm.dob}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, dob: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 font-medium">
                      Số điện thoại
                    </label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                      value={addForm.phone}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">
                    Địa chỉ
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={addForm.address}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">
                    Lương cơ bản
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={addForm.salary}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, salary: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-100"
                  onClick={() => setAdding(false)}
                >
                  Hủy
                </button>

                <button
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={async () => {
                    if (addForm.password !== addForm.confirm_password) {
                      alert("Mật khẩu nhập lại không khớp");
                      return;
                    }
                    try {
                      await client.post("/admin/employees", addForm);
                      setAdding(false);
                      await fetchEmployees();
                    } catch (err) {
                      alert(err.response?.data?.message || err.message);
                    }
                  }}
                >
                  Tạo tài khoản
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPage;
