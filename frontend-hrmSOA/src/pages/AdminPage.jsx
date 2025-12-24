import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmployeeTable from '../components/EmployeeTable';
import { useAuth } from '../context/AuthContext';

function AdminPage() {
  const { client, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    salary: ''
  });

  const fetchEmployees = async () => {
    try {
      const { data } = await client.get('/admin/employees');
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [client]);

  const filtered = useMemo(() => {
    if (!filter) return employees;
    return employees.filter((e) =>
      [e.full_name, e.fullName, e.email, e.position, e.department]
        .join(' ')
        .toLowerCase()
        .includes(filter.toLowerCase())
    );
  }, [employees, filter]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold">
            HR
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">HRM Core</p>
            <p className="text-sm font-semibold">Enterprise SOA</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { label: 'Tổng quan', icon: '🏠', path: '/home' },
            { label: 'Nhân viên', icon: '👥', path: '/admin' },
            { label: 'Phòng ban', icon: '🏢', path: '/departments' },
            { label: 'Lương thưởng', icon: '💰', path: '/payroll' },
          ].map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                type="button"
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'hover:bg-slate-800'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-2 rounded-lg">
            <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-white">S</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Đang trực tuyến</p>
              <p className="text-xs text-slate-400">Quản trị viên</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-white text-lg" title="Đăng xuất">
              ↪
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Nhân viên</p>
            <h1 className="text-2xl font-bold text-slate-900">Nhân sự</h1>
            <p className="text-sm text-slate-500">Quản lý hồ sơ và thông tin nhân viên toàn công ty.</p>
          </div>
          <div className="text-sm text-slate-500">
            <p>Hôm nay</p>
            <p className="font-semibold text-slate-700">{new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </header>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-200 flex-1">
            <span className="text-slate-400">🔍</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Tìm kiếm nhân viên theo tên, email..."
              className="w-full outline-none text-sm text-slate-700"
            />
          </div>
          <button className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-200">
            ⚙ Bộ lọc: Tất cả
          </button>
          <button
            className="px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-300 hover:bg-indigo-700"
            onClick={() => {
              setAddForm({ full_name: '', email: '', password: '', confirm_password: '', salary: '' });
              setAdding(true);
            }}
          >
            + Thêm nhân viên
          </button>
        </div>

        <EmployeeTable
          employees={filtered}
          expandedIds={expandedIds}
          onView={(emp) => {
            const id = emp.id || emp.userId || emp._id;
            setExpandedIds((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
          onEdit={(emp) => {
            const profile = emp.profile || {};
            setEditing({
              id: emp.id || emp.userId || emp._id,
              email: emp.email || profile.email || '',
              full_name: emp.full_name || emp.fullName || profile.full_name || profile.fullName || '',
              department: emp.department || profile.department || '',
              position: emp.position || profile.position || '',
              phone: profile.phone || '',
              address: profile.address || '',
              dob: profile.dob || '',
              salary: profile.salary ?? ''
            });
          }}
          onRemove={async (emp) => {
            if (!window.confirm(`Xóa nhân viên ${emp.full_name || emp.email}?`)) return;
            try {
              await client.delete(`/admin/employees/${emp.id || emp.userId || emp._id}`);
              await fetchEmployees();
            } catch (err) {
              alert(err.response?.data?.message || err.message);
            }
          }}
        />
        {editing && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Chỉnh sửa nhân viên</h3>
                <button
                  className="text-slate-500 hover:text-slate-800"
                  onClick={() => setEditing(null)}
                >
                  ✕
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 font-medium">Email</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={editing.email}
                    onChange={(e) => setEditing((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 font-medium">Họ và tên</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={editing.full_name}
                    onChange={(e) => setEditing((prev) => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 font-medium">Phòng ban</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={editing.department}
                    onChange={(e) => setEditing((prev) => ({ ...prev, department: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 font-medium">Chức vụ</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={editing.position}
                    onChange={(e) => setEditing((prev) => ({ ...prev, position: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 font-medium">Số điện thoại</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={editing.phone}
                    onChange={(e) => setEditing((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 font-medium">Địa chỉ</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={editing.address}
                    onChange={(e) => setEditing((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 font-medium">Ngày sinh</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={editing.dob || ''}
                    onChange={(e) => setEditing((prev) => ({ ...prev, dob: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 font-medium">Lương cơ bản</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={editing.salary || ''}
                    onChange={(e) => setEditing((prev) => ({ ...prev, salary: e.target.value }))}
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

        {adding && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Thêm nhân viên</h3>
                <button className="text-slate-500 hover:text-slate-800" onClick={() => setAdding(false)}>
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-600 font-medium">Họ và tên</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={addForm.full_name}
                    onChange={(e) => setAddForm((p) => ({ ...p, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 font-medium">Email</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={addForm.email}
                    onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-600 font-medium">Mật khẩu</label>
                    <input
                      type="password"
                      className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                      value={addForm.password}
                      onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 font-medium">Nhập lại mật khẩu</label>
                    <input
                      type="password"
                      className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                      value={addForm.confirm_password}
                      onChange={(e) => setAddForm((p) => ({ ...p, confirm_password: e.target.value }))}
                    />
                  </div>
                </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-600 font-medium">Lương cơ bản</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={addForm.salary}
                    onChange={(e) => setAddForm((p) => ({ ...p, salary: e.target.value }))}
                  />
                </div>
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
                      alert('Mật khẩu nhập lại không khớp');
                      return;
                    }
                    try {
                      await client.post('/admin/employees', addForm);
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

