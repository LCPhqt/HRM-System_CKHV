import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { register } from "../api/auth";
import { useAuth } from "../providers/AuthProvider";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [agree, setAgree] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      register({
        email,
        password,
        fullName,
        phone,
        position,
        department: company,
      }),
    onSuccess: (data) => {
      if (data?.tokens?.accessToken && data?.user) {
        setAuth(
          data.tokens.accessToken,
          {
            email: data.user.email,
            roles: data.user.roles,
            fullName: data.user.fullName,
            phone: data.user.phone,
            position: data.user.position || position,
            department: data.user.department || company,
          },
          data.tokens.refreshToken
        );
        navigate("/", { replace: true });
      } else {
        setError("Phản hồi đăng ký không hợp lệ");
      }
    },
    onError: (err) => {
      setError(err?.response?.data?.message || "Đăng ký thất bại");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!agree) {
      setError("Vui lòng đồng ý với điều khoản");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h2>Đăng ký</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Họ và tên
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Tên công ty (Chi nhánh)
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </label>
          <label>
            Chức vụ
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
            />
          </label>
          <label>
            Số điện thoại
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label className="checkbox-line">
            <button
              type="button"
              className="link-btn"
              onClick={() => setShowTerms(true)}
            >
              Đọc điều khoản
            </button>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>Tôi đồng ý với điều khoản</span>
          </label>

          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={mutation.isLoading}>
            {mutation.isLoading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>
        <p className="hint">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>

      {showTerms && (
        <div className="modal-backdrop" onClick={() => setShowTerms(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Điều khoản sử dụng</h3>
            </div>
            <div className="modal-body">
              <p>1. Thông tin bạn cung cấp chỉ phục vụ cho quản lý nhân sự nội bộ.</p>
              <p>2. Vui lòng bảo mật tài khoản và không chia sẻ mật khẩu.</p>
              <p>3. Việc sử dụng hệ thống tuân thủ chính sách và quy định của công ty.</p>
              <p>4. Hệ thống có thể ghi log để phục vụ giám sát và cải thiện dịch vụ.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowTerms(false)}>Đã hiểu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

