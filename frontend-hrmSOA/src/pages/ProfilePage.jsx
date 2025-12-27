import React, { useEffect, useState } from 'react';
import ProfileForm from '../components/ProfileForm';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const { client, role } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await client.get('/profiles/me');
        setProfile(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [client]);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await client.put('/profiles/me', profile);
      setSaved(true);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8 space-y-4">
        <div>
          <p className="text-sm text-slate-500">Hồ sơ cá nhân</p>
          <h1 className="text-2xl font-bold text-slate-800">Cập nhật thông tin</h1>
        </div>

        <ProfileForm
          profile={profile}
          onChange={handleChange}
          onSubmit={handleSubmit}
          loading={loading}
        />

        {/* ✅ Sau khi lưu xong mới hiện nút điều hướng */}
        {saved && (
          <div className="flex flex-col gap-3 pt-2">
            <p className="text-emerald-600 font-medium">✅ Đã lưu thông tin cá nhân thành công!</p>

            <div className="flex gap-3">
              {role === 'admin' ? (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Đi tới trang Nhân viên
                </button>
              ) : (
                <button
                  onClick={() => navigate('/home')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Về trang Tổng quan
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
