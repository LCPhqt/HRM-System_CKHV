import { Link } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <div className="auth-container">
      <div className="card">
        <h2>403 - Không có quyền</h2>
        <p>Bạn không có quyền truy cập trang này.</p>
        <Link to="/">Về trang chính</Link>
      </div>
    </div>
  );
}

