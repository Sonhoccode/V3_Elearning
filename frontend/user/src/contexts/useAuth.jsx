import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { is_authenticated, register, login, logout as apiLogout } from "../api/auth.api";

const AuthContext = createContext();
const STORAGE_KEY = "auth_user"; // 🔥 KEY LƯU STORAGE

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigator = useNavigate();
  const location = useLocation();


const get_authenticated = async () => {
  try {
    if (location.pathname === "/login") {
      setLoading(false);
      return;
    }

    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("✅ Auth from storage:", parsedUser);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        setLoading(false);
        return;
    }

    const ok = await is_authenticated();

    if (ok === true) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  } finally {
    setLoading(false);
  }
};


  const login_user = async (username, password) => {
    try {
      const data = await login(username, password);

      if (data?.success) {
        setIsAuthenticated(true);
        setUser(data.user);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(data.user)
        );

        const role = data.user?.role;
        if (role === "teacher") navigator("/TeacherPage");
        else if (role === "admin") navigator("/admin");
        else navigator("/StudentPage"); // student

        return { ok: true };
      } else {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        return { ok: false, error: data?.error || "Login failed" };
      }
    } catch (e) {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      return { ok: false, error: e.response?.data?.error || "Login failed" };
    }
  };

  const register_user = async (
    username,
    email,
    password,
    cPassword,
    role = "student"
  ) => {
    if (password !== cPassword) {
      return { ok: false, error: "password not match" };
    }

    try {
      const res = await register(username, email, password, role);
      if (res?.registered) {
        navigator("/login");
        return { ok: true };
      }
      return { ok: false, error: res?.error || "Register failed" };
    } catch {
      return { ok: false, error: "error register" };
    }
  };

  // 🚪 LOGOUT
  const logout_user = async () => {
    await apiLogout();
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    setUser(null);
    console.log("❌ Logout: storage cleared"); 
    navigator("/login");
  };

  useEffect(() => {
    get_authenticated();
  }, [location.pathname]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login_user,
        register_user,
        logout_user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
