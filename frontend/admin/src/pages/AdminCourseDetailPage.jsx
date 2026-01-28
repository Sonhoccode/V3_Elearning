import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCourses, deleteCourse } from "../api/AdminCoursesAPI";
import LessonDetailView from "../components/LessonDetailView";
import AdminLessonCreateForm from "../components/AdminLessonCreateForm";
import Button from "../components/ui/Button"; 

export default function AdminCourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedLessonSlug = searchParams.get("lesson");

  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  const course = courses?.find((c) => c.id === parseInt(id));

  const refreshLessons = () => {
       queryClient.invalidateQueries(["lessons", id]); 
  };

  const handleDeleteCourse = async () => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa khóa học "${course.title}"? Hành động này không thể hoàn tác.`)) {
          try {
              await deleteCourse(course.id);
              queryClient.invalidateQueries(["courses"]);
              navigate("/");
          } catch (error) {
              alert(error.message);
          }
      }
  };

  if (isLoading) return <div className="p-8">Đang tải dữ liệu...</div>;
  if (!course) return <div className="p-8">Không tìm thấy khóa học</div>;

  // MASTER-DETAIL LOGIC:
  if (selectedLessonSlug === "new") {
       return (
          <div className="space-y-6">
              <button 
                onClick={() => setSearchParams({})} 
                className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4"
              >
                  ← Quay lại
              </button>
              <AdminLessonCreateForm 
                courseId={course.id} 
                onSuccess={(newSlug) => {
                    refreshLessons();
                    setSearchParams({ lesson: newSlug });
                }} 
              />
          </div>
       );
  }

  if (selectedLessonSlug) {
      return (
          <div className="space-y-6">
              <button 
                onClick={() => setSearchParams({})}
                className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4"
              >
                  ← {course.title}
              </button>
              <LessonDetailView 
                slug={selectedLessonSlug} 
                onDeleteSuccess={() => {
                  setSearchParams({}); 
                  refreshLessons();
                }}
              />
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--color-border)]">
             <div className="flex justify-between items-start">
                <div>
                     <h1 className="text-2xl font-bold text-gray-800">{course.title}</h1>
                     <p className="text-gray-500 mt-1">{course.description || "Chưa có mô tả"}</p>
                     <div className="mt-2 flex gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-600">ID: {course.id}</span>
                        <span className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-600">Slug: {course.slug}</span>
                     </div>
                </div>
                <button 
                    onClick={handleDeleteCourse}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Xóa khóa học
                </button>
             </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)] opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-lg font-medium">Chọn một bài học từ danh sách bên trái</p>
            <p className="text-sm">để xem và chỉnh sửa nội dung chi tiết</p>
        </div>
    </div>
  );
}
