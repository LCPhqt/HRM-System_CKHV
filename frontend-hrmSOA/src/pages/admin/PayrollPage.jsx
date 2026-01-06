import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';

function PayrollPage() {
  const { client } = useAuth();
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [runDetail, setRunDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [creatingRun, setCreatingRun] = useState(false);
  const [showQuickAddRunId, setShowQuickAddRunId] = useState(null);
  const [quickAddForm, setQuickAddForm] = useState({
    user_id: '',
    email: '',
    base_salary: 0,
    bonus: '',
    deductions: 0,
  });
  const [employeesCache, setEmployeesCache] = useState([]);
  const [quickAddSelected, setQuickAddSelected] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({});

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString('vi-VN', { minimumFractionDigits: 0 }) + ' đ';

  const statusMap = {
    paid: { label: 'Đã thanh toán', className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    pending: { label: 'Chờ duyệt chi', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
    draft: { label: 'Nháp', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
  };

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/payroll/runs');
      setRuns(data || []);
      if (!selectedRunId && data && data.length > 0) {
        setSelectedRunId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Không tải được kỳ lương');
    } finally {
      setLoading(false);
    }
  };

  const fetchRunDetail = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await client.get(`/payroll/runs/${id}`);
      setRunDetail(data || null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Không tải được chi tiết kỳ lương');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [client]);

  useEffect(() => {
    if (selectedRunId) fetchRunDetail(selectedRunId);
  }, [selectedRunId]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await client.get('/admin/employees');
        setEmployeesCache(data || []);
      } catch (err) {
        console.error('Cannot load employees for prefill', err);
      }
    };
    if (showQuickAddRunId && employeesCache.length === 0) {
      fetchEmployees();
    }
  }, [showQuickAddRunId, client, employeesCache.length]);

  const items = useMemo(() => runDetail?.items || [], [runDetail]);
  const currentPeriod = runDetail?.period || runs.find((r) => r.id === selectedRunId)?.period || '';

  const handleExport = async () => {
    if (!selectedRunId) return;
    setActionLoading('export');
    try {
      const res = await client.get(`/payroll/runs/${selectedRunId}/export`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payroll-${currentPeriod || 'export'}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Xuất CSV thất bại');
    } finally {
      setActionLoading('');
    }
  };

  const handleRecalc = async () => {
    if (!selectedRunId) return;
    setActionLoading('recalc');
    try {
      await client.post(`/payroll/runs/${selectedRunId}/recalc`);
      await fetchRunDetail(selectedRunId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Tính lương thất bại');
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteRun = async (idToDelete) => {
    if (!idToDelete) return;
    if (!window.confirm('Xóa kỳ lương này? Dữ liệu các dòng lương sẽ bị xóa.')) return;
    setActionLoading('delete');
    try {
      await client.delete(`/payroll/runs/${idToDelete}`);
      setRunDetail(null);
      setSelectedRunId((prev) => (prev === idToDelete ? null : prev));
      await fetchRuns();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Xóa kỳ lương thất bại');
    } finally {
      setActionLoading('');
    }
  };

  const handleCreateRun = async () => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setCreatingRun(true);
    try {
      const { data } = await client.post('/payroll/runs', { period, title: `Kỳ lương ${period}` });
      await fetchRuns();
      setSelectedRunId(data.id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Tạo kỳ lương thất bại');
    } finally {
      setCreatingRun(false);
    }
  };

  const handleAddItem = async () => {
    if (!showQuickAddRunId) {
      alert('Hãy chọn hoặc tạo kỳ lương trước.');
      return;
    }
    if (!quickAddForm.user_id || !quickAddForm.email) {
      alert('Cần ID nhân viên và email.');
      return;
    }
    try {
      const matched =
        quickAddSelected ||
        employeesCache.find(
          (emp) =>
            (emp.id || emp.userId || emp._id) === quickAddForm.user_id || emp.email === quickAddForm.email
        );
      await client.post(`/payroll/runs/${showQuickAddRunId}/items`, {
        user_id: quickAddForm.user_id,
        email: quickAddForm.email,
        base_salary: Number(quickAddForm.base_salary) || 0,
        bonus: Number(quickAddForm.bonus) || 0,
        deductions: Number(quickAddForm.deductions) || 0,
        full_name:
          matched?.full_name || matched?.fullName || matched?.profile?.full_name || matched?.profile?.fullName || '',
        department: matched?.department || matched?.profile?.department || '',
        position: matched?.position || matched?.profile?.position || '',
      });
      setQuickAddForm({
        user_id: '',
        email: '',
        base_salary: 0,
        deductions: 0,
        bonus: '',
      });
      setQuickAddSelected(null);
      setShowQuickAddRunId(null);
      await fetchRunDetail(showQuickAddRunId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Thêm dòng lương thất bại');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingForm({
      base_salary: item.base_salary ?? 0,
      bonus: item.bonus ?? 0,
      deductions: item.deductions ?? 0,
      email: item.email,
      full_name: item.full_name,
      department: item.department,
      position: item.position,
      status: item.status,
    });
  };

  const saveEdit = async (item) => {
    try {
      await client.put(`/payroll/runs/${selectedRunId}/items/${item.id}`, {
        ...editingForm,
        base_salary: Number(editingForm.base_salary) || 0,
        bonus: Number(editingForm.bonus) || 0,
        deductions: Number(editingForm.deductions) || 0,
      });
      setEditingId(null);
      await fetchRunDetail(selectedRunId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Lưu chỉnh sửa thất bại');
    }
  };

  return (
    <div className="h-screen bg-slate-100 text-slate-900 flex overflow-hidden">
      <AdminSidebar />

      {/* Main */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Lương thưởng</p>
            <h1 className="text-2xl font-bold text-slate-900">Bảng lương & Thưởng</h1>
            <p className="text-sm text-slate-500">
              Quản lý, tính toán và xuất chi trả lương cho toàn bộ nhân sự. Đảm bảo chính xác và minh bạch.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            <p>Hôm nay</p>
            <p className="font-semibold text-slate-700">{new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </header>

        {/* Hero card */}
        <div className="w-full rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 text-white p-8 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="text-3xl font-bold">Bảng lương & Thưởng</div>
            <p className="text-indigo-100 max-w-xl">
              Quản lý, tính toán và xuất chi trả lương cho toàn bộ nhân sự. Đảm bảo chính xác và minh bạch.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateRun}
              disabled={creatingRun}
              className="inline-flex items-center gap-2 bg-emerald-500 text-white font-semibold px-4 py-3 rounded-xl shadow-lg shadow-emerald-900/20 hover:bg-emerald-400 disabled:opacity-60"
            >
              ➕ Tạo kỳ lương hiện tại
            </button>
            <button
              onClick={handleExport}
              disabled={!selectedRunId || actionLoading === 'export'}
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-4 py-3 rounded-xl shadow-lg shadow-indigo-900/20 hover:bg-indigo-50 disabled:opacity-60"
            >
              ⬇ Xuất Excel
            </button>
            <button
              onClick={handleRecalc}
              disabled={!selectedRunId || actionLoading === 'recalc'}
              className="inline-flex items-center gap-2 bg-amber-400 text-amber-900 font-semibold px-4 py-3 rounded-xl shadow-lg shadow-amber-500/30 hover:bg-amber-300 disabled:opacity-60"
            >
              🧮 Tính lương kỳ này
            </button>
          </div>
        </div>

        {/* Run selector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-600">Kỳ lương:</span>
          {runs.length === 0 && <span className="text-sm text-slate-500">Chưa có kỳ lương</span>}
          {runs.map((run) => (
            <button
              key={run.id}
              onClick={() => {
                setSelectedRunId(run.id);
                setShowQuickAddRunId(run.id);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition relative ${selectedRunId === run.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-200'
                }`}
            >
              🕒 {run.period}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRun(run.id);
                }}
                className={`ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold ${selectedRunId === run.id
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                title="Xóa kỳ lương"
              >
                ✕
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-4 text-left">Kỳ lương</th>
                  <th className="px-5 py-4 text-left">Thông tin nhân viên</th>
                  <th className="px-5 py-4 text-left">Lương cơ bản</th>
                  <th className="px-5 py-4 text-left">Thưởng / Phụ cấp</th>
                  <th className="px-5 py-4 text-left">Khấu trừ</th>
                  <th className="px-5 py-4 text-left">Thực nhận</th>
                  <th className="px-5 py-4 text-left">Trạng thái</th>
                  <th className="px-5 py-4 text-left">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      Chưa có dữ liệu lương cho kỳ này.
                    </td>
                  </tr>
                )}
                {!loading &&
                  items.map((item) => {
                    const status = statusMap[item.status] || statusMap.pending;
                    const isEditing = editingId === item.id;
                    return (
                      <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                            🕒 {currentPeriod || item.period || '---'}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800">{item.full_name || item.email}</div>
                          <div className="text-xs text-slate-500">{item.position || 'Đang cập nhật'}</div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              className="w-32 border rounded-lg px-2 py-1 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                              value={editingForm.base_salary}
                              onChange={(e) => setEditingForm((p) => ({ ...p, base_salary: e.target.value }))}
                            />
                          ) : (
                            formatMoney(item.base_salary)
                          )}
                        </td>
                        <td className="px-5 py-4 font-semibold text-emerald-600">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              className="w-32 border rounded-lg px-2 py-1 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                              value={editingForm.bonus}
                              onChange={(e) => setEditingForm((p) => ({ ...p, bonus: e.target.value }))}
                            />
                          ) : (
                            formatMoney(item.bonus)
                          )}
                        </td>
                        <td className="px-5 py-4 font-semibold text-rose-600">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              className="w-32 border rounded-lg px-2 py-1 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                              value={editingForm.deductions}
                              onChange={(e) => setEditingForm((p) => ({ ...p, deductions: e.target.value }))}
                            />
                          ) : (
                            formatMoney(item.deductions)
                          )}
                        </td>
                        <td className="px-5 py-4 font-semibold text-indigo-700">{formatMoney(item.net)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(item)}
                                className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-semibold"
                              >
                                Lưu
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(item)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200"
                            >
                              Sửa
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick add modal */}
        {showQuickAddRunId && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Thêm dòng lương nhanh</h3>
                  <p className="text-sm text-slate-500">Kỳ lương: {runs.find((r) => r.id === showQuickAddRunId)?.period}</p>
                </div>
                <button
                  onClick={() => setShowQuickAddRunId(null)}
                  className="text-slate-500 hover:text-slate-800 text-lg"
                >
                  ✕
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 font-medium">ID nhân viên</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={quickAddForm.user_id}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuickAddForm((p) => ({ ...p, user_id: val }));
                      const found = employeesCache.find(
                        (emp) =>
                          (emp.id || emp.userId || emp._id) === val || (emp.email && emp.email === quickAddForm.email)
                      );
                      if (found) {
                        setQuickAddSelected(found);
                        setQuickAddForm((p) => ({
                          ...p,
                          base_salary: found.profile?.salary ?? found.salary ?? 0,
                          user_id: val,
                          email: found.email || p.email,
                        }));
                      }
                      if (!val) setQuickAddSelected(null);
                    }}
                    placeholder="Nhập user_id"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 font-medium">Email</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={quickAddForm.email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuickAddForm((p) => ({ ...p, email: val }));
                      const found = employeesCache.find(
                        (emp) =>
                          emp.email === val || (emp.id || emp.userId || emp._id) === quickAddForm.user_id
                      );
                      if (found) {
                        setQuickAddSelected(found);
                        setQuickAddForm((p) => ({
                          ...p,
                          base_salary: found.profile?.salary ?? found.salary ?? 0,
                          email: val,
                          user_id: found.id || found.userId || found._id || p.user_id,
                        }));
                      }
                      if (!val) setQuickAddSelected(null);
                    }}
                    placeholder="Email nhân viên"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 font-medium">Thưởng</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={quickAddForm.bonus}
                    onChange={(e) => setQuickAddForm((p) => ({ ...p, bonus: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 font-medium">Khấu trừ</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={quickAddForm.deductions}
                    onChange={(e) => setQuickAddForm((p) => ({ ...p, deductions: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-100"
                  onClick={() => setShowQuickAddRunId(null)}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                  onClick={handleAddItem}
                >
                  Lưu dòng lương
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PayrollPage;


