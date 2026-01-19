import { useState } from "react";
import { useAuth } from "../contexts/useAuth";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [step, setStep] = useState("register"); // register | otp
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const nav = useNavigate();
  const { register_user, verify_otp_user } = useAuth();

const handleRegister = async () => {
  setError("");

  const res = await register_user(
    username,
    email,
    password,
    cPassword,
  );

  if (res?.ok === false) {
    setError(res.error);
  } else {
    setStep("otp"); 
  }
};

const handleVerifyOtp = async () => {
  setError("");
  try {
    await verify_otp_user(username, otp);
    nav("/login");
  } catch (err) {
    setError(err.response?.data?.error || "OTP không hợp lệ");
  }
};

  const handleLogin = () => {
    nav("/login");
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-slate-100">
    <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">

      {/* ===== TITLE ===== */}
      <h2 className="text-2xl font-bold text-center mb-6">
        {step === "register" ? "Đăng ký" : "Xác thực OTP"}
      </h2>

      {/* ===== ERROR ===== */}
      {error && (
        <div className="mb-4 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {/* ================= REGISTER FORM ================= */}
      {step === "register" && (
        <>
          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Password
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
            <label className="block text-sm font-medium mb-1">
              Confirm Password
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
            Register
          </button>

          <p
            className="text-sm text-center text-gray-500 mt-4 cursor-pointer"
            onClick={handleLogin}
          >
            Đã có tài khoản?{" "}
            <span className="text-blue-600 hover:underline">
              Đăng nhập
            </span>
          </p>
        </>
      )}

      {/* ================= OTP FORM ================= */}
      {step === "otp" && (
        <>
          <p className="text-sm text-center text-gray-600 mb-4">
            Mã OTP đã được gửi đến email:
            <br />
            <b>{email}</b>
          </p>

          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Nhập mã OTP (6 số)"
            maxLength={6}
            inputMode="numeric"
            className="w-full px-4 py-2 border rounded-lg mb-4 text-center tracking-widest text-lg"
          />

          <button
            onClick={handleVerifyOtp}
            disabled={otp.length !== 6}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            Xác nhận OTP
          </button>

          <button
            onClick={() => setStep("register")}
            className="w-full mt-3 text-sm text-gray-500 hover:underline"
          >
            ← Quay lại đăng ký
          </button>
        </>
      )}

    </div>
  </div>
);
};

export default Register;
