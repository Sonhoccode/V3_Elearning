import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/useAuth.jsx";
import {
  createClass,
  getMyClasses,
  getTeacherClasses,
  joinClass,
} from "../api/classes.api.js";
import ClassCard from "../components/classes/ClassCard.jsx";

export default function ClassDashboardPage() {
  const { user, loading } = useAuth();
  const [classes, setClasses] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "" });
  const { t } = useTranslation("classes");
  const [className, setClassName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const role = (user?.role || "").toLowerCase();
  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  const loadClasses = async () => {
    setStatus({ loading: true, error: "" });
    try {
      const data = isTeacher ? await getTeacherClasses() : await getMyClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatus({
        loading: false,
        error: err?.response?.data?.detail || t("messages.load_classes_failed", "Không thể tải danh sách lớp"),
      });
      return;
    }
    setStatus({ loading: false, error: "" });
  };

  useEffect(() => {
    if (!loading && user) loadClasses();
  }, [loading, user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!className.trim()) return;
    setStatus({ loading: true, error: "" });
    try {
      await createClass({ name: className.trim() });
      setClassName("");
      await loadClasses();
    } catch (err) {
      setStatus({
        loading: false,
        error: err?.response?.data?.detail || t("messages.create_class_failed", "Tạo lớp thất bại"),
      });
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setStatus({ loading: true, error: "" });
    try {
      await joinClass({ join_code: joinCode.trim() });
      setJoinCode("");
      await loadClasses();
    } catch (err) {
      setStatus({
        loading: false,
        error: err?.response?.data?.detail || t("messages.join_class_failed", "Tham gia lớp thất bại"),
      });
    }
  };

  if (loading) {
    return <div className="text-center mt-20">{t("status.loading", "Đang tải...")}</div>;
  }

  if (!user) {
    return <div className="text-center mt-20">{t("status.not_logged_in", "Chưa đăng nhập")}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {t("titles.class_dashboard", "Dashboard Lớp Học")}
            </h1>
            <p className="text-slate-600">
              {t("labels.dashboard_desc", "Quản lý lớp học và bài tập theo vai trò của bạn.")}
            </p>
          </div>
        </header>

        {status.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {status.error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {isTeacher && (
            <form
              onSubmit={handleCreate}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-800">
                {t("titles.create_class", "Tạo lớp mới")}
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder={t("form.class_name", "Tên lớp học")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={status.loading}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {status.loading ? t("status.creating", "Đang tạo...") : t("buttons.create_class", "Tạo lớp")}
                </button>
              </div>
            </form>
          )}

          {isStudent && (
            <form
              onSubmit={handleJoin}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-800">
                {t("titles.join_class", "Tham gia lớp học")}
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder={t("form.join_code_placeholder", "Nhập join code")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={status.loading}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {status.loading ? t("status.joining", "Đang tham gia...") : t("buttons.join", "Tham gia")}
                </button>
              </div>
            </form>
          )}
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">
            {t("titles.class_list", "Danh sách lớp")}
          </h2>
          {status.loading ? (
            <div className="text-sm text-slate-500">{t("status.loading_classes", "Đang tải lớp...")}</div>
          ) : classes.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {classes.map((item) => (
                <ClassCard key={item.id} item={item} isTeacher={isTeacher} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              {t("status.no_classes", "Chưa có lớp học nào.")}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
