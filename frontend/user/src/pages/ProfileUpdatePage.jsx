import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const ProfileUpdatePage = () => {
  const { user, update_profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");

  const [username, setUsername] = useState(user?.username || "");
  const [email] = useState(user?.email || "");
  const [password, setPassword] = useState(""); // UI only
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await update_profile({ username });
      navigate("/profile");
    } catch (err) {
      console.error(err);
      setError(t("profile.update_failed", "Cập nhật thất bại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-profile p-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-xl"
      >
        {/* Header */}
        <div className="mb-8 flex items-start justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {t("profile.update_title", "Update Profile")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("profile.update_desc", "Cập nhật thông tin cá nhân của bạn")}
            </p>
          </div>

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-pink-600 transition"
          >
            <FaArrowLeft />
            {t("profile.back", "Quay lại")}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="space-y-10">
          {/* Basic Info */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              {t("profile.basic_info", "Basic Information")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t("profile.username", "Username")}
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5
                             text-gray-700 focus:outline-none focus:ring-2
                             focus:ring-pink-300 focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t("profile.email", "Email")}
                </label>
                <input
                  value={email}
                  disabled
                  className="w-full rounded-xl border border-gray-200
                             bg-gray-100 px-4 py-2.5 text-gray-500"
                />
              </div>
            </div>
          </section>

          {/* Security */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              {t("profile.security", "Security")}
            </h2>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("profile.new_password", "New Password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5
                           focus:outline-none focus:ring-2 focus:ring-pink-300
                           focus:border-pink-400"
              />
              <p className="mt-1 text-xs text-gray-400">
                {t("profile.password_note", "Đổi mật khẩu sẽ được xử lý ở bước tiếp theo")}
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-10 flex justify-end">
          <button
            type="submit"
            disabled={loading || username === user?.username}
            className="rounded-xl bg-pink-500 px-8 py-3
                       font-semibold text-white transition
                       hover:bg-pink-600 disabled:opacity-50
                       disabled:cursor-not-allowed"
          >
            {loading ? t("profile.saving", "Đang lưu...") : t("profile.save_changes", "Lưu thay đổi")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileUpdatePage;
