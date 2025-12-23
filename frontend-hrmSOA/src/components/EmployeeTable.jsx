import React from 'react';

const statusMap = {
  active: { label: 'Đang làm việc', color: 'bg-emerald-100 text-emerald-700' },
  onleave: { label: 'Nghỉ phép', color: 'bg-amber-100 text-amber-700' },
  pending: { label: 'Chờ duyệt', color: 'bg-blue-100 text-blue-700' },
};

function EmployeeTable({ employees = [], expandedIds = new Set(), onView, onEdit, onRemove }) {
  const fmtDate = (date) => {
    if (!date) return '--';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '--';
    return d.toLocaleDateString('vi-VN');
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Thông tin nhân viên</th>
            <th className="px-4 py-3 text-left">Vị trí & Phòng ban</th>
            <th className="px-4 py-3 text-left">Ngày gia nhập</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
            <th className="px-4 py-3 text-left">Hành động</th>
          </tr>
        </thead>
        <tbody className="text-sm text-slate-700">
          {employees.map((emp) => {
            const profile = emp.profile || {};
            const fullName = emp.full_name || emp.fullName || profile.full_name || profile.fullName || emp.name || emp.email || 'N/A';
            const email = emp.email || profile.email || '-';
            const position = emp.position || profile.position || 'Đang cập nhật';
            const department = emp.department || profile.department || 'Chưa gán';
            const joined =
              emp.joinedAt ||
              emp.joined_at ||
              profile.joinedAt ||
              profile.joined_at ||
              profile.created_at ||
              profile.createdAt ||
              emp.createdAt ||
              '';
            const statusKey = emp.status || 'active';
            const status = statusMap[statusKey] || statusMap.active;
            const initials = (fullName || email).trim()[0]?.toUpperCase() || 'N';
            const isOpen = expandedIds.has(emp.id || emp.userId || emp._id || email);

            return (
              <React.Fragment key={emp.userId || emp._id || email}>
                <tr className="hover:bg-slate-50 border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center">
                        {initials}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{fullName}</div>
                        <div className="text-xs text-slate-500">{email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{position}</div>
                    <div className="text-xs text-slate-500">{department}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{fmtDate(joined)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        onClick={() => onView?.(emp)}
                        className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        {isOpen ? 'Ẩn' : 'Xem'}
                      </button>
                      <button
                        onClick={() => onEdit?.(emp)}
                        className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => onRemove?.(emp)}
                        className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 transition"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-t border-slate-100 bg-slate-50/50">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-700">
                        <div>
                          <div className="text-xs uppercase text-slate-400">Họ và tên</div>
                          <div className="font-semibold text-slate-800">{fullName}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-slate-400">Email</div>
                          <div className="text-slate-700">{email}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-slate-400">Phòng ban</div>
                          <div className="text-slate-700">{department}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-slate-400">Chức vụ</div>
                          <div className="text-slate-700">{position}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-slate-400">Điện thoại</div>
                          <div className="text-slate-700">{profile.phone || '--'}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-slate-400">Địa chỉ</div>
                          <div className="text-slate-700">{profile.address || '--'}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-slate-400">Ngày sinh</div>
                          <div className="text-slate-700">{fmtDate(profile.dob)}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-slate-400">Ngày gia nhập</div>
                          <div className="text-slate-700">{fmtDate(joined)}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-slate-400">Trạng thái</div>
                          <div className="text-slate-700">{status.label}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeTable;

