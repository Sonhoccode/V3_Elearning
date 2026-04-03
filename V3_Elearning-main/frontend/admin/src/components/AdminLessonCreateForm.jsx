import { useState } from "react";
import { createLesson } from "../api/AdminLessonsAPI";
import Button from "./ui/Button";
import Input from "./ui/Input";

export default function AdminLessonCreateForm({ courseId, onSuccess }) {
  const [form, setForm] = useState({
    course: courseId,
    slug: "",
    kind: "lesson",
    order: 0,
    parent: "", // Optional parent ID
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await createLesson({
        ...form,
        course: parseInt(courseId),
        order: parseInt(form.order) || 0,
        parent: form.parent ? parseInt(form.parent) : null,
      });
      setMessage("Tạo thành công!");
      if (onSuccess) onSuccess(res.slug);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Tạo thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-[var(--color-border)]">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Tạo bài học mới</h2>
      
      <form onSubmit={handleCreate} className="space-y-6">
        <Input
          label="Slug (URL - định danh bài học)"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          placeholder="vd: html-intro, css-colors"
          required
        />
        
        <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại bài học</label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border border-[var(--color-border)]"
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                <option value="lesson">Bài học (Lesson)</option>
                <option value="group">Nhóm (Group)</option>
              </select>
            </div>
            <Input
                label="Thứ tự (Order)"
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
            />
             <Input
                label="ID Bài học cha (Parent ID) - Tùy chọn"
                type="number"
                value={form.parent}
                onChange={(e) => setForm({ ...form, parent: e.target.value })}
                placeholder="Để trống nếu là bài học gốc"
            />
        </div>

        <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
           {message && (
                <span className={`text-sm font-medium ${message.includes("thành công") ? "text-green-600" : "text-red-600"}`}>
                    {message}
                </span>
           )}
           <Button type="submit" isLoading={loading} className="ml-auto">
             Tạo bài học
           </Button>
        </div>
      </form>
    </div>
  );
}
