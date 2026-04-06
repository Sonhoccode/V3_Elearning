// frontend/user/src/components/Header.jsx

import { NavLink } from "react-router-dom";
import logo from "../assets/logo_full.svg";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { fetchCategories } from "../api/categoriesAPI.js";
import { fetchCourses } from "../api/coursesAPI.js";
import { useTranslation } from "react-i18next";
import DropLanguage from "./items/LanguageDrop.jsx";
import AuthItems from "./items/AuthItems.jsx";

export default function Header() {
  const { t } = useTranslation("common");
  const [openSlug, setOpenSlug] = useState(null);
  
  // Lay danh mục và khóa học
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

  // Lấy danh mục và khóa học theo danh mục
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => fetchCategories({ signal }),
    staleTime: 300_000,
    gcTime: 1_800_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Trang thái mở menu danh mục
  const toggle = (slug) => {
    setOpenSlug((prev) => (prev === slug ? null : slug));
  };

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest("[data-cat-menu]")) setOpenSlug(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <header className="site-header w-full flex flex-col items-center">
      <div className="w-full bg-white shadow-md">
        <div className="header-top w-[90%] max-w-screen-3xl mx-auto h-14 flex items-center gap-4 overflow-visible">
          <NavLink to="/" className="h-full flex items-center mr-4">
            <img src={logo} alt="Logo" className="h-10 w-auto block" />
          </NavLink>

          {/* drop menu categories */}
          <div className="flex items-center">
            {categoriesLoading && (
              <div className="flex items-center">
                <span className="text-lg flex items-center gap-1 px-4 py-4 transition-all text-gray-700 hover:bg-[#FFCCCC] font-bold">
                  Language <ArrowDropDownIcon />
                </span>
                <span className="text-lg flex items-center gap-1 px-4 py-4 transition-all text-gray-700 hover:bg-[#FFCCCC] font-bold">
                  Framework <ArrowDropDownIcon />
                </span>
                <span className="text-lg flex items-center gap-1 px-4 py-4 transition-all text-gray-700 hover:bg-[#FFCCCC] font-bold">
                  Database <ArrowDropDownIcon />
                </span>
              </div>
            )}
            {/* Error */}
            {categoriesError && (
              <div className="text-red-500 text-sm">
                <h1>{t("header.system_error", "Hệ thống đang gặp sự cố, vui lòng thử lại sau.")}</h1>
              </div>
            )}

            {/* Thành công */}
            {!categoriesLoading &&
              !categoriesError &&
              categories.map((cat) => (
                <div key={cat.id} className="relative" data-cat-menu>
                  <button
                    onClick={() => toggle(cat.slug)}
                    type="button"
                    className={`text-lg flex items-center gap-1 px-4 py-4 transition-all ${
                      openSlug === cat.slug
                        ? "text-gray-700 bg-[#FFCCCC] font-bold"
                        : "text-gray-700 hover:bg-[#FFCCCC] font-bold"
                    }`}
                  >
                    {cat.name}
                    <ArrowDropDownIcon
                      className={
                        openSlug === cat.slug
                          ? "rotate-180 transition-transform"
                          : "transition-transform"
                      }
                    />
                  </button>
                  
                  {/* Drop menu */}
                  {openSlug === cat.slug && (
                    <aside className="absolute top-full left-0 mt-2 bg-white shadow-md rounded-md min-w-[180px] p-2 z-50">
                      {cat.courses?.length ? (
                        cat.courses.map((item) => (
                          <NavLink
                            key={item.id}
                            to={`/courses/${item.slug}`}
                            className="block px-3 py-2 hover:bg-gray-100 rounded"
                            onClick={() => setOpenSlug(null)}
                          >
                            {item.title}
                          </NavLink>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500">No items</div>
                      )}
                    </aside>
                  )}
                </div>
              ))}

            <div className="relative" data-cat-menu>
              <button
                onClick={() => toggle("more")}
                type="button"
                className={`text-lg flex items-center gap-1 px-4 py-4 transition-all ${
                  openSlug === "more"
                    ? "text-gray-700 bg-[#FFCCCC] font-bold"
                    : "text-gray-700 hover:bg-[#FFCCCC] font-bold"
                }`}
              >
                {t("header.more", "Thêm")}
                <ArrowDropDownIcon
                  className={
                    openSlug === "more"
                      ? "rotate-180 transition-transform"
                      : "transition-transform"
                  }
                />
              </button>

              {openSlug === "more" && (
                <aside className="absolute top-full left-0 mt-2 bg-white shadow-md rounded-md min-w-[180px] p-2 z-50">
                  <NavLink
                    to="/classes"
                    className="block px-3 py-2 hover:bg-gray-100 rounded"
                    onClick={() => setOpenSlug(null)}
                  >
                    {t("header.classes", "Lớp học")}
                  </NavLink>
                  <NavLink
                    to="/playground"
                    className="block px-3 py-2 hover:bg-gray-100 rounded"
                    onClick={() => setOpenSlug(null)}
                  >
                    {t("header.editor_code", "Editor Code")}
                  </NavLink>
                </aside>
              )}
            </div>
          </div>

          {/* drop menu language */}
          <DropLanguage />

          {/* auth items */}
          <div className="ml-4">
            <AuthItems />
          </div>
        </div>
      </div>

      {/* Header Bottom */}
      <div className="w-full h-14 bg-gray-100 ">
        {coursesLoading && (
          <div className="h-full flex items-center justify-center">
            <span className="loader"></span>
          </div>
        )}

        {coursesError && <div className="text-red-500 text-sm">{t("header.system_error", "Hệ thống đang gặp sự cố, vui lòng thử lại sau.")}</div>}

        {!coursesLoading && !coursesError && (
          <nav className="flex flex-wrap justify-center ">
            {courses?.length > 0 ? (
              courses.map((course) => (
                <NavLink
                  key={course.id}
                  to={`/courses/${course.slug}`}
                  className={({ isActive }) =>
                    `item-courses w-32 py-4 text-center font-semibold transition-colors ${
                      isActive
                        ? "bg-teal-500 text-white hover:bg-teal-400"
                        : "text-gray-700 hover:bg-teal-500 hover:text-white "
                    }`
                  }
                >
                  {course.title}
                </NavLink>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500">No items</div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
