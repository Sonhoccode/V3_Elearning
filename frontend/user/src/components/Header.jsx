// frontend/user/src/components/Header.jsx

import { NavLink } from "react-router-dom";
import logo from "../assets/logo_full.svg";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { fetchCategories } from "../api/categoriesAPI";
import { fetchCourses } from "../api/coursesAPI";
import LoadingWords from "./items/LoadingWords.jsx";

export default function Header() {
  const [openSlug, setOpenSlug] = useState(null);
  const qc = useQueryClient();

  // luu cache courses
  const {
    data: courses = [],
    isLoading: coursesLoading,
    isError: coursesError,
    error: errorCourses,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: ({ signal }) => fetchCourses({ signal }),
    staleTime: 0,
    gcTime: 0, // v5 (nếu v4 là cacheTime)
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  // luu cache categories
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: errorCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => fetchCategories({ signal }),
    staleTime: 0,
    gcTime: 0, // v5 (nếu v4 là cacheTime)
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // mo / dong menu category
  const toggle = (slug) => {
    setOpenSlug((prev) => (prev === slug ? null : slug));
  };

  // prefetch courses khi categories load xong
  useEffect(() => {
    if (!categoriesLoading && !categoriesError) {
      qc.prefetchQuery({
        queryKey: ["courses"],
        queryFn: ({ signal }) => fetchCourses({ signal }),
        staleTime: 360_000,
      });
    }
  }, [categoriesLoading, categoriesError, qc]);

  // dong menu khi click ngoai
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest("[data-cat-menu]")) setOpenSlug(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <header className="w-full flex flex-col items-center">
      {/* Header Top */}
      <div className="w-full bg-white shadow-md">
        <div className="header-top w-[90%] max-w-screen-3xl mx-auto h-14 flex items-center gap-4 overflow-visible">
          <NavLink to="/" className="h-full flex items-center mr-4">
            <img src={logo} alt="Logo" className="h-10 w-auto block" />
          </NavLink>

          <div className="flex items-center">
            {categoriesLoading && (
              // <span className="text-gray-500 text-sm">
              //   Đang tải danh sách danh mục...
              // </span>
              <div className="flex items-center">
                <span className="text-lg flex items-center gap-1 px-4 py-4 transition-all text-gray-700 hover:bg-[#FFCCCC] font-bold">
                  {" "}
                  Language <ArrowDropDownIcon />
                </span>
                <span className="text-lg flex items-center gap-1 px-4 py-4 transition-all text-gray-700 hover:bg-[#FFCCCC] font-bold">
                  {" "}
                  Framework <ArrowDropDownIcon />
                </span>
                <span className="text-lg flex items-center gap-1 px-4 py-4 transition-all text-gray-700 hover:bg-[#FFCCCC] font-bold">
                  {" "}
                  Database <ArrowDropDownIcon />
                </span>
              </div>
            )}

            {categoriesError && (
              <div className="text-red-500 text-sm">
                Load failed: {errorCategories?.message || "Unknown error"}
              </div>
            )}
            {!categoriesLoading &&
              !categoriesError &&
              categories.map((cat) => (
                <div key={cat.id} className="relative" data-cat-menu>
                  <button
                    onClick={() => toggle(cat.slug)}
                    type="button"
                    className={`text-lg flex items-center gap-1 px-4 py-4 transition-all
                    ${
                      openSlug === cat.slug
                        ? "text-gray-700 bg-[#FFCCCC] font-bold "
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

                  {openSlug === cat.slug && (
                    <div className="absolute top-full left-0 mt-2 bg-white shadow-md rounded-md min-w-[180px] p-2 z-50">
                      {cat.courses?.length ? (
                        cat.courses.map((item) => (
                          <NavLink
                            key={item.id}
                            to={`/${cat.slug}/${item.slug}`}
                            className="block px-3 py-2 hover:bg-gray-100 rounded"
                            onClick={() => setOpenSlug(null)}
                          >
                            {item.title}
                          </NavLink>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500">No items</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Header Bottom */}
      <div className="w-full h-14 bg-gray-100 ">
        {coursesLoading && (
          <div className="h-full flex items-center justify-center">
            <LoadingWords text="Đợi chúng mình một chút nhé..." typeSpeed={90} pauseMs={800} />
          </div>
        )}
        {coursesError && (
          <div className="text-red-500 text-sm">
            Load failed: {errorCourses?.message || "Unknown error"}
          </div>
        )}
        {!coursesLoading && !coursesError && (
          <nav className="flex flex-wrap justify-center ">
            {courses?.length > 0 ? (
              courses.map((course) => (
                <NavLink
                  key={course.id}
                  to={`/courses/${course.slug}`}
                  className="item-courses w-32 py-4 text-center font-semibold"
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
