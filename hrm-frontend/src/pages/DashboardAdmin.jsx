import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../providers/AuthProvider";
import {
  getEmployees,
  updateEmployee,
  deleteEmployee,
  createEmployee,
} from "../api/employees";
import { register } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function DashboardAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    status: "active",
    password: "",
  });
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    password: "",
    status: "active",
  });
  const [addError, setAddError] = useState("");
  const [updateError, setUpdateError] = useState("");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const formatDepartment = (emp) =>
    emp.department || emp.departmentId || emp.contact?.department || "Chưa cập nhật";
  const formatRole = (emp) =>
    emp.position ||
    (Array.isArray(emp.roles) && emp.roles.length ? emp.roles.join(", ") : emp.status) ||
    "Nhân viên";
  const formatStatus = (emp) => emp.status || "Hoạt động";
  const formatEmail = (emp) => emp.email || emp.contact?.email || "Chưa có email";
  const formatPhone = (emp) => emp.phone || emp.contact?.phone || "Chưa có số điện thoại";
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) => {
      const fields = [
        emp.fullName,
        emp.email,
        emp.phone,
        emp.department,
        emp.departmentId,
        emp.position,
        ...(Array.isArray(emp.roles) ? emp.roles : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [employees, searchTerm]);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateEmployee(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      setEditing(null);
      setUpdateError("");
    },
    onError: (err) => {
      setUpdateError(err?.response?.data?.message || "Cập nhật thất bại");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      // Gọi register để tạo tài khoản + employee (backend auto tạo employee)
      await register(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      setAdding(false);
      setAddForm({
        fullName: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        password: "",
        status: "active",
      });
      setAddError("");
    },
    onError: (err) => {
      setAddError(err?.response?.data?.message || "Thêm nhân viên thất bại");
    },
  });

  const openEdit = (emp) => {
    setEditing(emp);
    setUpdateError("");
    setForm({
      fullName: emp.fullName || "",
      email: emp.email || emp.contact?.email || "",
      phone: emp.phone || emp.contact?.phone || "",
      department: emp.department || emp.departmentId || "",
      position: emp.position || "",
      status: emp.status || "active",
      password: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    setUpdateError("");
    const payload = {
      fullName: form.fullName,
      position: form.position,
      departmentId: form.department,
      status: form.status,
      password: form.password || undefined,
      contact: {
        email: form.email,
        phone: form.phone,
      },
    };
    updateMutation.mutate({ id: editing._id, payload });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="brand">
          <div className="brand-logo">HR</div>
          <div className="brand-text">
            <div className="brand-title">HR System</div>
            <div className="brand-sub">Admin Panel</div>
          </div>
        </div>
        <nav className="nav">
          <button className="nav-item active">Quản lý nhân viên</button>
          <button className="nav-item">Quản lý ca làm</button>
          <button className="nav-item">Chấm công</button>
          <button className="nav-item">Duyệt đơn</button>
          <button className="nav-item">Tính lương</button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Quản lý nhân viên</h1>
            <p>Thêm, sửa, khóa tài khoản và phân vai trò nhân viên</p>
          </div>
          <div className="admin-user">
            <div className="avatar-circle small">
              {user?.email?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <div className="avatar-name">{user?.fullName || user?.email}</div>
              <div className="avatar-role">Quản trị viên</div>
            </div>
          </div>
        </header>

        <div className="admin-toolbar">
          <input
            className="search-input"
            placeholder="Tìm kiếm nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="primary-btn" onClick={() => setAdding(true)}>
            + Thêm nhân viên
          </button>
        </div>

        <section className="admin-cards">
          {isLoading ? (
            <p>Đang tải...</p>
          ) : (
            filtered.map((emp) => (
              <div key={emp._id} className="employee-card">
                <div className="card-top">
                  <div className="avatar-circle">{(emp.fullName || emp.email || "N")[0]}</div>
                  <div className="status-pill active">{formatStatus(emp)}</div>
                </div>
                <div className="card-body">
                  <div className="emp-name">{emp.fullName || "Chưa có tên"}</div>
                  <div className="role-tag">{formatRole(emp)}</div>
                  <div className="info-line">
                    <span className="icon">✉️</span>
                    <span>{formatEmail(emp)}</span>
                  </div>
                  <div className="info-line">
                    <span className="icon">📞</span>
                    <span>{formatPhone(emp)}</span>
                  </div>
                  <div className="info-line">
                    <span className="icon">🏢</span>
                    <span>{formatDepartment(emp)}</span>
                  </div>
                  <div className="info-line">
                    <span className="icon">🎯</span>
                    <span>{formatRole(emp)}</span>
                  </div>
                </div>
                <div className="card-actions">
                  <button className="secondary-btn" onClick={() => openEdit(emp)}>
                    ✏️ Sửa
                  </button>
                  <button
                    className="danger-btn"
                    onClick={() => {
                      if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
                        deleteMutation.mutate(emp._id);
                      }
                    }}
                  >
                    🗑 Xóa
                  </button>
                </div>
              </div>
            ))
          )}
          {!isLoading && filtered.length === 0 && (
            <p>Chưa có nhân viên</p>
          )}
        </section>

        {adding && (
          <div className="modal-backdrop" onClick={() => setAdding(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Thêm nhân viên</h3>
              </div>
              <div className="modal-body">
                {addError && <div className="error">{addError}</div>}
                <form
                  className="info-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setAddError("");
                    if (!addForm.phone || !addForm.email || !addForm.fullName || !addForm.password) {
                      setAddError("Vui lòng nhập đầy đủ họ tên, email, mật khẩu, số điện thoại");
                      return;
                    }
                    createMutation.mutate({
                      email: addForm.email,
                      password: addForm.password || "changeme123",
                      fullName: addForm.fullName,
                      phone: addForm.phone,
                      position: addForm.position,
                      department: addForm.department,
                      roles: ["employee"],
                    });
                  }}
                >
                  <label>
                    Họ tên
                    <input
                      type="text"
                      value={addForm.fullName}
                      onChange={(e) =>
                        setAddForm({ ...addForm, fullName: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Mật khẩu
                    <input
                      type="password"
                      value={addForm.password}
                      onChange={(e) =>
                        setAddForm({ ...addForm, password: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    required
                    />
                  </label>
                  <label>
                    Số điện thoại
                    <input
                      type="tel"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    required
                    />
                  </label>
                  <label>
                    Phòng ban
                    <input
                      type="text"
                      value={addForm.department}
                      onChange={(e) =>
                        setAddForm({ ...addForm, department: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Vị trí
                    <input
                      type="text"
                      value={addForm.position}
                      onChange={(e) =>
                        setAddForm({ ...addForm, position: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Trạng thái
                    <select
                      value={addForm.status}
                      onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Khóa</option>
                    </select>
                  </label>
                  <div className="form-actions">
                    <button type="button" onClick={() => setAdding(false)}>
                      Hủy
                    </button>
                    <button type="submit" disabled={createMutation.isLoading}>
                      {createMutation.isLoading ? "Đang lưu..." : "Thêm"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {editing && (
          <div className="modal-backdrop" onClick={() => setEditing(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Chỉnh sửa nhân viên</h3>
              </div>
              <div className="modal-body">
                {updateError && <div className="error">{updateError}</div>}
                <form className="info-form" onSubmit={handleSubmit}>
                  <label>
                    Họ tên
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </label>
                  <label>
                    Số điện thoại
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </label>
                  <label>
                    Phòng ban
                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                    />
                  </label>
                  <label>
                    Vị trí
                    <input
                      type="text"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                    />
                  </label>
                  <label>
                    Trạng thái
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Khóa</option>
                    </select>
                  </label>
                  <label>
                    Mật khẩu (đổi mới)
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Để trống nếu không đổi"
                    />
                  </label>
                  <div className="form-actions">
                    <button type="button" onClick={() => setEditing(null)}>
                      Hủy
                    </button>
                    <button type="submit" disabled={updateMutation.isLoading}>
                      {updateMutation.isLoading ? "Đang lưu..." : "Lưu"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

