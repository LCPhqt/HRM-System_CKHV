import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

function LoginPage() {
  const { client, setToken, setRole, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const EyeIcon = ({ closed = false }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      {closed ? (
        <>
          <path d="m3 3 18 18" />
          <path d="M10.7 10.7a2 2 0 0 0 2.6 2.6" />
          <path d="M9.5 5.1A9 9 0 0 1 12 5c5 0 9 5 9 7 0 1.2-1.4 3.3-3.6 5" />
          <path d="M6.1 6.1C4.1 7.5 3 9.4 3 12c0 1.2 1.4 3.3 3.6 5 1.2.9 2.7 1.7 4.4 1.9" />
        </>
      ) : (
        <>
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
  const [loading, setLoading] = useState(false);
  const registerSuccess = location.state?.registerSuccess;

  //  FIX: redirect an toàn theo role (tránh admin bị redirect vào staff route)
  const getSafeRedirect = (role) => {
    const fromPath = location.state?.from?.pathname || '/home';

    // Admin không quay lại trang staff
    if (role === 'admin') {
      if (fromPath.startsWith('/staff')) return '/home';
      return fromPath; // /home /admin /departments /payroll...
    }

    // Staff không quay lại trang admin/payroll
    if (fromPath.startsWith('/admin') || fromPath.startsWith('/payroll')) return '/home';

    // Staff không đi vào /departments (page admin) => chuyển về staff departments
    if (fromPath.startsWith('/departments')) return '/staff/departments';

    return fromPath;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      alert('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', { email, password });

      // token có thể là accessToken
      const token = data.accessToken || data.token;
      const role = data.role;

      setToken(token);
      setRole(role);
      setUser({ email, role });

      //  redirect an toàn theo role
      const redirect = getSafeRedirect(role);

      // QUAN TRỌNG: xóa state.from để lần sau không bị dính lại
      navigate(redirect, { replace: true, state: {} });
      window.history.replaceState({}, document.title);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[620px] animate-fade-in">
        {/* Left */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
          <div className="mb-8">
            <div className="w-16 h-16 mb-4">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
              Chào mừng trở lại!
            </h1>
            <p className="text-slate-500">
              Vui lòng nhập thông tin đăng nhập để tiếp tục.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {registerSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-3 py-2 rounded-xl">
                Đăng ký thành công! Vui lòng đăng nhập.
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📧</span>
                <input
                  type="email"
                  required
                  placeholder="@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-12 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  <EyeIcon closed={showPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 font-medium">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

          <div className="relative z-10">
            <div className="bg-white/10 backdrop-blur-md inline-flex px-4 py-2 rounded-full text-sm font-medium border border-white/10 mb-6">
              ✨ HRM-CRM MVP System
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-6">
              Quản trị CRM & HRM <br />
              Hiệu quả &amp; Tinh gọn.
            </h2>
            <p className="text-indigo-100 text-lg leading-relaxed max-w-sm">
              Tối ưu hóa quy trình quản lý của bạn với giao diện người dùng hiện đại.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="p-2 bg-emerald-500 rounded-lg shadow-lg"></div>
              <div>
                <p className="font-bold text-sm">Quản lý lương tự động</p>
                <p className="text-xs text-indigo-100">Chính xác tuyệt đối</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 ml-8">
              <div className="p-2 bg-orange-500 rounded-lg shadow-lg">📊</div>
              <div>
                <p className="font-bold text-sm">Cơ cấu phòng ban</p>
                <p className="text-xs text-indigo-100">Trực quan hóa sơ đồ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
