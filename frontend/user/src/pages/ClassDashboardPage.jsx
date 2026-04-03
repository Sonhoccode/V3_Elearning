import { useEffect, useState } from "react";
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
        error: err?.response?.data?.detail || "Không thể tải danh sách lớp",
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
        error: err?.response?.data?.detail || "Tạo lớp thất bại",
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
        error: err?.response?.data?.detail || "Tham gia lớp thất bại",
      });
    }
  };

  if (loading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  if (!user) {
    return <div className="text-center mt-20">Chưa đăng nhập</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Dashboard Lớp Học
            </h1>
            <p className="text-slate-600">
              Quản lý lớp học và bài tập theo vai trò của bạn.
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
                Tạo lớp mới
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Tên lớp học"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={status.loading}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {status.loading ? "Đang tạo..." : "Tạo lớp"}
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
                Tham gia lớp học
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Nhập join code"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={status.loading}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {status.loading ? "Đang tham gia..." : "Tham gia"}
                </button>
              </div>
            </form>
          )}
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">
            Danh sách lớp
          </h2>
          {status.loading ? (
            <div className="text-sm text-slate-500">Đang tải lớp...</div>
          ) : classes.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {classes.map((item) => (
                <ClassCard key={item.id} item={item} isTeacher={isTeacher} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              Chưa có lớp học nào.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
