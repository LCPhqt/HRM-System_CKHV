import React, { useEffect, useMemo, useState } from "react";
import ProfileForm from "../components/ProfileForm";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Field({ label, icon, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-slate-500">{icon}</span>
        <span className="text-slate-900 font-semibold">
          {value || "—"}
        </span>
      </div>
    </div>
  );
}

/**
 * ✅ readOnly=true: chỉ xem (STAFF)
 * ✅ readOnly=false (default): giữ nguyên chức năng sửa/lưu (ADMIN + user như cũ)
 */
function ProfilePage({ readOnly = false }) {
  const { client, role, user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({});
  const [fetching, setFetching] = useState(true);

  // edit-mode states (admin)
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setFetching(true);
      try {
        const { data } = await client.get("/profiles/me");
        setProfile(data || {});
      } catch (err) {
        console.error(err);
        setProfile({});
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [client]);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await client.put("/profiles/me", profile);
      setSaved(true);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---- values for readonly UI ----
  const fullName =
    profile.full_name ||
    profile.fullName ||
    profile.name ||
    "Chưa cập nhật";

  const email = profile.email || user?.email || "—";

  const dob =
    profile.dob ||
    profile.birth_date ||
    profile.birthDate ||
    profile.date_of_birth ||
    "";

  const phone = profile.phone || profile.phone_number || profile.phoneNumber || "";
  const address = profile.address || profile.location || "";
  const department =
    profile.department ||
    profile.department_name ||
    profile.departmentName ||
    "";
  const position = profile.position || profile.title || "";

  const summary =
    profile.summary ||
    profile.bio ||
    profile.about ||
    "";

  const avatarText = useMemo(() => {
    const t = (email?.[0] || fullName?.[0] || "U").toUpperCase();
    return t;
  }, [email, fullName]);

  // =========================
  // ✅ READONLY (STAFF)
  // =========================
  if (readOnly) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex justify-center">
        <div className="w-full max-w-5xl space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">
                Thông tin định danh
              </h1>
              <p className="mt-2 text-slate-500">
                Chi tiết hồ sơ nhân sự chính thức của bạn trong hệ thống.
              </p>
            </div>

            <div className="h-14 w-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 font-extrabold">
              {avatarText}
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 pt-7 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1 rounded-full bg-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Thông tin cá nhân
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Chế độ xem: bạn không thể chỉnh sửa tại trang này.
              </p>
            </div>

            <div className="p-8">
              {fetching ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                  Đang tải hồ sơ...
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Họ và tên" icon="👤" value={fullName} />
                  <Field label="Email liên hệ" icon="✉️" value={email} />
                  <Field label="Ngày sinh" icon="📅" value={dob} />
                  <Field label="Số điện thoại" icon="📞" value={phone} />
                  <Field label="Địa chỉ cư trú" icon="📍" value={address} />
                  <Field label="Phòng ban" icon="🏢" value={department} />
                  <div className="md:col-span-2">
                    <Field label="Chức danh / Chức vụ" icon="🪪" value={position} />
                  </div>

                  {summary ? (
                    <div className="md:col-span-2">
                      <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                        Tóm tắt sự nghiệp
                      </p>
                      <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700 italic leading-relaxed">
                        “{summary}”
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* (tuỳ chọn) nếu bạn muốn có nút quay lại thì bật dòng dưới */}
          {/* <button onClick={() => navigate("/home")} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">← Về Tổng quan</button> */}
        </div>
      </div>
    );
  }

  // =========================
  // ✅ EDIT MODE (ADMIN / route cũ)
  // =========================
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
          loading={saving}
        />

        {saved && (
          <div className="flex flex-col gap-3 pt-2">
            <p className="text-emerald-600 font-medium">
              Đã lưu thông tin cá nhân thành công!
            </p>

            <div className="flex gap-3">
              {role === "admin" ? (
                <button
                  onClick={() => navigate("/admin")}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Đi tới trang Nhân viên
                </button>
              ) : (
                <button
                  onClick={() => navigate("/home")}
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
