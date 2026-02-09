import { useMemo } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import LessonSidebar from "../components/LessonSidebar";
import { fetchCourses } from "../api/coursesAPI";
import {
  fetchLessonsByCourse,
  fetchLessonDetail,
} from "../api/lessonsAPI";

export default function CourseDetailPage() {
  const { slug, lessonSlug } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { t } = useTranslation("lesson");

  const {
    data: courses = [],
    isLoading: coursesLoading,
    isError: coursesError,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: ({ signal }) => fetchCourses({ signal }),
    staleTime: 300_000,
    gcTime: 1_800_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const course = useMemo(
    () => courses.find((c) => c.slug === slug) || null,
    [courses, slug]
  );

  const {
    data: lessons = [],
    isLoading: lessonsLoading,
  } = useQuery({
    queryKey: ["lessons-by-course", slug, i18n.language],
    queryFn: ({ signal }) =>
      fetchLessonsByCourse({
        courseSlug: slug,
        lang: i18n.language,
        signal,
      }),
    enabled: !!slug,
    staleTime: 300_000,
    gcTime: 1_800_000,
  });

  const {
    data: currentLesson,
    isLoading: lessonLoading,
  } = useQuery({
    queryKey: ["lesson-detail", lessonSlug, i18n.language],
    queryFn: ({ signal }) =>
      fetchLessonDetail({
        lessonSlug,
        lang: i18n.language,
        signal,
      }),
    enabled: !!lessonSlug,
    staleTime: 300_000,
    gcTime: 1_800_000,
  });

  // Navigation functions
  const currentIndex = lessons.findIndex((l) => l.slug === lessonSlug);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < lessons.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      navigate(`/courses/${slug}/lessons/${lessons[currentIndex - 1].slug}`);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      navigate(`/courses/${slug}/lessons/${lessons[currentIndex + 1].slug}`);
    }
  };

  const loading = coursesLoading || (slug && lessonsLoading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t("lesson.loading_lessons")}</p>
        </div>
      </div>
    );
  }

  if (coursesError || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {t("lesson.not_found_course")}
          </h2>
          <NavLink
            to="/"
            className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
          >
            {t("lesson.back_home")}
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-32">
      <div className="w-full max-w-full mx-auto flex">
        <LessonSidebar
          lessons={lessons}
          currentLessonSlug={lessonSlug}
          courseSlug={slug}
        />

        <main className="flex-1 min-w-0 border-l border-gray-200 bg-white shadow-sm rounded-r-lg overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white p-8 transition-all duration-300">
          <div>
            <NavLink
              to="/"
              className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("lesson.back_home")}
            </NavLink>
            <h1 className="text-4xl font-bold mb-2">
                {currentLesson?.translation?.title || course.title}
            </h1>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="p-8">
          {lessonLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">{t("lesson.loading_lessons")}</p>
            </div>
          ) : currentLesson ? (
            <div>
              {/* Top Navigation */}
              <div className="flex justify-between items-center mb-8">
                <button
                  onClick={hasPrev ? handlePrev : () => navigate(`/courses/${slug}`)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center"
                >
                  ❮ {hasPrev ? t("lesson.previous") : t("lesson.home")}
                </button>
                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  className={`
                    bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center
                    ${!hasNext ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {t("lesson.next")} ❯
                </button>
              </div>

              <div
                className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-a:text-teal-600 prose-code:text-teal-600 prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-ul:list-disc prose-ol:list-decimal"
                dangerouslySetInnerHTML={{
                  __html: currentLesson.translation?.content || `<p>${t("lesson.content_updating")}</p>`,
                }}
              />

              <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
                <button
                  onClick={hasPrev ? handlePrev : () => navigate(`/courses/${slug}`)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center"
                >
                  ❮ {hasPrev ? t("lesson.previous") : t("lesson.home")}
                </button>
                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  className={`
                    bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center
                    ${!hasNext ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {t("lesson.next")} ❯
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                {t("lesson.select_lesson_sidebar")}
              </p>
            </div>
          )}
        </div>

      </main>
      </div>
    </div>
  );
}
