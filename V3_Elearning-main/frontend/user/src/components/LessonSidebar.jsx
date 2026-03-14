import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchCourseProgress } from "../api/coursesAPI";

export default function LessonSidebar({ lessons, currentLessonSlug, courseSlug }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});
  const { t } = useTranslation("lesson");

  /* CALL BACKEND PROGRESS API */
  const {
    data: progress,
    refetch
  } = useQuery({
    queryKey: ["courseProgress", courseSlug],
    queryFn: () => fetchCourseProgress(courseSlug),
  });

  /* REFRESH PROGRESS WHEN LESSON CHANGES */
  useEffect(() => {
    if (currentLessonSlug) {
      refetch();
    }
  }, [currentLessonSlug]);

  /* PROGRESS FROM BACKEND */
  const progressPercent = progress?.percent ?? 0;
  const completedLessons = progress?.completed ?? 0;
  const totalLessons = progress?.total ?? lessons?.length ?? 0;

  const treeData = useMemo(() => {
    if (!lessons) return [];

    const uniqueLessonsMap = new Map();
    lessons.forEach((l) => {
      if (!uniqueLessonsMap.has(String(l.id))) {
        uniqueLessonsMap.set(String(l.id), { ...l, children: [] });
      }
    });

    const map = Object.fromEntries(Array.from(uniqueLessonsMap.entries()));
    const tree = [];

    uniqueLessonsMap.forEach((l) => {
      if (l.parent && map[String(l.parent)]) {
        map[String(l.parent)].children.push(l);
      } else {
        tree.push(l);
      }
    });

    return tree;
  }, [lessons]);

  useEffect(() => {
    if (currentLessonSlug && lessons) {
      const activeLesson = lessons.find((l) => l.slug === currentLessonSlug);

      setTimeout(() => {
        if (activeLesson && activeLesson.parent) {
          const parentId = String(activeLesson.parent);
          setExpanded({ [parentId]: true });
        } else {
          setExpanded({});
        }
      }, 0);
    }
  }, [currentLessonSlug, lessons]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!lessons || lessons.length === 0) {
    return null;
  }

  const renderItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.slug === currentLessonSlug;
    const isExpanded = !!expanded[String(item.id)];

    if (hasChildren) {
      return (
        <div key={item.id} className="mb-1">
          <div className="flex items-center gap-1 pr-2 rounded-lg transition-colors hover:bg-gray-50">

            <button
              onClick={(e) => {
                e.preventDefault();
                toggleExpand(String(item.id));
              }}
              className="p-3 text-gray-400 hover:text-teal-600 transition-colors flex-shrink-0"
              style={{ marginLeft: `${level * 16}px` }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-5 h-5 transition-transform duration-200 ${
                  isExpanded ? "rotate-90" : ""
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <div
              onClick={() => {
                if (item.children && item.children.length > 0) {
                  setExpanded({ [String(item.id)]: true });
                  navigate(`/courses/${courseSlug}/lessons/${item.children[0].slug}`);
                }
              }}
              className="flex-1 py-3 text-base font-semibold truncate text-gray-700 cursor-pointer hover:text-teal-700"
            >
              {item.title}
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {item.children.map((child) => renderItem(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <NavLink
        key={item.id}
        to={`/courses/${courseSlug}/lessons/${item.slug}`}
        className={({ isActive }) => `
            p-3 pr-4 rounded-lg text-base mb-1 transition-all flex items-center gap-3
            ${
              isActive
                ? "bg-teal-50 text-teal-700 font-medium border-l-4 border-teal-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent"
            }
        `}
        style={{ paddingLeft: `${level * 16 + 40}px` }}
      >
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isActive ? "bg-teal-500" : "bg-gray-300"
          }`}
        ></span>
        <span className="line-clamp-1">{item.title}</span>
      </NavLink>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg flex items-center justify-center"
      >
        ☰
      </button>

      <aside
        className={`
          fixed lg:sticky top-28 left-0 h-[calc(100vh-7rem)] w-80
          bg-white border-r border-gray-200
          transition-transform duration-300 ease-in-out z-40
          ${isCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"}
        `}
      >
        <div className="h-full flex flex-col">

          <div className="p-4 pt-7 border-b border-gray-100 bg-gradient-to-r from-teal-100 to-white">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              {t("lesson.title")}
            </h2>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">

              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>
                  {completedLessons} / {totalLessons}
                </span>
              </div>

              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
            {treeData.map((node) => renderItem(node, 0))}
          </div>
        </div>
      </aside>

      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}