import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(undefined);

const STORAGE_KEY = "hrm_auth";

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setAccessToken(parsed.accessToken ?? null);
        setRefreshToken(parsed.refreshToken ?? null);
        setUser(parsed.user ?? null);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const login = (token, userInfo, rToken) => {
    setAccessToken(token);
    setRefreshToken(rToken || null);
    setUser(userInfo);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: token, refreshToken: rToken, user: userInfo })
    );
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUser = (nextUser) => {
    const merged = { ...(user || {}), ...nextUser };
    setUser(merged);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken, refreshToken, user: merged })
    );
  };

  const value = useMemo(
    () => ({ accessToken, refreshToken, user, login, logout, updateUser }),
    [accessToken, refreshToken, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

