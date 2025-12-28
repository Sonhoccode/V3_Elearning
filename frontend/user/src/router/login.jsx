import { useState } from "react";
import { useAuth } from "../contexts/useAuth";
import { useNavigate } from "react-router-dom";
import { github_login } from "../api/auth.api";


const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const { login_user } = useAuth();
  const nav = useNavigate();

  const handleLogin = async () => {
    setErr("");
    const result = await login_user(username, password);
    if (result?.ok === false) setErr(result.error || "Login failed");
  };

  const handleRegister = () => nav("/register");

  const handleGithub = () => {
    github_login();
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>

        {err && (
          <div className="mb-4 text-sm text-red-600 text-center">
            {err}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            type="text"
            placeholder="Username"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>

        <button
          onClick={handleGithub}
          className="w-full mt-3 bg-black text-white py-2 rounded-lg hover:opacity-90 transition"
        >
          Login with GitHub
        </button>

        <p
          className="text-sm text-center text-gray-500 mt-4"
          onClick={handleRegister}
        >
          Chưa có tài khoản?{" "}
          <span className="text-blue-600 cursor-pointer hover:underline">
            Đăng ký
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
