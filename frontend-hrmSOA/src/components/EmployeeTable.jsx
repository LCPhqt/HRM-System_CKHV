import React, { useState } from "react";

export default function EmployeeTable({
  employees,
  onView,
  onEdit,
  onRemove,
  onStatusChange,
}) {
  const [openStatusId, setOpenStatusId] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  //  Logic hiển thị chữ (Khớp với Database: leave, quit, working)
  const statusLabel = (status) => {
    if (status === "leave") return "Nghỉ phép";
    if (status === "quit") return "Đã nghỉ";
    return "Đang làm việc";
  };

  //  Logic hiển thị màu (Vàng, Xám/Đỏ, Xanh)
  const statusStyle = (status) => {
    if (status === "leave") return "bg-amber-100 text-amber-700"; // Màu vàng
    if (status === "quit") return "bg-red-100 text-red-600";      // Đã sửa thành màu Đỏ cho dễ nhìn (hoặc bạn thích màu xám thì đổi lại slate)
    return "bg-emerald-100 text-emerald-700"; // Màu xanh
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Table */}
      <div className="grid grid-cols-5 px-6 py-4 text-xs font-semibold text-slate-400 uppercase bg-slate-50">
        <p>Thông tin nhân viên</p>
        <p>Vị trí & Phòng ban</p>
        <p>Ngày gia nhập</p>
        <p>Trạng thái</p>
        <p className="text-right">Hành động</p>
      </div>

      {employees.length === 0 ? (
        <div className="p-6 text-slate-500">Không có nhân viên nào.</div>
      ) : (
        employees.map((emp) => {
          // Lấy profile an toàn
          const profile = emp.profile || {};

          // Lấy tên
          const name =
            emp.full_name ||
            emp.fullName ||
            profile.fullName ||
            profile.full_name ||
            "Chưa có";

          // Lấy email, vị trí...
          const email = emp.email || profile.email || "—";
          const position = emp.position || profile.position || "Đang cập nhật";
          const department = emp.department || profile.department || "Chưa gán";
          const createdAt =
            emp.joined_at ||
            emp.created_at ||
            emp.createdAt ||
            profile.created_at ||
            profile.createdAt ||
            null;

          // 🔥 SỬA QUAN TRỌNG: Kiểm tra status ở cả 2 nơi (trong profile và ngoài emp)
          // Nếu tìm không thấy ở đâu cả thì mới cho là "working"
          const status = emp.status || profile.status || "working";
          const rowId = emp.id || emp.userId || emp._id;

          // (Tùy chọn) Bật dòng này lên nếu muốn soi lỗi trong Console F12
          // console.log(`User: ${email} | Status: ${status}`);

          return (
            <div
              key={emp.id || emp.userId || emp._id}
              className="grid grid-cols-5 px-6 py-5 border-t hover:bg-slate-50 transition"
            >
              {/* Info */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                  {name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-slate-400">ID: {rowId || "—"}</p>
                  <p className="font-semibold text-slate-800">{name}</p>
                  <p className="text-sm text-slate-500">{email}</p>
                </div>
              </div>

              {/* Position + Department */}
              <div>
                <p className="font-semibold text-slate-800">{position}</p>
                <p className="text-sm text-indigo-600 font-medium inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full mt-1">
                  🏢 {department}
                </p>
              </div>

              {/* Join date */}
              <div className="flex items-center text-slate-700">
                {formatDate(createdAt)}
              </div>

              {/* Status */}
              <div className="flex items-center">
                {openStatusId === rowId ? (
                  <select
                    className="px-3 py-2 rounded-lg border text-sm"
                    value={status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        await onStatusChange?.(emp, newStatus);
                        setOpenStatusId(null);
                      } catch (err) {
                        alert(err?.message || "Cập nhật trạng thái thất bại");
                      }
                    }}
                    onBlur={() => setOpenStatusId(null)}
                  >
                    <option value="working">Đang làm việc</option>
                    <option value="leave">Nghỉ phép</option>
                    <option value="quit">Đã nghỉ</option>
                  </select>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenStatusId(rowId)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(
                      status
                    )}`}
                  >
                    ● {statusLabel(status)}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onView(emp)}
                  className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
                >
                  Xem
                </button>
                <button
                  onClick={() => onEdit(emp)}
                  className="px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold hover:bg-indigo-200"
                >
                  Sửa
                </button>
                <button
                  onClick={() => onRemove(emp)}
                  className="px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 text-sm font-semibold hover:bg-rose-200"
                >
                  Xóa
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}