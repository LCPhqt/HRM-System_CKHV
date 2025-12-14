import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "../api/auth";
import { useAuth } from "../providers/AuthProvider";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: () => login({ email, password }),
    onSuccess: (data) => {
      if (data?.tokens?.accessToken && data?.user) {
        setAuth(
          data.tokens.accessToken,
          {
            email: data.user.email,
            roles: data.user.roles,
            fullName: data.user.fullName,
            phone: data.user.phone,
            position: data.user.position,
            department: data.user.department,
          },
          data.tokens.refreshToken
        );
        const roles = data.user.roles || [];
        const isAdmin = roles.includes("admin") || roles.includes("hr");
        const redirectTo = isAdmin ? "/admin" : "/employee";
        navigate(redirectTo, { replace: true });
      } else {
        setError("Phản hồi đăng nhập không hợp lệ");
      }
    },
    onError: (err) => {
      setError(err?.response?.data?.message || "Đăng nhập thất bại");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h2>Đăng nhập</h2>
        <form onSubmit={handleSubmit} className="form">
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
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={mutation.isLoading}>
            {mutation.isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
        <p className="hint">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}

