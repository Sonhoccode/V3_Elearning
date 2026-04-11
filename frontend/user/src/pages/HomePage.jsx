import React from "react";

import { fetchCategories } from "../api/categoriesAPI";
import logo from "../assets/logo_full.svg";
import welcome from "../assets/welcome.svg";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CoursesListHome from "../components/sections/CoursesListHome.jsx";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const { t } = useTranslation("home");

  // Lấy danh mục và khóa học theo danh mục
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => fetchCategories({ signal }),
    staleTime: 300_000,
    gcTime: 1_800_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-0 py-10 overflow-x-hidden bg-custom">
      <div className="flex flex-col items-center w-full gap-10 px-4 sm:px-8 xl:px-32">
        {/* main */}
        <div className="relative w-full min-h-[300px] lg:h-96 shadow-xl rounded-sm z-10 ">
          {/* welcome */}
          <div className="absolute inset-0 z-30 flex flex-col justify-center p-6 text-center rounded-lg bg-welcome md:p-10">
            <div className="left-[10%] bottom-0 absolute z-20 hidden lg:block">
              <img
                src={welcome}
                alt="Welcome Svg"
                className="w-auto ml-8 h-80"
              />
            </div>
            <h1 className="mb-4 text-3xl font-extrabold md:text-4xl text-slate-900 drop-shadow-md">
              {t("bg-welcome.title_welcome")}
            </h1>
            <p className="px-2 mx-auto text-base font-medium md:text-lg text-slate-800 lg:text-slate-700 w-fit drop-shadow-sm">
              {t("bg-welcome.content_welcome")}
            </p>
            <NavLink
              to="/roadmap"
              className="
                mx-auto mt-6 md:mt-8
                flex items-center justify-center
                px-8 md:px-10 py-3 md:py-4
                rounded-2xl
                border border-white/30
                button-custom bg-opacity-75
                text-gray-800
                font-bold text-lg md:text-xl
                shadow-lg
                cursor-pointer
                transition
                hover:scale-[1.05]
              "
            >
              {t("bg-welcome.roadmap_title")}
            </NavLink>
          </div>
        </div>
        {/* logo */}
        <div
          className="logo-bg absolute right-0 top-[60%] -translate-y-1/2 hidden xl:block opacity-70 pointer-events-none"
        >
          <img
            src={logo}
            alt="Logo"
            className="h-full max-h-[980px] w-auto py-6"
          />
        </div>

        {/* hết khung card */}
        <CoursesListHome
          className="relative flex"
          categories={categories}
          isLoading={categoriesLoading}
        />
      </div>
    </div>
  );
}
