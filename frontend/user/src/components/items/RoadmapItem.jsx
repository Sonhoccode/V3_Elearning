import { NavLink } from "react-router-dom";
import { useMemo } from "react";

const FRONTEND = [
  {
    name: "HTML",
    courseLink: "/courses/html-basics",
  },
  {
    name: "CSS",
    courseLink: "/courses/css-basics",
  },
  {
    name: "Tailwind",
    courseLink: "/courses/tailwind-basics",
  },
  {
    name: "Javascript",
    courseLink: "/courses/javascript-basics",
  },
  {
    name: "React",
    courseLink: "/courses/react-basics",
  },
];

const BACKEND = [
  {
    name: "Javascript",
    courseLink: "/courses/javascript-basics",
  },
  {
    name: "NodeJS",
    courseLink: "/courses/nodejs-basics",
  },
  {
    name: "Python",
    courseLink: "/courses/python-basics",
  },
  {
    name: "Django",
    courseLink: "/courses/django-basics",
  },
  {
    name: "PHP",
    courseLink: "/courses/php-basics",
  },
];

const OTHER = [
  {
    name: "C++",
    courseLink: "/courses/cpp-basics",
  },
  {
    name: "PostgreSQL",
    courseLink: "/courses/postgresql-basics",
  },
  {
    name: "MongoDB",
    courseLink: "/courses/mongodb-basics",
  },
];

export default function RoadmapItem() {
  // get roadmap frontend
  const roadmapFrontend = useMemo(() => {
    return FRONTEND.map((item) => (
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
          Xem khóa học →
        </NavLink>
      </div>
    ));
  }, []);

  // get roadmap backend
  const roadmapBackend = useMemo(() => {
    return BACKEND.map((item) => (
      <div
        key={item.name}
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
          Xem khóa học →
        </NavLink>
      </div>
    ));
  }, []);
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
          Xem khóa học →
        </NavLink>
      </div>
    ));
  }, []);
  return { roadmapFrontend, roadmapBackend, roadmapOther };
}
