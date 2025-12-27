// frontend/user/src/components/items/CardItems.jsx
import { NavLink } from "react-router-dom";
// import { fetchCourses } from "../../api/coursesAPI";
// import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Card({ title, description, slug, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={[
        "relative w-64 h-80 flex-shrink-0 rounded-lg border-2 bg-white",
        "flex flex-col justify-between items-center",
        "transition-shadow duration-300",
        isActive
          ? "shadow-xl border-teal-500"
          : "shadow-md border-slate-800/30",
      ].join(" ")}
    >
      <div className="w-full border-b-2 border-slate-800/15 py-4 text-center">
        <h2 className="text-2xl font-extrabold tracking-wide">{title}</h2>
      </div>
      <p className="px-4 text-center text-sm mt-4 text-slate-700">
        {description}
      </p>

      <div className="mb-6">
        <NavLink to={`/courses/${slug}`}
          className={[
            "px-6 py-3 rounded-md text-base font-semibold border-2",
            isActive
              ? "bg-teal-100 border-teal-600"
              : "bg-teal-50 border-teal-400",
          ].join(" ")}
        >
          Bắt đầu ngay
        </NavLink>
      </div>
    </button>
  );
}
