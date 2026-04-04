import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLessons, createLesson } from "../api/AdminLessonsAPI";
import { fetchCourses } from "../api/AdminCoursesAPI";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function AdminLessonListPage() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    course: "",
    slug: "",
    order: 0,
    kind: "lesson",
  });

  // Load lessons và courses
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lessonsData, coursesData] = await Promise.all([
        fetchLessons(),
        fetchCourses(),
      ]);
      setLessons(lessonsData);
      setCourses(coursesData);
    } catch (err) {
      console.error(err);
      setMessage("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage("");
    try {
      const res = await createLesson(form);
      setMessage("Tạo bài học mới thành công");
      setForm({ course: "", slug: "", order: 0, kind: "lesson" });
      loadData();
      navigate(`/lessons/${res.slug}`);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Tạo bài học thất bại");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Quản lý Bài học</h2>

      {/* Form tạo bài học mới */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Tạo bài học mới</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khóa học</label>
            <select
              value={form.course}
              onChange={(e) => handleChangeField("course", e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">-- Chọn khóa học --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Input
              label="Slug (URL)"
              value={form.slug}
              onChange={(e) => handleChangeField("slug", e.target.value)}
              placeholder="vd: html-introduction"
              required
            />
          </div>
          <div>
            <Input
              label="Thứ tự"
              type="number"
              value={form.order}
              onChange={(e) => handleChangeField("order", parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại bài</label>
            <select
              value={form.kind || "lesson"}
              onChange={(e) => handleChangeField("kind", e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="lesson">Lesson</option>
              <option value="group">Group</option>
            </select>
          </div>
          <div>
            <Button type="submit" isLoading={creating} className="w-full">
              Tạo bài học
            </Button>
          </div>
        </form>
      </section>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${message.includes("thành công") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      {/* Danh sách bài học */}
      <section className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Tất cả bài học</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center text-gray-500">Đang tải...</div>
        ) : lessons.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Chưa có bài học nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khóa học</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thứ tự</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kind</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngôn ngữ</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lessons.map((lesson) => {
                  const langs = lesson.translations?.map((t) => t.lang).join(", ") || "-";
                  const courseName = courses.find((c) => c.id === lesson.course)?.title || `ID: ${lesson.course}`;
                  
                  return (
                    <tr key={lesson.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lesson.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lesson.slug}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{courseName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lesson.order}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lesson.kind || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{langs}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => navigate(`/lessons/${lesson.slug}`)}
                        >
                          Chỉnh sửa
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
