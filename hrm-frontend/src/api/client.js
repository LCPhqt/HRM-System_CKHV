import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const STORAGE_KEY = "hrm_auth";

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.accessToken) {
        config.headers.Authorization = `Bearer ${parsed.accessToken}`;
      }
    } catch {
      // ignore parse errors
    }
  }
  return config;
});

// Tự refresh token khi 401 (chỉ retry 1 lần)
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Promise.reject(error);
      try {
        const parsed = JSON.parse(raw);
        const refreshToken = parsed.refreshToken;
        if (!refreshToken) return Promise.reject(error);
        const refreshResp = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken, user } =
          refreshResp.data?.data || {};
        if (!accessToken) return Promise.reject(error);

        // Cập nhật storage
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            accessToken,
            refreshToken: newRefreshToken || refreshToken,
            user: user || parsed.user,
          })
        );

        // Gắn header mới và retry
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (err) {
        // refresh thất bại => reject và để UI logout
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default client;

