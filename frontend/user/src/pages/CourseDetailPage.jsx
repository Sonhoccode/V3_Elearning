import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import LessonSidebar from "../components/LessonSidebar";
import { fetchCourses } from "../api/coursesAPI";
import {
  fetchLessonsByCourse,
  fetchLessonDetail,
  fetchLessonProgress,
  markLessonCompleted,
} from "../api/lessonsAPI";
import { useAuth } from "../contexts/useAuth.jsx";

export default function CourseDetailPage() {
  const { slug, lessonSlug } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { t } = useTranslation("lesson");
  const { user } = useAuth();
  const completionRef = useRef(null);
  const [completedSlugs, setCompletedSlugs] = useState([]);

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

  const progressKey = useMemo(
    () => (slug ? `lesson-progress:${slug}` : ""),
    [slug]
  );

  useEffect(() => {
    if (!slug) {
      setCompletedSlugs([]);
      return;
    }

    if (user?.id) {
      fetchLessonProgress({ courseSlug: slug })
        .then((data) => setCompletedSlugs(data))
        .catch(() => setCompletedSlugs([]));
      return;
    }

    if (!progressKey) {
      setCompletedSlugs([]);
      return;
    }

    try {
      const raw = localStorage.getItem(progressKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setCompletedSlugs(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCompletedSlugs([]);
    }
  }, [slug, user?.id, progressKey]);

  useEffect(() => {
    if (user?.id || !progressKey) return;
    localStorage.setItem(progressKey, JSON.stringify(completedSlugs));
  }, [user?.id, progressKey, completedSlugs]);

  const countableLessonSlugs = useMemo(() => {
    if (!lessons.length) return new Set();
    const hasChildren = new Set();

    lessons.forEach((lesson) => {
      if (lesson?.parent != null) {
        hasChildren.add(String(lesson.parent));
      }
    });

    const slugs = new Set();
    lessons.forEach((lesson) => {
      if (!lesson) return;
      if (lesson.kind) {
        if (lesson.kind === "lesson") slugs.add(lesson.slug);
        return;
      }
      const isLeaf = lesson.id != null && !hasChildren.has(String(lesson.id));
      if (isLeaf) slugs.add(lesson.slug);
    });

    return slugs;
  }, [lessons]);

  const progress = useMemo(() => {
    const total = countableLessonSlugs.size;
    if (!total) return { completed: 0, total: 0, percent: 0 };
    const completedSet = new Set(completedSlugs);
    let completed = 0;
    countableLessonSlugs.forEach((slugItem) => {
      if (completedSet.has(slugItem)) completed += 1;
    });
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent };
  }, [countableLessonSlugs, completedSlugs]);

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

  useEffect(() => {
    if (!lessonSlug || !completionRef.current) return;
    if (!countableLessonSlugs.has(lessonSlug)) return;
    if (completedSlugs.includes(lessonSlug)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setCompletedSlugs((prev) => {
            if (prev.includes(lessonSlug)) return prev;
            return [...prev, lessonSlug];
          });
          if (user?.id) {
            markLessonCompleted({ courseSlug: slug, lessonSlug }).catch(() => null);
          }
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(completionRef.current);
    return () => observer.disconnect();
  }, [lessonSlug, countableLessonSlugs, completedSlugs, slug, user?.id]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600">{t("lesson.loading_lessons")}</p>
        </div>
      </div>
    );
  }

  if (coursesError || !course) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">
            {t("lesson.not_found_course")}
          </h2>
          <NavLink
            to="/"
            className="px-6 py-3 text-white bg-teal-500 rounded-lg hover:bg-teal-600"
          >
            {t("lesson.back_home")}
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-0 bg-gray-50 sm:px-4 lg:px-8 xl:px-32">
      <div className="relative flex flex-col w-full max-w-full mx-auto lg:flex-row">
        <LessonSidebar
          lessons={lessons}
          currentLessonSlug={lessonSlug}
          courseSlug={slug}
          progress={progress}
          completedSlugs={completedSlugs}
        />

        <main className="flex-1 min-w-0 overflow-hidden bg-white border-l border-gray-200 rounded-r-lg shadow-sm">
        <div className="p-8 text-white transition-all duration-300 bg-gradient-to-r from-teal-500 to-blue-500">
          <div>
            <NavLink
              to="/"
              className="inline-flex items-center mb-4 transition-colors text-white/80 hover:text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("lesson.back_home")}
            </NavLink>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="mb-2 text-4xl font-bold">
                  {currentLesson?.translation?.title || course.title}
              </h1>
              {lessonSlug && completedSlugs.includes(lessonSlug) && (
                <span className="inline-flex items-center px-3 py-1 mb-2 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-100">
                  {t("lesson.completed")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="p-8">
          {lessonLoading ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
              <p className="text-gray-600">{t("lesson.loading_lessons")}</p>
            </div>
          ) : currentLesson ? (
            <div>
              {/* Top Navigation */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={hasPrev ? handlePrev : () => navigate(`/courses/${slug}`)}
                  className="flex items-center px-4 py-2 font-medium text-white transition-colors bg-teal-600 rounded hover:bg-teal-700"
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

              <div className="flex items-center justify-between pt-8 mt-12 border-t border-gray-200">
                <button
                  onClick={hasPrev ? handlePrev : () => navigate(`/courses/${slug}`)}
                  className="flex items-center px-4 py-2 font-medium text-white transition-colors bg-teal-600 rounded hover:bg-teal-700"
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
              <div ref={completionRef} className="h-2" aria-hidden="true" />
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-600">
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
