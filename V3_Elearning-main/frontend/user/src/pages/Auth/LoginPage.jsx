import { useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import { useNavigate } from "react-router-dom";
import { github_login } from "../../api/auth.api";
import { google_login } from "../../api/auth.api";
import { useTranslation } from "react-i18next";

import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const { t } = useTranslation("auth");

  const { login_user } = useAuth();
  const nav = useNavigate();

  const handleLogin = async () => {
    setErr("");
    if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
      setErr(t("login.invalid_email") || "Invalid email");
      return;
    }
    const result = await login_user(email, password);
    if (result?.ok === false) setErr(result.error || "Login failed");
  };

  const handleRegister = () => nav("/register");

  const handleGithub = () => {
    github_login();
  };

  const handleGoogle = () => {
    google_login();
  };
  return (
    <div className="min-h-screen bg-gradient-to-b pt-32 from-blue-100 to-white">
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          {t("login.title")}
        </h2>

        {err && (
          <div className="mb-4 text-sm text-red-600 text-center">{err}</div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {t("login.email")}
          </label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder={t("login.email")}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            {t("login.password")}
          </label>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            placeholder={t("login.password")}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {t("login.login")}
        </button>

        <div className="flex items-center gap-4 my-4">
          <button
            onClick={handleGoogle}
            className="w-full mt-3 flex justify-center items-center gap-1 bg-blue-500 text-white py-2 rounded-lg hover:opacity-90 transition"
          >
            <GoogleIcon /> {t("login.login_with")} Google
          </button>
          
          <button
            onClick={handleGithub}
            className="w-full mt-3 flex justify-center items-center gap-1 bg-black text-white py-2 rounded-lg hover:opacity-90 transition"
          >
            <GitHubIcon /> {t("login.login_with")} GitHub
          </button>
        </div>

        <p
          className="text-sm text-center text-gray-500 mt-4"
          onClick={handleRegister}
        >
          {t("login.no_account")}{" "}
          <span className="text-blue-600 cursor-pointer hover:underline">
            {t("login.register")}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
