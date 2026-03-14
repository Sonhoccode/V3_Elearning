import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get_me } from "../api/auth.api";

const STORAGE_KEY = "auth_user";

export default function OAuthCallback() {
  const nav = useNavigate();
  const [err, setErr] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        // cookie đã được backend set trong callback
        const user = await get_me();

        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

        const role = user?.role;
        if (role === "admin") {
          window.location.href = "/admin";
        } else {
          nav("/");
        }
      } catch {
        setErr("GitHub login failed");
        nav("/login");
      }
    };

    run();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-6 rounded-xl shadow-md text-center">
        <p className="text-lg font-semibold">Signing you in with GitHub...</p>
        {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
      </div>
    </div>
  );
}
