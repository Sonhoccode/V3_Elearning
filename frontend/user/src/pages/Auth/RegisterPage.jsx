import { useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [role, setRole] = useState("student");
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

    const res = await register_user(username, email, password, cPassword, role);

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
      setError(err.response?.data?.error || "" + (t("register.invalid_OTP") || "Mã OTP không hợp lệ"));
    }
  };

  const handleLogin = () => {
    nav("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b pt-20 from-blue-100 to-white">
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">

        {/* ===== TITLE ===== */}
        <h2 className="text-2xl font-bold text-center mb-6">
          {step === "register" ? t("register.title") : t("register.invalid_OTP")}
        </h2>

        {/* ===== ERROR ===== */}
        {error && (
          <div className="mb-4 text-sm text-red-600 text-center">{error}</div>
        )}

        {/* ================= REGISTER FORM ================= */}
        {step === "register" && (
          <>
            {/* Username */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t("register.username")}</label>
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
              <label className="block text-sm font-medium mb-1">{t("register.email")}</label>
              <input
                type="email"
                placeholder={t("register.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Vai trò</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>

              {role === "teacher" && (
                <p className="text-xs text-yellow-600 mt-1">
                  * Tài khoản giáo viên cần admin duyệt
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t("register.password")}</label>
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
              <label className="block text-sm font-medium mb-1">
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
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {t("register.register")}
            </button>

            <p
              className="text-sm text-center text-gray-500 mt-4 cursor-pointer"
              onClick={handleLogin}
            >
              {t("register.have_account")}{" "}
              <span className="text-blue-600 hover:underline">{t("register.login")}</span>
            </p>
          </>
        )}

        {/* ================= OTP FORM ================= */}
        {step === "otp" && (
          <>
            <p className="text-sm text-center text-gray-600 mb-4">
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
              className="w-full px-4 py-2 border rounded-lg mb-4 text-center tracking-widest text-lg"
            />

            <button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {t("register.verify_otp") || "Xác nhận OTP"}
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
