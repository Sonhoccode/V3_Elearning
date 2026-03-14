import { NavLink } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const FRONTEND = [
  {
    name: "HTML",
    courseLink: "/courses/html",
  },
  {
    name: "CSS",
    courseLink: "/courses/css",
  },
  {
    name: "Tailwind",
    courseLink: "/courses/tailwind",
  },
  {
    name: "Javascript",
    courseLink: "/courses/javascript",
  },
  {
    name: "React",
    courseLink: "/courses/react",
  },
];

const BACKEND = [
  {
    name: "Javascript",
    courseLink: "/courses/javascript",
  },
  {
    name: "NodeJS",
    courseLink: "/courses/nodejs",
  },
  {
    name: "Python",
    courseLink: "/courses/python",
  },
  {
    name: "Django",
    courseLink: "/courses/django",
  },
  {
    name: "PHP",
    courseLink: "/courses/php",
  },
];

const OTHER = [
  {
    name: "C++",
    courseLink: "/courses/cpp",
  },
  {
    name: "PostgreSQL",
    courseLink: "/courses/postgresql",
  },
  {
    name: "MongoDB",
    courseLink: "/courses/mongodb",
  },
];

export default function RoadmapItem() {
  const { t } = useTranslation("roadmap");
  // get roadmap frontend
  const roadmapFrontend = useMemo(() => {
    return FRONTEND.map((item, index) => (
      <div
        key={item.name}
        data-aos="fade-right"
        data-aos-duration="500"
        data-aos-delay={index * 200}
        data-aos-easing="ease-in-sine"
        className="
        group relative overflow-hidden
        mx-auto w-fit mb-4 px-8 py-3
        bg-white/90 backdrop-blur
        rounded-xl
        shadow-sm
        border-l-4 border-[#FFCCCC]
        transition-shadow duration-300
        hover:shadow-lg
      "
      >
        {/* lớp màu kéo qua */}
        <span
          className="
          pointer-events-none
          absolute inset-0
          -translate-x-full
          bg-gradient-to-r from-blue-50 to-[#FFCCCC]
          transition-transform duration-500 ease-out
          group-hover:translate-x-0
        "
        />

        <div className="relative z-10 text-lg font-semibold text-gray-800 mb-1">
          {item.name}
        </div>

        <NavLink
          to={item.courseLink}
          className="
          relative z-10
          text-sm font-medium
          text-blue-600
          hover:text-blue-700
          transition-colors
        "
        >
          {t("view_course")} →
        </NavLink>
      </div>
    ));
  }, [t]);

  // get roadmap backend
  const roadmapBackend = useMemo(() => {
    return BACKEND.map((item, index) => (
      <div
        key={item.name}
        data-aos="fade-left"
        data-aos-duration="500"
        data-aos-delay={index * 200}
        data-aos-easing="ease-in-sine"
        className="
    group relative overflow-hidden
    w-fit mb-2 px-8 py-3
    bg-white/90 backdrop-blur
    rounded-xl
    shadow-sm
    border-l-4 border-[#FFCCCC]
    transition-shadow duration-300
    hover:shadow-lg

    justify-self-end even:justify-self-start
      "
      >
        {/* lớp màu kéo qua */}
        <span
          className="
          pointer-events-none
          absolute inset-0
          -translate-x-full
          bg-gradient-to-r from-blue-50 to-[#FFCCCC]
          transition-transform duration-500 ease-out
          group-hover:translate-x-0
        "
        />

        <div className="relative z-10 text-lg font-semibold text-gray-800 mb-1">
          {item.name}
        </div>

        <NavLink
          to={item.courseLink}
          className="
          relative z-10
          text-sm font-medium
          text-blue-600
          hover:text-blue-700
          transition-colors
        "
        >
          {t("view_course")} →
        </NavLink>
      </div>
    ));
  }, [t]);
  const roadmapOther = useMemo(() => {
    return OTHER.map((item) => (
      <div
        key={item.name}
        className="
        group relative overflow-hidden
        mx-auto w-fit mb-4 px-8 py-3
        bg-white/90 backdrop-blur
        rounded-xl 
        shadow-sm
        border-l-4 border-[#FFCCCC]
        transition-shadow duration-300
        hover:shadow-lg
      "
      >
        {/* lớp màu kéo qua */}
        <span
          className="
          pointer-events-none
          absolute inset-0
          -translate-x-full
          bg-gradient-to-r from-blue-50 to-[#FFCCCC]
          transition-transform duration-500 ease-out
          group-hover:translate-x-0
        "
        />

        <div className="relative z-10 text-lg font-semibold text-gray-800 mb-1">
          {item.name}
        </div>

        <NavLink
          to={item.courseLink}
          className="
          relative z-10
          text-sm font-medium
          text-blue-600
          hover:text-blue-700
          transition-colors
        "
        >
          {t("view_course")} →
        </NavLink>
      </div>
    ));
  }, [t]);
  return { roadmapFrontend, roadmapBackend, roadmapOther };
}
