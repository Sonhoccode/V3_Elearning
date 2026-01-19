import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get_me } from "../api/auth.api";
import { useAuth } from "../contexts/useAuth";

const STORAGE_KEY = "auth_user";

export default function OAuthCallback() {
  const nav = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();
  const [err, setErr] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        // ✅ lấy user từ backend (cookie JWT)
        const user = await get_me();

        // ✅ cập nhật AUTH CONTEXT
        setUser(user);
        setIsAuthenticated(true);

        // ✅ lưu storage để refresh không mất
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

        // 🔀 redirect theo role
        const role = user?.role;
        if (role === "teacher") nav("/TeacherPage");
        else if (role === "admin") nav("/admin");
        else nav("/StudentPage");
      } catch (e) {
        console.error("GitHub OAuth callback failed", e);
        setErr("GitHub login failed");
        nav("/login");
      }
    };

    run();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-6 rounded-xl shadow-md text-center">
        <p className="text-lg font-semibold">
          Signing you in with GitHub...
        </p>
        {err && (
          <p className="text-sm text-red-600 mt-2">{err}</p>
        )}
      </div>
    </div>
  );
}
