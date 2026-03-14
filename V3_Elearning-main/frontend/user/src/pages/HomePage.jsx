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
    <div className="min-h-screen bg-custom flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full px-32 flex flex-col items-center gap-10">
        {/* main */}
        <div className="relative w-full h-96 shadow-xl rounded-sm z-10 ">
          {/* welcome */}
          <div className="bg-welcome flex flex-col justify-center text-center absolute rounded-lg inset-0 z-30 ">
            <div className="left-[10%] bottom-0 absolute z-20">
              <img
                src={welcome}
                alt="Welcome Svg"
                className=" w-auto h-80 ml-8"
              />
            </div>
            <h1 className=" text-4xl font-extrabold mb-4 text-slate-900">
              {t("bg-welcome.title_welcome")}
            </h1>
            <p className=" text-lg text-slate-700 px-2 w-fit mx-auto">
              {t("bg-welcome.content_welcome")}
            </p>
            <NavLink
              to="/roadmap"
              className="
                mx-auto mt-6
                flex items-center justify-center
                px-10 py-4
                rounded-2xl
                border border-white/30
                button-custom bg-opacity-75
                text-gray-700
                font-semibold text-xl
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
          className="logo-bg absolute right-0 top-[60%] -translate-y-1/2 "
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
