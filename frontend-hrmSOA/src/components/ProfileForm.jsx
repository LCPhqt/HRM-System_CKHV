import React from 'react';

function ProfileForm({ profile, onChange, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
          <input
            name="full_name"
            value={profile.full_name || ''}
            onChange={onChange}
            required
            className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={profile.email || ''}
            onChange={onChange}
            required
            className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
          <input
            name="dob"
            type="date"
            value={profile.dob || ''}
            onChange={onChange}
            className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
          <input
            name="phone"
            value={profile.phone || ''}
            onChange={onChange}
            className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
          <input
            name="address"
            value={profile.address || ''}
            onChange={onChange}
            className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phòng ban</label>
          <input
            name="department"
            value={profile.department || ''}
            onChange={onChange}
            className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Chức vụ</label>
          <input
            name="position"
            value={profile.position || ''}
            onChange={onChange}
            className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
      >
        {loading ? 'Đang lưu...' : 'Lưu hồ sơ'}
      </button>
    </form>
  );
}

export default ProfileForm;

