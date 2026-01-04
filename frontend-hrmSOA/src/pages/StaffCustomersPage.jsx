import React, { useEffect, useMemo, useState } from "react";
import StaffSidebar from "../components/StaffSidebar";
import { useAuth } from "../context/AuthContext";

export default function StaffCustomersPage() {
  const { client, token } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    industry: "",
    status: "lead",
    tags: "",
  });

  const [importing, setImporting] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importReport, setImportReport] = useState(null);
  const [importErr, setImportErr] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Edit customer state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    industry: "",
    status: "lead",
    tags: "",
  });

  const [logModal, setLogModal] = useState({
    open: false,
    loading: false,
    items: [],
    customer: null,
    error: "",
  });

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const statusBadge = (st) => {
    const s = st || "lead";
    if (s === "active") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    if (s === "inactive") return "bg-slate-100 text-slate-600 border border-slate-200";
    return "bg-amber-100 text-amber-700 border border-amber-200";
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await client.get("/crm/customers", {
        headers: authHeaders,
        params: { page: 1, limit: 500 },
      });
      setCustomers(data || []);
      await fetchCustomerCount(); // count thật từ API để không bị cắt bởi limit
    } catch (err) {
      console.error(err);
      setCustomers([]);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      if (status === 401) {
        setError(serverMsg || "401 Unauthorized: phiên đăng nhập không hợp lệ. Hãy đăng xuất và đăng nhập lại.");
      } else if (status === 403) {
        setError(serverMsg || "403 Forbidden: bạn không có quyền truy cập dữ liệu này.");
      } else if (status === 503) {
        setError(serverMsg || "CRM database chưa sẵn sàng (503). Hãy kiểm tra MongoDB và MONGO_URL.");
      } else {
        setError(serverMsg || "Không tải được danh sách khách hàng (CRM service có thể chưa chạy).");
      }
    } finally {
      setLoading(false);
    }
  };

  const openLogs = async (customer) => {
    const id = customer?.id || customer?._id;
    if (!id) return;
    setLogModal((p) => ({ ...p, open: true, loading: true, customer, error: "", items: [] }));
    try {
      const { data } = await client.get(`/crm/customers/${id}/logs`, {
        params: { page: 1, limit: 50 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setLogModal((p) => ({ ...p, loading: false, items: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error(err);
      setLogModal((p) => ({
        ...p,
        loading: false,
        items: [],
        error: err?.response?.data?.message || err?.message || "Không tải được nhật ký",
      }));
    }
  };

  const fetchCustomerCount = async () => {
    try {
      const { data } = await client.get("/crm/customers/count", {
        headers: authHeaders,
      });
      if (typeof data?.count === "number") setCustomerCount(data.count);
    } catch (err) {
      // ignore, fallback to list length
    }
  };

  const exportToExcel = async () => {
    try {
      const xlsx = await import("xlsx");
      const rows = (customers || []).map((c, idx) => ({
        STT: idx + 1,
        "Tên khách hàng": c.name || "",
        Email: c.email || "",
        "Số điện thoại": c.phone || "",
        "Địa chỉ": c.address || "",
        "Người phụ trách": c.ownerName || "",
        "Trạng thái": c.status || "",
        Tags: Array.isArray(c.tags) ? c.tags.join(";") : c.tags || ""
      }));
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Customers");
      xlsx.writeFile(wb, `customers_staff_${Date.now()}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Xuất Excel thất bại. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchCustomers();
    fetchCustomerCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    const list = [...customers];
    if (!filter) return list;
    const q = filter.toLowerCase();
    return list.filter((c) => {
      const text = `${c.name || ""} ${c.email || ""} ${c.phone || ""} ${c.industry || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [customers, filter]);

  const handleCreate = async () => {
    if (!addForm.name.trim()) {
      alert("Tên khách hàng là bắt buộc");
      return;
    }

    const tagsArr = String(addForm.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await client.post(
        "/crm/customers",
        {
          name: addForm.name.trim(),
          email: addForm.email.trim(),
          phone: addForm.phone.trim(),
          address: addForm.address.trim(),
          industry: addForm.industry.trim(),
          status: addForm.status,
          tags: tagsArr,
        },
        { headers: authHeaders }
      );

      setAdding(false);
      setAddForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        industry: "",
        status: "lead",
        tags: "",
      });
      await fetchCustomers();
      await fetchCustomerCount();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Tạo khách hàng thất bại");
    }
  };

  const handleDelete = async (c) => {
    const id = c.id || c._id;
    if (!id) return;
    if (!window.confirm(`Xóa khách hàng "${c.name}"?`)) return;
    try {
      await client.delete(`/crm/customers/${id}`, { headers: authHeaders });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await fetchCustomers();
      await fetchCustomerCount();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Xóa khách hàng thất bại");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Xóa ${selectedIds.size} khách hàng đã chọn?`)) return;
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) => client.delete(`/crm/customers/${id}`, { headers: authHeaders }))
      );
      setSelectedIds(new Set());
      await fetchCustomers();
      await fetchCustomerCount();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Xóa thất bại");
    }
  };

  const handleDeleteAll = async () => {
    if (filtered.length === 0) return;
    if (!window.confirm(`Xóa TẤT CẢ ${filtered.length} khách hàng? Hành động này không thể hoàn tác!`)) return;
    try {
      const ids = filtered.map((c) => c.id || c._id).filter(Boolean);
      await Promise.all(
        ids.map((id) => client.delete(`/crm/customers/${id}`, { headers: authHeaders }))
      );
      setSelectedIds(new Set());
      await fetchCustomers();
      await fetchCustomerCount();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Xóa thất bại");
    }
  };

  const handleEdit = (customer) => {
    const tags = Array.isArray(customer.tags) ? customer.tags.join(", ") : (customer.tags || "");
    setEditForm({
      id: customer.id || customer._id,
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      industry: customer.industry || "",
      status: customer.status || "lead",
      tags: tags,
    });
    setEditing(true);
  };

  const handleUpdate = async () => {
    if (!editForm.name.trim()) {
      alert("Tên khách hàng là bắt buộc");
      return;
    }

    const tagsArr = String(editForm.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await client.put(
        `/crm/customers/${editForm.id}`,
        {
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          address: editForm.address.trim(),
          industry: editForm.industry.trim(),
          status: editForm.status,
          tags: tagsArr,
        },
        { headers: authHeaders }
      );
      setEditing(false);
      setEditForm({
        id: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        industry: "",
        status: "lead",
        tags: "",
      });
      await fetchCustomers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Cập nhật khách hàng thất bại");
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
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id || c._id)));
    }
  };

  // ===== Import helpers (CSV/JSON) =====
  const splitCsvLine = (line) => {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out.map((s) => String(s ?? "").trim());
  };

  const parseCsv = (text) => {
    const cleaned = String(text || "").replace(/^\uFEFF/, "");
    const lines = cleaned
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return [];

    const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    const idx = (key) => headers.findIndex((h) => h === key);
    const nameIdx = idx("name");
    if (nameIdx < 0) {
      throw new Error('CSV thiếu cột "name" (bắt buộc). Ví dụ header: name,email,phone,address,industry,status,tags');
    }

    const emailIdx = idx("email");
    const phoneIdx = idx("phone");
    const addressIdx = idx("address");
    const industryIdx = idx("industry");
    const statusIdx = idx("status");
    const tagsIdx = idx("tags");

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]);
      const name = String(cols[nameIdx] || "").trim();
      if (!name) continue;
      const tagsCell = tagsIdx >= 0 ? String(cols[tagsIdx] || "") : "";
      const tags = tagsCell
        .split(/[|;]/g)
        .map((t) => t.trim())
        .filter(Boolean);
      rows.push({
        name,
        email: emailIdx >= 0 ? String(cols[emailIdx] || "").trim() : "",
        phone: phoneIdx >= 0 ? String(cols[phoneIdx] || "").trim() : "",
        address: addressIdx >= 0 ? String(cols[addressIdx] || "").trim() : "",
        industry: industryIdx >= 0 ? String(cols[industryIdx] || "").trim() : "",
        status: statusIdx >= 0 ? String(cols[statusIdx] || "").trim() : "lead",
        tags,
      });
    }
    return rows;
  };

  const parseJsonCustomers = (text) => {
    const cleaned = String(text || "").replace(/^\uFEFF/, "");
    const data = JSON.parse(cleaned);
    const arr = Array.isArray(data) ? data : data?.customers;
    if (!Array.isArray(arr)) {
      throw new Error('JSON phải là mảng hoặc { "customers": [...] }');
    }
    return arr
      .map((c) => ({
        name: String(c?.name || c?.full_name || c?.fullName || "").trim(),
        email: String(c?.email || "").trim(),
        phone: String(c?.phone || "").trim(),
        address: String(c?.address || "").trim(),
        industry: String(c?.industry || "").trim(),
        status: String(c?.status || "lead").trim(),
        tags: Array.isArray(c?.tags) ? c.tags : [],
      }))
      .filter((c) => c.name);
  };

  const handlePickImportFile = () => {
    setImportErr("");
    setImportReport(null);
    setImportPreview([]);
    setImportModal(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportErr("");
    setImportReport(null);
    try {
      const text = await file.text();
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const parsed = ext === "json" ? parseJsonCustomers(text) : ext === "csv" ? parseCsv(text) : null;
      if (!parsed) throw new Error("Chỉ hỗ trợ file .json hoặc .csv");
      setImportPreview(parsed);
    } catch (err) {
      console.error(err);
      setImportPreview([]);
      setImportErr(err?.message || "Không đọc/parse được file");
    } finally {
      e.target.value = "";
    }
  };

  const handleImport = async () => {
    if (importPreview.length === 0) {
      setImportErr("Không có dữ liệu để import.");
      return;
    }
    setImporting(true);
    setImportErr("");
    setImportReport(null);
    try {
      const { data } = await client.post(
        "/crm/customers/import",
        { customers: importPreview },
        { headers: authHeaders }
      );
      setImportReport(data || null);
      await fetchCustomers();
    } catch (err) {
      console.error(err);
      setImportErr(err.response?.data?.message || err.message || "Import thất bại");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="h-screen bg-white text-slate-900 flex overflow-hidden">
      <StaffSidebar />

      <main className="flex-1 bg-slate-50 p-8 space-y-6 overflow-y-auto">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Khách hàng</p>
            <h1 className="text-2xl font-bold text-slate-900">Danh sách khách hàng của tôi</h1>
            <p className="text-sm text-slate-500">
              Nhân viên chỉ xem và quản lý khách hàng do mình phụ trách (owner-based).
            </p>
          </div>
          <div className="text-sm text-slate-500 text-right">
            <p>Hôm nay</p>
            <p className="font-semibold text-slate-700">{new Date().toLocaleDateString("vi-VN")}</p>
          </div>
        </header>

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4">
            <div className="font-semibold">Không thể tải danh sách</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-200 flex-1 min-w-[260px]">
            <span className="text-slate-400">🔍</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              className="w-full outline-none text-sm text-slate-700"
            />
          </div>

          <button
            onClick={fetchCustomers}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-200"
          >
            ⟳ Tải lại
          </button>

          <button
            onClick={handlePickImportFile}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-200"
          >
            ⬆ Nhập file
          </button>

          <button
            onClick={exportToExcel}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-200"
          >
            ⬇ Xuất Excel
          </button>

          <button
            onClick={() => setAdding(true)}
            className="px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-300 hover:bg-indigo-700"
          >
            + Thêm khách hàng
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div className="font-semibold text-slate-800">
              Danh sách{" "}
              <span className="text-slate-500 text-sm font-normal">
                ({customerCount || filtered.length})
              </span>
              {selectedIds.size > 0 && (
                <span className="ml-2 text-indigo-600 text-sm font-normal">
                  • Đã chọn {selectedIds.size}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {loading && <div className="text-sm text-slate-500">Đang tải...</div>}
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600"
                >
                  🗑 Xóa đã chọn ({selectedIds.size})
                </button>
              )}
              {filtered.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200"
                >
                  Xóa tất cả
                </button>
              )}
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="text-center px-2 py-3 font-semibold w-12">STT</th>
                  <th className="text-left px-4 py-3 font-semibold">Tên</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">SĐT</th>
                  <th className="text-left px-4 py-3 font-semibold">Ngành</th>
                  <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="text-right px-4 py-3 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={8}>
                      Chưa có khách hàng nào.
                    </td>
                  </tr>
                )}

                {filtered.map((c, index) => {
                  const cId = c.id || c._id;
                  return (
                    <tr key={cId} className={`border-t border-slate-100 hover:bg-slate-50 ${selectedIds.has(cId) ? "bg-indigo-50" : ""}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(cId)}
                          onChange={() => toggleSelect(cId)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="text-center px-2 py-3 text-slate-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                      <td className="px-4 py-3 text-slate-600">{c.email || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{c.phone || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{c.industry || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${statusBadge(
                            c.status
                          )}`}
                        >
                          {c.status || "lead"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100"
                        >
                          Xóa
                        </button>
                        <button
                          onClick={() => openLogs(c)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                        >
                          Nhật ký
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add modal */}
        {adding && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Thêm khách hàng</h3>
                <button className="text-slate-500 hover:text-slate-800" onClick={() => setAdding(false)}>
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 font-medium">Tên khách hàng *</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={addForm.name}
                    onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="VD: Công ty ABC"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">Trạng thái</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={addForm.status}
                    onChange={(e) => setAddForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="lead">lead</option>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">Email</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={addForm.email}
                    onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="contact@abc.com"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">Số điện thoại</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={addForm.phone}
                    onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="090..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-slate-600 font-medium">Địa chỉ</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={addForm.address}
                    onChange={(e) => setAddForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="VD: 123 Nguyễn Trãi, Q1..."
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">Ngành</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={addForm.industry}
                    onChange={(e) => setAddForm((p) => ({ ...p, industry: e.target.value }))}
                    placeholder="VD: Retail"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">Tags (phân tách bằng dấu ,)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={addForm.tags}
                    onChange={(e) => setAddForm((p) => ({ ...p, tags: e.target.value }))}
                    placeholder="vip, hanoi, ..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50"
                  onClick={() => setAdding(false)}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                  onClick={handleCreate}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Sửa thông tin khách hàng</h3>
                <button className="text-slate-500 hover:text-slate-800" onClick={() => setEditing(false)}>
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 font-medium">Tên khách hàng *</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="VD: Công ty ABC"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">Trạng thái</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editForm.status}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="lead">lead</option>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">Email</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="contact@abc.com"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">Số điện thoại</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="090..."
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium">Ngành nghề</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editForm.industry}
                    onChange={(e) => setEditForm((p) => ({ ...p, industry: e.target.value }))}
                    placeholder="VD: Retail, IT, ..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-slate-600 font-medium">Địa chỉ</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editForm.address}
                    onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="VD: 123 Nguyễn Trãi, Q1..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-slate-600 font-medium">Tags (phân tách bằng dấu ,)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editForm.tags}
                    onChange={(e) => setEditForm((p) => ({ ...p, tags: e.target.value }))}
                    placeholder="vip, hanoi, ..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50"
                  onClick={() => setEditing(false)}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                  onClick={handleUpdate}
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Log modal */}
        {logModal.open && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Nhật ký khách hàng</h3>
                  <p className="text-sm text-slate-500">
                    {logModal.customer?.name || "Khách hàng"} • Hiển thị tối đa 50 log gần nhất
                  </p>
                </div>
                <button
                  className="text-slate-500 hover:text-slate-800"
                  onClick={() => setLogModal((p) => ({ ...p, open: false }))}
                >
                  ✕
                </button>
              </div>

              {logModal.error && (
                <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-lg border border-rose-100">
                  {logModal.error}
                </div>
              )}

              <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100">
                {logModal.loading && <p className="text-sm text-slate-500 py-2">Đang tải...</p>}
                {!logModal.loading && logModal.items.length === 0 && (
                  <p className="text-sm text-slate-500 py-2">Chưa có nhật ký.</p>
                )}
                {logModal.items.map((log) => (
                  <div key={log.id} className="py-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-indigo-600">{log.actorEmail || "N/A"}</span>
                        <span className="text-slate-400">•</span>
                        <span className="capitalize font-semibold">{log.action}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString("vi-VN")
                          : new Date(log.updatedAt || "").toLocaleString("vi-VN")}
                      </div>
                    </div>
                    {log.meta && (
                      <div className="text-xs text-slate-500">
                        {log.meta.created !== undefined && (
                          <span className="mr-2">Tạo: {log.meta.created}</span>
                        )}
                        {log.meta.skipped !== undefined && (
                          <span className="mr-2">Bỏ qua: {log.meta.skipped}</span>
                        )}
                        {log.meta.errors !== undefined && <span>Lỗi: {log.meta.errors}</span>}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 break-words">
                      {log.before && (
                        <span className="mr-2">
                          Trước: <code className="bg-slate-50 px-1 rounded">{JSON.stringify(log.before)}</code>
                        </span>
                      )}
                      {log.after && (
                        <span>
                          Sau: <code className="bg-slate-50 px-1 rounded">{JSON.stringify(log.after)}</code>
                        </span>
                      )}
                      {!log.before && !log.after && !log.meta && (
                        <span className="text-slate-400">Không có chi tiết.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Import modal */}
        {importModal && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Nhập danh sách khách hàng</h3>
                <button
                  className="text-slate-500 hover:text-slate-800"
                  onClick={() => setImportModal(false)}
                  disabled={importing}
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 space-y-1">
                <div className="font-semibold">Định dạng hỗ trợ</div>
                <div>
                  - <span className="font-mono">.json</span>: mảng hoặc{" "}
                  <span className="font-mono">{`{ "customers": [...] }`}</span>
                </div>
                <div>
                  - <span className="font-mono">.csv</span>: header tối thiểu{" "}
                  <span className="font-mono">name</span>, khuyến nghị{" "}
                  <span className="font-mono">name,email,phone,address,industry,status,tags</span>
                </div>
                <div className="text-xs text-slate-500">
                  * Cột <span className="font-mono">tags</span> trong CSV: phân tách bằng{" "}
                  <span className="font-mono">|</span> hoặc <span className="font-mono">;</span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <label className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-200 cursor-pointer">
                  Chọn file (.json/.csv)
                  <input
                    type="file"
                    accept=".json,.csv,application/json,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={importing}
                  />
                </label>

                {importPreview.length > 0 && (
                  <div className="text-sm text-slate-600">
                    Đã đọc <span className="font-semibold">{importPreview.length}</span> dòng
                  </div>
                )}
              </div>

              {importErr && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-3 text-sm">
                  {importErr}
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 border-b border-slate-200">
                    Preview (10 dòng đầu)
                  </div>
                  <div className="overflow-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="text-slate-600">
                        <tr>
                          <th className="text-left px-4 py-2">Tên</th>
                          <th className="text-left px-4 py-2">Email</th>
                          <th className="text-left px-4 py-2">SĐT</th>
                          <th className="text-left px-4 py-2">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((c, idx) => (
                          <tr key={`${c.name}-${idx}`} className="border-t border-slate-100">
                            <td className="px-4 py-2 font-semibold text-slate-800">{c.name}</td>
                            <td className="px-4 py-2 text-slate-600">{c.email || "-"}</td>
                            <td className="px-4 py-2 text-slate-600">{c.phone || "-"}</td>
                            <td className="px-4 py-2 text-slate-600">{c.status || "lead"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importReport && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 text-sm">
                  <div className="font-semibold">Kết quả import</div>
                  <div className="mt-1">
                    Tạo mới: <b>{importReport.createdCount ?? 0}</b> — Bỏ qua:{" "}
                    <b>{importReport.skippedCount ?? 0}</b> — Lỗi:{" "}
                    <b>{importReport.errorCount ?? 0}</b>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50"
                  onClick={() => setImportModal(false)}
                  disabled={importing}
                >
                  Đóng
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
                  onClick={handleImport}
                  disabled={importing || importPreview.length === 0}
                >
                  {importing ? "Đang import..." : "Import"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


