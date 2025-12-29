import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ apiBase, children }) {
  const [token, setTokenState] = useState("");
  const [role, setRoleState] = useState("");
  const [user, setUserState] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // ✅ Create axios client once
  const client = useMemo(() => {
    return axios.create({
      baseURL: apiBase,
    });
  }, [apiBase]);

 
  useEffect(() => {
    try {
      const t = localStorage.getItem("token") || "";
      const r = localStorage.getItem("role") || "";
      const u = localStorage.getItem("user");
      const parsedUser = u ? JSON.parse(u) : null;

      setTokenState(t);
      setRoleState(r);
      setUserState(parsedUser);

      // set header immediately (important)
      if (t) client.defaults.headers.common.Authorization = `Bearer ${t}`;
      else delete client.defaults.headers.common.Authorization;
    } catch (e) {
      // ignore parse errors
      setTokenState("");
      setRoleState("");
      setUserState(null);
      delete client.defaults.headers.common.Authorization;
    } finally {
      setAuthReady(true);
    }
  }, [client]);

  
  useEffect(() => {
    if (token) client.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete client.defaults.headers.common.Authorization;
  }, [client, token]);

  const setToken = (t) => {
    const val = t || "";
    setTokenState(val);
    localStorage.setItem("token", val);
    if (val) client.defaults.headers.common.Authorization = `Bearer ${val}`;
    else delete client.defaults.headers.common.Authorization;
  };

  const setRole = (r) => {
    const val = r || "";
    setRoleState(val);
    localStorage.setItem("role", val);
  };

  const setUser = (u) => {
    setUserState(u || null);
    localStorage.setItem("user", JSON.stringify(u || null));
  };

  const logout = () => {
    setTokenState("");
    setRoleState("");
    setUserState(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    delete client.defaults.headers.common.Authorization;
  };

  const value = {
    client,
    token,
    role,
    user,
    authReady,
    setToken,
    setRole,
    setUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
