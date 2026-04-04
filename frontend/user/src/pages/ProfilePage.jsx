import { FaRegEdit } from "react-icons/fa";
import { Link } from "react-router-dom";
import {useAuth} from "../contexts/useAuth.jsx";
import { useTranslation } from "react-i18next";


const Info = ({ label, value }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-800">
        {value || "—"}
      </p>
    </div>
  );
};


const ProfilePage = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation("auth");
  
  if (loading) {
    return <div className="text-center mt-20">{t("profile.loading", "Đang tải...")}</div>
  }
  if (!user) {
    return <div className="text-center mt-20">{t("profile.not_logged_in", "Chưa đăng nhập")}</div>
  }
  return (
    <div className="min-h-screen bg-profile p-8">
      <div className="mx-auto max-w-4xl">

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">

          {/* Username + Edit */}
          <h1 className="flex items-center justify-center gap-3 text-3xl font-bold">
           {t("profile.hi", "Hi, {{username}}!", { username: user.username })}
            <Link to="/profile/update">
              <FaRegEdit className="cursor-pointer text-gray-500 hover:text-blue-600 transition" />
            </Link>
          </h1>

          {/* Divider */}
          <div className="my-8 border-t" />

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            <Info label={t("profile.email", "Email")} value={user.email} />
            <Info label="Role" value={user.role} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
