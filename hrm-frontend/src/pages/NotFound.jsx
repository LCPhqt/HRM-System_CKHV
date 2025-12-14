import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="auth-container">
      <div className="card">
        <h2>404 - Không tìm thấy trang</h2>
        <p>Đường dẫn bạn truy cập không tồn tại.</p>
        <Link to="/">Về Dashboard</Link>
      </div>
    </div>
  );
}

