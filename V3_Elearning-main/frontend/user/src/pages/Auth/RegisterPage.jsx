import { useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import { useNavigate } from "react-router-dom";
import { github_login } from "../../api/auth.api";
import { useTranslation } from "react-i18next";

import GitHubIcon from "@mui/icons-material/GitHub";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [step, setStep] = useState("register"); // register | otp
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const { t } = useTranslation("auth");

  const nav = useNavigate();
  const { register_user, verify_otp } = useAuth();

  const handleRegister = async () => {
    setError("");

    if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
      setError(t("register.invalid_email") || "Email phải là địa chỉ Gmail");
      return;
    }

    const res = await register_user(username, email, password, cPassword);

    if (res?.ok === false) {
      setError(res.error);
    } else {
      setStep("otp");
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    try {
      await verify_otp(email, otp);
      nav("/login");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "" + (t("register.invalid_OTP") || "Mã OTP không hợp lệ"),
      );
    }
  };

  const handleLogin = () => {
    nav("/login");
  };

  const handleGithub = () => {
    github_login();
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-blue-100 to-white">
      <div className="w-full max-w-md p-6 mx-auto bg-white shadow-md rounded-xl">
        {/* ===== TITLE ===== */}
        <h2 className="mb-6 text-2xl font-bold text-center">
          {step === "register"
            ? t("register.title")
            : t("register.invalid_OTP")}
        </h2>

        {/* ===== ERROR ===== */}
        {error && (
          <div className="mb-4 text-sm text-center text-red-600">{error}</div>
        )}

        {/* ================= REGISTER FORM ================= */}
        {step === "register" && (
          <>
            {/* Username */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">
                {t("register.username")}
              </label>
              <input
                type="text"
                placeholder={t("register.username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">
                {t("register.email")}
              </label>
              <input
                type="email"
                placeholder={t("register.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">
                {t("register.password")}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block mb-1 text-sm font-medium">
                {t("register.confirm_password")}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={cPassword}
                onChange={(e) => setCPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleRegister}
              className="w-full py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {t("register.register")}
            </button>

            <button
              onClick={handleGithub}
              className="w-full mt-3 flex justify-center items-center gap-1 bg-black text-white py-2 rounded-lg hover:opacity-90 transition"
            >
              <GitHubIcon /> {t("login.login_with")} GitHub
            </button>

            <p
              className="mt-4 text-sm text-center text-gray-500 cursor-pointer"
              onClick={handleLogin}
            >
              {t("register.have_account")}{" "}
              <span className="text-blue-600 hover:underline">
                {t("register.login")}
              </span>
            </p>
          </>
        )}

        {/* ================= OTP FORM ================= */}
        {step === "otp" && (
          <>
            <p className="mb-4 text-sm text-center text-gray-600">
              {t("register.otp_sent_to_email")}
              <br />
              <b>{email}</b>
            </p>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder={t("register.enter_otp") || "Nhập mã OTP (6 số)"}
              maxLength={6}
              inputMode="numeric"
              className="w-full px-4 py-2 mb-4 text-lg tracking-widest text-center border rounded-lg"
            />

            <button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6}
              className="w-full py-2 text-white transition bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {"Xác nhận OTP"}
            </button>

            <button
              onClick={() => setStep("register")}
              className="w-full mt-3 text-sm text-gray-500 hover:underline"
            >
              ← {t("register.back_to_register") || "Quay lại đăng ký"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
