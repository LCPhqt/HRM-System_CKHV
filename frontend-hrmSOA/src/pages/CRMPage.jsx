import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";

function CRMPage() {
  const { client, token, role } = useAuth();

  const [customers, setCustomers] = useState([]);
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
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "lead",
    tags: "",
    ownerId: "",
    ownerName: "",
  });
  const [employees, setEmployees] = useState([]);

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
      });
      setCustomers(data || []);
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
      const text = `${c.name || ""} ${c.email || ""} ${c.phone || ""} ${ownerText}`.toLowerCase();
      return text.includes(q);
    });
  }, [customers, filter, employees]);

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
          status: addForm.status,
          tags: tagsArr,
          ...(role === "admin" && addForm.ownerId ? { ownerId: addForm.ownerId } : {}),
          ...(role === "admin" && addForm.ownerName ? { ownerName: addForm.ownerName } : {}),
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setAdding(false);
      setAddForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        status: "lead",
        tags: "",
        ownerId: "",
        ownerName: "",
      });
      await fetchCustomers();
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
      await client.delete(`/crm/customers/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await fetchCustomers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Xóa khách hàng thất bại");
    }
  };

  const statusBadge = (st) => {
    const s = st || "lead";
    if (s === "active") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    if (s === "inactive") return "bg-slate-100 text-slate-600 border border-slate-200";
    return "bg-amber-100 text-amber-700 border border-amber-200";
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex">
      <AdminSidebar />

      {/* Main */}
      <main className="flex-1 p-8 space-y-6">
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
            onClick={() => setAdding(true)}
            className="px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-300 hover:bg-indigo-700"
          >
            + Thêm khách hàng
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="font-semibold text-slate-800">
              Danh sách khách hàng{" "}
              <span className="text-slate-500 text-sm font-normal">({filtered.length})</span>
            </div>
            {loading && <div className="text-sm text-slate-500">Đang tải...</div>}
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Tên</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">SĐT</th>
                  <th className="text-left px-4 py-3 font-semibold">Người phụ trách</th>
                  <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="text-right px-4 py-3 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={6}>
                      Chưa có khách hàng nào.
                    </td>
                  </tr>
                )}

                {filtered.map((c) => (
                  <tr key={c.id || c._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.email || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.phone || "-"}</td>
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
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(c)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
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

export default CRMPage;


