import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";

function CRMPage() {
  const { client, token, role } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [importing, setImporting] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importReport, setImportReport] = useState(null);
  const [importErr, setImportErr] = useState("");

  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    cccd: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "lead",
    ownerId: "",
    ownerName: "",
  });
  const [employees, setEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Edit customer state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    cccd: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "lead",
    ownerId: "",
    ownerName: "",
  });

  const [logModal, setLogModal] = useState({
    open: false,
    loading: false,
    items: [],
    customer: null,
    error: "",
  });

  const splitCsvLine = (line) => {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // escaped quote
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
    const cleaned = String(text || "").replace(/^\uFEFF/, ""); // strip BOM
    const lines = cleaned
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return [];

    const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    const idx = (key) => headers.findIndex((h) => h === key);
    const nameIdx = idx("name");

    if (nameIdx < 0) {
      throw new Error('CSV thiếu cột "name" (bắt buộc). Ví dụ header: name,cccd,email,phone,address,status');
    }

    const cccdIdx = idx("cccd");
    const emailIdx = idx("email");
    const phoneIdx = idx("phone");
    const addressIdx = idx("address");
    const statusIdx = idx("status");

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]);
      const name = String(cols[nameIdx] || "").trim();
      if (!name) continue;
      rows.push({
        name,
        cccd: cccdIdx >= 0 ? String(cols[cccdIdx] || "").trim() : "",
        email: emailIdx >= 0 ? String(cols[emailIdx] || "").trim() : "",
        phone: phoneIdx >= 0 ? String(cols[phoneIdx] || "").trim() : "",
        address: addressIdx >= 0 ? String(cols[addressIdx] || "").trim() : "",
        status: statusIdx >= 0 ? String(cols[statusIdx] || "").trim() : "lead"
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
        cccd: String(c?.cccd || "").trim(),
        email: String(c?.email || "").trim(),
        phone: String(c?.phone || "").trim(),
        address: String(c?.address || "").trim(),
        status: String(c?.status || "lead").trim()
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
      const parsed =
        ext === "json" ? parseJsonCustomers(text) : ext === "csv" ? parseCsv(text) : null;
      if (!parsed) throw new Error("Chỉ hỗ trợ file .json hoặc .csv");
      setImportPreview(parsed);
    } catch (err) {
      console.error(err);
      setImportPreview([]);
      setImportErr(err?.message || "Không đọc/parse được file");
    } finally {
      // reset input để có thể chọn lại cùng file
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
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
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

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await client.get("/crm/customers", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { page: 1, limit: 500 }, // tăng limit để tránh chỉ lấy 50 mặc định
      });
      setCustomers(data || []);
      await fetchCustomerCount(); // luôn lấy count thật từ API (không dựa vào limit cắt)
    } catch (err) {
      console.error(err);
      setCustomers([]);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      if (status === 401) {
        setError(serverMsg || "401 Unauthorized: phiên đăng nhập không hợp lệ. Hãy đăng xuất và đăng nhập lại.");
      } else if (status === 503) {
        setError(serverMsg || "CRM database chưa sẵn sàng (503). Hãy kiểm tra MongoDB và MONGO_URL.");
      } else {
        setError(serverMsg || "Không tải được danh sách khách hàng (CRM service có thể chưa chạy).");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj || "");
    }
  };

  const actionStyle = (action) => {
    const map = {
      create: "bg-emerald-50 text-emerald-700 border-emerald-100",
      update: "bg-amber-50 text-amber-700 border-amber-100",
      delete: "bg-rose-50 text-rose-700 border-rose-100",
      restore: "bg-blue-50 text-blue-700 border-blue-100",
      import: "bg-indigo-50 text-indigo-700 border-indigo-100",
    };
    return map[action] || "bg-slate-50 text-slate-700 border-slate-100";
  };

  const actionIcon = (action) => {
    const map = {
      create: "➕",
      update: "✏️",
      delete: "🗑️",
      restore: "♻️",
      import: "⬇️",
    };
    return map[action] || "🛈";
  };

  const logDisplayFields = [
    { key: "name", label: "Tên" },
    { key: "cccd", label: "CCCD" },
    { key: "email", label: "Email" },
    { key: "phone", label: "SĐT" },
    { key: "address", label: "Địa chỉ" },
    { key: "status", label: "Trạng thái" },
    { key: "ownerName", label: "Người phụ trách" },
    { key: "deleted", label: "Đã xóa" },
    { key: "deletedByEmail", label: "Xóa bởi" },
    { key: "deletedAt", label: "Thời gian xóa" },
    { key: "createdAt", label: "Ngày tạo" },
    { key: "updatedAt", label: "Ngày sửa" },
  ];

  const formatFieldValue = (key, val) => {
    if (val === undefined || val === null) return "—";
    if (key === "deleted") return val ? "Có" : "Không";
    if (["createdAt", "updatedAt", "deletedAt"].includes(key)) {
      if (!val) return "—";
      const d = new Date(val);
      return isNaN(d) ? String(val) : d.toLocaleString("vi-VN");
    }
    return String(val);
  };

  const renderLogCard = (obj = {}, title = "") => {
    const hasData = obj && Object.keys(obj || {}).length > 0;
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-inner">
        <div className="font-semibold text-slate-700 mb-2">{title}</div>
        {!hasData && <div className="text-xs text-slate-400">Không có dữ liệu.</div>}
        {hasData && (
          <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-700">
            {logDisplayFields.map((f) => (
              <div
                key={f.key}
                className="bg-slate-50 border border-slate-100 rounded-md px-2 py-1 flex justify-between items-start gap-2"
              >
                <span className="text-slate-500">{f.label}</span>
                <span className="font-semibold text-slate-800 text-right break-words">
                  {formatFieldValue(f.key, obj[f.key])}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
        CCCD: c.cccd || "",
        "Tên khách hàng": c.name || "",
        Email: c.email || "",
        "Số điện thoại": c.phone || "",
        "Địa chỉ": c.address || "",
        "Người phụ trách": c.ownerName || "",
        "Trạng thái": c.status || ""
      }));
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Customers");
      xlsx.writeFile(wb, `customers_admin_${Date.now()}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Xuất Excel thất bại. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    // Admin: load danh sách nhân viên để gán owner (tùy chọn)
    if (role === "admin" && token) {
      client
        .get("/admin/employees", { headers: { Authorization: `Bearer ${token}` } })
        .then(({ data }) => setEmployees(Array.isArray(data) ? data : []))
        .catch((err) => {
          console.warn("Cannot load employees for owner select", err?.response?.data || err?.message || err);
          setEmployees([]);
        });
    }

    if (!token) return;
    fetchCustomers();
    fetchCustomerCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role]);

  const filtered = useMemo(() => {
    const list = [...customers];
    if (!filter) return list;
    const q = filter.toLowerCase();
    return list.filter((c) => {
      const ownerId = c.ownerId || c.owner_id || c.owner || "";
      const ownerText = (() => {
        const emp = employees.find(
          (e) => String(e.id || e.userId || e._id || "") === String(ownerId)
        );
        const profile = emp?.profile || {};
        return (
          emp?.full_name ||
          emp?.fullName ||
          profile.full_name ||
          profile.fullName ||
          emp?.email ||
          profile.email ||
          ""
        ).toLowerCase();
      })();
      const text = `${c.name || ""} ${c.cccd || ""} ${c.email || ""} ${c.phone || ""} ${c.address || ""} ${ownerText}`.toLowerCase();
      return text.includes(q);
    });
  }, [customers, filter, employees]);

  const handleCreate = async () => {
    if (!addForm.name.trim()) {
      alert("Tên khách hàng là bắt buộc");
      return;
    }

    try {
      await client.post(
        "/crm/customers",
        {
          cccd: addForm.cccd.trim(),
          name: addForm.name.trim(),
          email: addForm.email.trim(),
          phone: addForm.phone.trim(),
          address: addForm.address.trim(),
          status: addForm.status,
          ...(role === "admin" && addForm.ownerId ? { ownerId: addForm.ownerId } : {}),
          ...(role === "admin" && addForm.ownerName ? { ownerName: addForm.ownerName } : {}),
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setAdding(false);
      setAddForm({
        cccd: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        status: "lead",
        ownerId: "",
        ownerName: "",
      });
      await fetchCustomers();
      await fetchCustomerCount();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Tạo khách hàng thất bại");
    }
  };

  const handleEdit = (customer) => {
    setEditForm({
      id: customer.id || customer._id,
      cccd: customer.cccd || "",
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      status: customer.status || "lead",
      ownerId: customer.ownerId || customer.owner_id || "",
      ownerName: customer.ownerName || "",
    });
    setEditing(true);
  };

  const handleUpdate = async () => {
    if (!editForm.name.trim()) {
      alert("Tên khách hàng là bắt buộc");
      return;
    }

    try {
      await client.put(
        `/crm/customers/${editForm.id}`,
        {
          cccd: editForm.cccd.trim(),
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          address: editForm.address.trim(),
          status: editForm.status,
          ...(role === "admin" && editForm.ownerId ? { ownerId: editForm.ownerId } : {}),
          ...(role === "admin" && editForm.ownerName ? { ownerName: editForm.ownerName } : {}),
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setEditing(false);
      setEditForm({
        id: "",
        cccd: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        status: "lead",
        ownerId: "",
        ownerName: "",
      });
      await fetchCustomers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Cập nhật khách hàng thất bại");
    }
  };

  const handleDelete = async (c) => {
    const id = c.id || c._id;
    if (!id) return;
    if (!window.confirm(`Xóa khách hàng "${c.name}"?`)) return;
    try {
      await client.delete(`/crm/customers/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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
        ids.map((id) =>
          client.delete(`/crm/customers/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
        )
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
        ids.map((id) =>
          client.delete(`/crm/customers/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
        )
      );
      setSelectedIds(new Set());
      await fetchCustomers();
      await fetchCustomerCount();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Xóa thất bại");
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

  const statusBadge = (st) => {
    const s = st || "lead";
    if (s === "active") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    if (s === "inactive") return "bg-slate-100 text-slate-600 border border-slate-200";
    return "bg-amber-100 text-amber-700 border border-amber-200";
  };

  return (
    <div className="h-screen bg-slate-100 text-slate-800 flex overflow-hidden">
      <AdminSidebar />

      {/* Main */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">CRM</p>
            <h1 className="text-2xl font-bold text-slate-900">Khách hàng</h1>
            <p className="text-sm text-slate-500">
              Quản lý khách hàng (MVP). Nếu CRM service chưa chạy, trang vẫn không bị lỗi.
            </p>
          </div>
          <div className="text-sm text-slate-500 text-right">
            <p>Hôm nay</p>
            <p className="font-semibold text-slate-700">{new Date().toLocaleDateString("vi-VN")}</p>
          </div>
        </header>

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4">
            <div className="font-semibold">Không thể tải CRM</div>
            <div className="text-sm mt-1">{error}</div>
            <div className="text-xs mt-2 text-amber-800/80">
              Gợi ý: chạy backend CRM tại <code className="font-mono">backend-hrmSOA/services/crm-service</code> (port 5007)
              và gateway sẽ proxy qua <code className="font-mono">/crm</code>.
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-200 flex-1 min-w-[260px]">
            <span className="text-slate-400">🔍</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Tìm kiếm khách hàng theo tên, email, số điện thoại..."
              placeholder="Tìm kiếm theo tên, email, số điện thoại, địa chỉ..."
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
              Danh sách khách hàng{" "}
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
                  <th className="text-left px-4 py-3 font-semibold">Địa chỉ</th>
                  <th className="text-left px-4 py-3 font-semibold">Người phụ trách</th>
                  <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="text-right px-4 py-3 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={9}>
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
                      <td className="px-4 py-3 text-slate-600">{c.address || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {(() => {
                          const ownerId = c.ownerId || c.owner_id || c.owner || "";
                          if (!ownerId) return role === "admin" ? "Admin" : "Bạn";
                          if (role !== "admin") return "Bạn";
                          const emp = employees.find(
                            (e) => String(e.id || e.userId || e._id || "") === String(ownerId)
                          );
                          const profile = emp?.profile || {};
                          const fullName =
                            emp?.full_name ||
                            emp?.fullName ||
                            profile.full_name ||
                            profile.fullName ||
                            emp?.name ||
                            "";
                          const email = emp?.email || profile.email || "";
                          return fullName || email || "Admin";
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${statusBadge(c.status)}`}>
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
                  <label className="text-sm text-slate-600 font-medium">CCCD</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={addForm.cccd}
                    onChange={(e) => setAddForm((p) => ({ ...p, cccd: e.target.value }))}
                    placeholder="Ví dụ: 012345678901"
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

                {role === "admin" && (
                  <div>
                    <label className="text-sm text-slate-600 font-medium">Phụ trách (owner)</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                      value={addForm.ownerId}
                      onChange={(e) => setAddForm((p) => ({ ...p, ownerId: e.target.value }))}
                    >
                      <option value="">-- Không gán (chỉ admin thấy) --</option>
                      {employees.map((emp) => {
                        const profile = emp.profile || {};
                        const fullName =
                          emp.full_name ||
                          emp.fullName ||
                          profile.full_name ||
                          profile.fullName ||
                          emp.name ||
                          "";
                        return (
                          <option key={emp.id || emp.userId || emp._id} value={emp.id || emp.userId || emp._id}>
                            {fullName || emp.email || "Nhân viên"} ({emp.email || profile.email || ""})
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      Để trống: chỉ admin thấy. Chọn nhân viên: họ sẽ thấy khách hàng này.
                    </p>
                  </div>
                )}

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
                  <label className="text-sm text-slate-600 font-medium">CCCD</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editForm.cccd}
                    onChange={(e) => setEditForm((p) => ({ ...p, cccd: e.target.value }))}
                    placeholder="Ví dụ: 012345678901"
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

                {role === "admin" && (
                  <div>
                    <label className="text-sm text-slate-600 font-medium">Phụ trách (owner)</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                      value={editForm.ownerId}
                      onChange={(e) => setEditForm((p) => ({ ...p, ownerId: e.target.value }))}
                    >
                      <option value="">-- Không gán (chỉ admin thấy) --</option>
                      {employees.map((emp) => {
                        const profile = emp.profile || {};
                        const fullName =
                          emp.full_name ||
                          emp.fullName ||
                          profile.full_name ||
                          profile.fullName ||
                          emp.name ||
                          "";
                        return (
                          <option key={emp.id || emp.userId || emp._id} value={emp.id || emp.userId || emp._id}>
                            {fullName || emp.email || "Nhân viên"} ({emp.email || profile.email || ""})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

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

                <div className="md:col-span-2">
                  <label className="text-sm text-slate-600 font-medium">Địa chỉ</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    value={editForm.address}
                    onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="VD: 123 Nguyễn Trãi, Q1..."
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 space-y-4 border border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    📜 Nhật ký khách hàng
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      Tối đa 50 log mới nhất
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500">
                    {logModal.customer?.name || "Khách hàng"}
                  </p>
                </div>
                <button
                  className="text-slate-500 hover:text-slate-800 text-lg"
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

              <div className="max-h-[560px] overflow-y-auto space-y-4 pr-1">
                {logModal.loading && <p className="text-sm text-slate-500 py-2">Đang tải...</p>}
                {!logModal.loading && logModal.items.length === 0 && (
                  <p className="text-sm text-slate-500 py-2">Chưa có nhật ký.</p>
                )}
                {logModal.items.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="border border-slate-100 rounded-xl p-4 bg-gradient-to-br from-white to-slate-50 shadow-sm flex gap-3"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg">
                        {actionIcon(log.action)}
                      </div>
                      <div className="flex-1 w-px bg-slate-200" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">
                              {log.actorEmail || "N/A"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${actionStyle(
                                log.action
                              )}`}
                            >
                              {actionIcon(log.action)} {log.action || "action"}
                            </span>
                          </div>
                          {log.meta && (
                            <div className="text-xs text-slate-600 flex flex-wrap gap-3">
                              {log.meta.created !== undefined && <span>Tạo: {log.meta.created}</span>}
                              {log.meta.skipped !== undefined && <span>Bỏ qua: {log.meta.skipped}</span>}
                              {log.meta.errors !== undefined && <span>Lỗi: {log.meta.errors}</span>}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleString("vi-VN")
                            : new Date(log.updatedAt || "").toLocaleString("vi-VN")}
                        </div>
                      </div>

                      {(log.before || log.after) && (
                        <div className="grid md:grid-cols-2 gap-3 text-xs">
                          {log.before && renderLogCard(log.before, "Trước")}
                          {log.after && renderLogCard(log.after, "Sau")}
                        </div>
                      )}

                      {!log.before && !log.after && !log.meta && (
                        <div className="text-xs text-slate-400">Không có chi tiết.</div>
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
                  <span className="font-mono">name,cccd,email,phone,address,status</span>
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

export default CRMPage;


