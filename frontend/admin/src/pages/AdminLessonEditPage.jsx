import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchLessonDetail, fetchLessons, upsertLessonTranslation, updateLessonMetadata } from "../api/AdminLessonsAPI";
import { useQueryClient } from "@tanstack/react-query";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const LANG_OPTIONS = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

export default function AdminLessonEditPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [lang, setLang] = useState("vi");
  
  // Form State
  const [form, setForm] = useState({
    title: "",
    short_description: "",
    content: "",
    status: "draft",
  });

  const [metadataForm, setMetadataForm] = useState({
    slug: "",
    order: 0,
    parent: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [parentOptions, setParentOptions] = useState([]);

  // Load lesson + all translations
  useEffect(() => {
    loadLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadLesson = async () => {
    setLoading(true);
    try {
      const res = await fetchLessonDetail(slug);
      setLesson(res);
      
      // Init metadata form
      setMetadataForm({
        slug: res.slug,
        order: res.order,
        parent: res.parent || "",
        course: res.course,
      });

      // Fetch all lessons to populate Parent Options
      // Ideally this should be a separate cached query or filtered by course backend-side
      const allLessons = await fetchLessons();
      const validParents = allLessons
        .filter(l => l.course === res.course && l.id !== res.id) // Same course, not self
        .sort((a, b) => a.order - b.order);
      setParentOptions(validParents);

      const t = res.translations.find((tr) => tr.lang === lang);
      if (t) {
        setForm({
          title: t.title || "",
          short_description: t.short_description || "",
          content: t.content || "",
          status: t.status || "draft",
        });
      } else {
        setForm({
            title: "",
            short_description: "",
            content: "",
            status: "draft",
        });
      }
    } catch (err) {
      console.error(err);
      setMessage("Không tìm thấy bài học");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeLang = (newLang) => {
    setLang(newLang);
    if (!lesson) return;
    const t = lesson.translations?.find((tr) => tr.lang === newLang);
    if (t) {
      setForm({
        title: t.title || "",
        short_description: t.short_description || "",
        content: t.content || "",
        status: t.status || "draft",
      });
    } else {
      setForm({
        title: "",
        short_description: "",
        content: "",
        status: "draft",
      });
    }
  };

  const handleChangeField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const queryClient = useQueryClient();

  const handleSaveMetadata = async () => {
    setSaving(true);
    setMessage("");
    try {
        const res = await updateLessonMetadata(slug, metadataForm);
        setLesson(res.data || res); // Update local lesson data
        
        // Invalidate sidebar cache to reflect changes immediately
        queryClient.invalidateQueries(["lessons", String(res.course || lesson.course)]);
        queryClient.invalidateQueries(["lessons", parseInt(res.course || lesson.course)]); 
        // Invalidating both string/number just to be safe as courseId in Sidebar comes from params (string)

        setMessage("Lưu metadata thành công");
        
        // If slug changed, navigate to new URL
        if (metadataForm.slug !== slug) {
             navigate(`/courses/${lesson.course}/lessons/${metadataForm.slug}/edit`, { replace: true });
        }
    } catch (err) {
        console.error(err);
        setMessage(err.message || "Lưu metadata thất bại");
    } finally {
        setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await upsertLessonTranslation(slug, {
        lang,
        title: form.title,
        short_description: form.short_description,
        content: form.content,
        status: form.status,
      });

      // Cập nhật lại translations trong state
      setLesson((prev) => {
        if (!prev) return prev;
        const others = prev.translations.filter((t) => t.lang !== lang);
        return {
          ...prev,
          translations: [...others, res],
        };
      });

      setMessage("Lưu bản dịch thành công");
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Đang tải dữ liệu bài học...</div>;

  if (!lesson) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 font-medium">Không tìm thấy bài học với slug: {slug}</p>
        <Button onClick={() => navigate("/")} variant="ghost" className="mt-4">
            Quay lại Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Chỉnh sửa bài học: {lesson.slug}</h2>
          <p className="text-sm text-gray-500 mt-1">ID: {lesson.id} | Khóa học ID: {lesson.course}</p>
        </div>
        <Button onClick={() => navigate(`/courses/${lesson.course}?lesson=${slug}`)} variant="outline">
            Xem trước
        </Button>
      </div>

      {/* SECTION 1: METADATA */}
      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-[var(--color-border)]">
            Thông tin chung (Metadata)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
                label="Slug (URL)"
                value={metadataForm.slug}
                onChange={(e) => setMetadataForm(prev => ({...prev, slug: e.target.value}))}
            />
            <Input
                label="Thứ tự (Order)"
                type="number"
                value={metadataForm.order}
                onChange={(e) => setMetadataForm(prev => ({...prev, order: parseInt(e.target.value)}))}
            />
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bài học cha (Parent)</label>
                <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border border-[var(--color-border)]"
                    value={metadataForm.parent || ""}
                    onChange={(e) => setMetadataForm(prev => ({...prev, parent: e.target.value ? parseInt(e.target.value) : null}))}
                >
                    <option value="">-- Không có (Bài học gốc) --</option>
                    {parentOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                            #{opt.id} - {opt.slug}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Chọn bài học cha để xếp bài này vào trong mục con.</p>
            </div>
        </div>
        <div className="mt-4 flex justify-end">
             <Button onClick={handleSaveMetadata} isLoading={saving} variant="secondary">
                Lưu Metadata
             </Button>
        </div>
      </div>

      {/* SECTION 2: TRANSLATION */}
      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)]">
        {/* Chọn ngôn ngữ */}
        <div className="border-b border-[var(--color-border)] px-6 py-4 bg-[var(--color-bg-tertiary)] flex items-center gap-4 rounded-t-lg">
          <span className="font-medium text-gray-700">Ngôn ngữ:</span>
          <div className="flex gap-2">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleChangeLang(opt.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  lang === opt.value
                    ? "bg-[var(--color-accent-primary)] text-white shadow-sm"
                    : "bg-white text-gray-600 border border-[var(--color-border)] hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form nhập nội dung */}
        <div className="p-6 space-y-6">
          <Input
            label={`Tiêu đề (${lang})`}
            value={form.title}
            onChange={(e) => handleChangeField("title", e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
            <textarea
              value={form.short_description}
              onChange={(e) => handleChangeField("short_description", e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-24 p-3 border-[var(--color-border)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung (HTML/Markdown)</label>
            <textarea
              value={form.content}
              onChange={(e) => handleChangeField("content", e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-sm h-96 p-3 border-[var(--color-border)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => handleChangeField("status", e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border-[var(--color-border)]"
            >
              <option value="draft">Nháp (Draft)</option>
              <option value="published">Đã xuất bản (Published)</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-[var(--color-border)] mt-6">
            {message && (
              <span className={`text-sm font-medium ${message.includes("thành công") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </span>
            )}
            <Button onClick={handleSave} isLoading={saving} className="ml-auto">
              Lưu bản dịch ({lang})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
