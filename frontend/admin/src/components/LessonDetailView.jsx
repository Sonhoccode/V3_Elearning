import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchLessonDetail, deleteLesson } from "../api/AdminLessonsAPI";
import Button from "../components/ui/Button";

const LANG_OPTIONS = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

export default function LessonDetailView({ slug, onDeleteSuccess }) {
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [lang, setLang] = useState("vi");

  useEffect(() => {
    if (!slug) return;
    
    const loadLesson = async () => {
      setLoading(true);
      try {
        const res = await fetchLessonDetail(slug);
        setLesson(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLesson();
  }, [slug]);

  const handleDelete = async () => {
      if (!window.confirm(`Bạn có chắc chắn muốn xóa bài học "${lesson.slug}"? Hành động này không thể hoàn tác.`)) {
          return;
      }

      setDeleting(true);
      try {
          await deleteLesson(slug);
          if (onDeleteSuccess) {
              onDeleteSuccess();
          } else {
             // Fallback if no callback provided
             navigate(`/courses/${lesson.course}`);
          }
      } catch (error) {
          alert("Xóa thất bại: " + error.message);
      } finally {
          setDeleting(false);
      }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Đang tải dữ liệu bài học...</div>;

  if (!lesson) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 font-medium">Không tìm thấy bài học: {slug}</p>
      </div>
    );
  }

  const currentTranslation = lesson.translations?.find((t) => t.lang === lang) || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{currentTranslation.title || lesson.slug}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                Slug: {lesson.slug}
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                Order: {lesson.order}
            </span>
             <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                ID: {lesson.id}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
             <Link to={`/courses/${lesson.course}/lessons/${slug}/edit`}>
                <Button variant="primary" className="px-6">
                    Chỉnh sửa
                </Button>
             </Link>
             <Button 
                variant="danger" 
                className="px-4 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300"
                onClick={handleDelete}
                isLoading={deleting}
             >
                Xóa
             </Button>
        </div>
      </div>

      {/* Content View */}
      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)]">
         {/* Language Toggle */}
        <div className="border-b border-[var(--color-border)] px-6 py-4 bg-[var(--color-bg-tertiary)] flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-700">Ngôn ngữ xem trước:</span>
            <div className="flex gap-2">
                {LANG_OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => setLang(opt.value)}
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
          <div className="text-sm">
             Trạng thái: 
             <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                 currentTranslation.status === 'published' 
                 ? 'bg-green-100 text-green-700' 
                 : 'bg-yellow-100 text-yellow-700'
             }`}>
                 {(currentTranslation.status || 'draft').toUpperCase()}
             </span>
          </div>
        </div>

        <div className="p-8 bg-white min-h-[300px]">
            {currentTranslation.content ? (
                <article 
                    className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: currentTranslation.content }} 
                />
            ) : (
                <div className="text-gray-400 italic text-center py-12">
                    Chưa có nội dung cho ngôn ngữ này.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
