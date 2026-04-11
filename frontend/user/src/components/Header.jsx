// frontend/user/src/components/Header.jsx

import { NavLink } from "react-router-dom";
import logo from "../assets/logo_full.svg";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
    <header className="site-header w-full flex flex-col items-center relative z-50">
      <div className="w-full bg-white shadow-md">
        <div className="header-top w-[95%] md:w-[90%] max-w-screen-3xl mx-auto h-16 flex items-center justify-between overflow-visible">
          {/* Logo Area */}
          <NavLink to="/" className="h-full flex items-center mr-0 lg:mr-4 flex-shrink-0" onClick={() => setMobileMenuOpen(false)}>
            <img src={logo} alt="Logo" className="h-8 md:h-10 w-auto block" />
          </NavLink>

          {/* Desktop Nav Actions */}
          <div className="hidden xl:flex items-center flex-1 justify-between ml-4">
            {/* drop menu categories */}
            <div className="flex items-center flex-wrap">
              {categoriesLoading && (
                <div className="flex items-center">
                  <span className="text-base md:text-lg flex items-center gap-1 px-2 md:px-4 py-4 text-gray-700 font-bold">
                    Language <ArrowDropDownIcon />
                  </span>
                  <span className="text-base md:text-lg flex items-center gap-1 px-2 md:px-4 py-4 text-gray-700 font-bold">
                    Framework <ArrowDropDownIcon />
                  </span>
                </div>
              )}
              {categoriesError && (
                <div className="text-red-500 text-sm px-4">
                  {t("header.system_error", "Hệ thống lỗi")}
                </div>
              )}

              {!categoriesLoading && !categoriesError && categories.map((cat) => (
                <div key={cat.id} className="relative" data-cat-menu>
                  <button
                    onClick={() => toggle(cat.slug)}
                    type="button"
                    className={`text-base md:text-lg flex items-center gap-1 px-2 md:px-4 py-4 transition-all whitespace-nowrap ${
                      openSlug === cat.slug
                        ? "text-gray-700 bg-[#FFCCCC] font-bold"
                        : "text-gray-700 hover:bg-[#FFCCCC] font-bold"
                    }`}
                  >
                    {cat.name}
                    <ArrowDropDownIcon
                      className={openSlug === cat.slug ? "rotate-180 transition-transform" : "transition-transform"}
                    />
                  </button>
                  {openSlug === cat.slug && (
                    <aside className="absolute top-full left-0 mt-2 bg-white shadow-xl rounded-md min-w-[200px] py-2 z-50 border border-gray-100">
                      {cat.courses?.length ? (
                        cat.courses.map((item) => (
                           <NavLink key={item.id} to={`/courses/${item.slug}`} className="block px-4 py-3 hover:bg-[#FFCCCC] transition-colors rounded mx-1" onClick={() => setOpenSlug(null)}>
                            {item.title}
                           </NavLink>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500">No items</div>
                      )}
                    </aside>
                  )}
                </div>
              ))}

              <div className="relative" data-cat-menu>
                <button
                  onClick={() => toggle("more")}
                  type="button"
                  className={`text-base md:text-lg flex items-center gap-1 px-2 md:px-4 py-4 transition-all whitespace-nowrap ${
                    openSlug === "more"
                      ? "text-gray-700 bg-[#FFCCCC] font-bold"
                      : "text-gray-700 hover:bg-[#FFCCCC] font-bold"
                  }`}
                >
                  {t("header.more", "Thêm")}
                  <ArrowDropDownIcon
                    className={openSlug === "more" ? "rotate-180 transition-transform" : "transition-transform"}
                  />
                </button>
                {openSlug === "more" && (
                  <aside className="absolute top-full left-0 mt-2 bg-white shadow-xl rounded-md min-w-[200px] py-2 z-50 border border-gray-100">
                    <NavLink to="/classes" className="block px-4 py-3 hover:bg-[#FFCCCC] transition-colors rounded mx-1" onClick={() => setOpenSlug(null)}>
                      {t("header.classes", "Lớp học")}
                    </NavLink>
                    <NavLink to="/playground" className="block px-4 py-3 hover:bg-[#FFCCCC] transition-colors rounded mx-1" onClick={() => setOpenSlug(null)}>
                      {t("header.editor_code", "Editor Code")}
                    </NavLink>
                  </aside>
                )}
              </div>
            </div>

            {/* Language & Auth */}
            <div className="flex items-center gap-4">
              <DropLanguage />
              <AuthItems />
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="xl:hidden flex items-center gap-4">
             <div className="scale-90"><DropLanguage /></div>
             <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors"
                aria-label="Toggle mobile menu"
             >
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Hidden on Large Screens) */}
      <div 
        className={`fixed top-16 left-0 w-full h-[calc(100vh-4rem)] bg-white transform transition-transform duration-300 xl:hidden z-40 overflow-y-auto ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
         <div className="p-6 flex flex-col gap-6">
            <div className="border-b border-gray-100 pb-4">
               <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Danh mục</h3>
               <div className="flex flex-col gap-2">
                 {!categoriesLoading && !categoriesError && categories.map((cat) => (
                    <div key={cat.id} className="flex flex-col border-b border-gray-50 pb-2">
                       <button onClick={() => toggle(cat.slug)} className="flex justify-between items-center w-full py-2 font-bold text-gray-700 text-left">
                          {cat.name}
                          <ArrowDropDownIcon className={openSlug === cat.slug ? "rotate-180" : ""} />
                       </button>
                       {openSlug === cat.slug && (
                         <div className="flex flex-col pl-4 gap-2 mt-2">
                            {cat.courses?.map((item) => (
                               <NavLink key={item.id} to={`/courses/${item.slug}`} onClick={() => setMobileMenuOpen(false)} className="py-2 text-gray-600">
                                 {item.title}
                               </NavLink>
                            ))}
                         </div>
                       )}
                    </div>
                 ))}
                 
                 <div className="flex flex-col pt-2">
                    <button onClick={() => toggle("more")} className="flex justify-between items-center w-full py-2 font-bold text-gray-700 text-left">
                        {t("header.more", "Thêm")}
                        <ArrowDropDownIcon className={openSlug === "more" ? "rotate-180" : ""} />
                    </button>
                    {openSlug === "more" && (
                         <div className="flex flex-col pl-4 gap-2 mt-2">
                            <NavLink to="/classes" onClick={() => setMobileMenuOpen(false)} className="py-2 text-gray-600">
                               {t("header.classes", "Lớp học")}
                            </NavLink>
                            <NavLink to="/playground" onClick={() => setMobileMenuOpen(false)} className="py-2 text-gray-600">
                               {t("header.editor_code", "Editor Code")}
                            </NavLink>
                         </div>
                    )}
                 </div>
               </div>
            </div>

            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Tài khoản</h3>
              <div onClick={() => setMobileMenuOpen(false)}>
                 <AuthItems />
              </div>
            </div>
         </div>
      </div>

      {/* Header Bottom (Desktop Courses Shortcut) - Hidden on Mobile */}
      <div className="w-full h-14 bg-gray-100 hidden xl:flex items-center justify-center border-t border-gray-200">
        {coursesLoading ? (
           <span className="loader scale-50"></span>
        ) : coursesError ? (
           <div className="text-red-500 text-sm">{t("header.system_error")}</div>
        ) : (
          <nav className="flex flex-wrap justify-center overflow-hidden">
            {courses?.length > 0 && courses.map((course) => (
              <NavLink
                key={course.id}
                to={`/courses/${course.slug}`}
                className={({ isActive }) =>
                  `item-courses px-6 py-4 text-center font-semibold transition-colors text-sm ${
                    isActive
                      ? "bg-teal-500 text-white"
                      : "text-gray-700 hover:bg-teal-500 hover:text-white"
                  }`
                }
              >
                {course.title}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
