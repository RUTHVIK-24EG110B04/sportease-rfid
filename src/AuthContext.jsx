import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    api("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      async login(email, password, remember) {
        const d = await api("/api/auth/login", { method: "POST", body: { email, password } });
        setToken(d.token, remember);
        setUser(d.user);
        return d.user;
      },
      async register(body) {
        const d = await api("/api/auth/register", { method: "POST", body });
        setToken(d.token, true);
        setUser(d.user);
        return d.user;
      },
      logout() {
        setToken(null);
        setUser(null);
      },
      refresh: async () => {
        const d = await api("/api/auth/me");
        setUser(d.user);
        return d.user;
      },
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
