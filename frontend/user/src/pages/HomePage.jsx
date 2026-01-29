import React from "react";

import { useState, useEffect, useMemo, useRef } from "react";

import { fetchCourses } from "../api/coursesAPI";
import Card from "../components/items/CardItems.jsx";
import logo from "../assets/logo_full.svg";
import welcome from "../assets/welcome.svg";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const OFFSETS = [-3, -2, -1, 0, 1, 2, 3];
function mod(n, m) {
  return ((n % m) + m) % m;
}

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [autoPlay, setAutoPlay] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const { t } = useTranslation("home");

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const data = await fetchCourses({ signal: controller.signal });
        setCourses(Array.isArray(data) ? data : []);
        setActiveIndex(0);
      } catch (e) {
        if (e.name === "AbortError") return;
        console.error("Lỗi khi tải courses:", e);
      }
    })();
    return () => {
      controller.abort();
    };
  }, []);

  const LOCK_MS = 420;
  const lockRef = useRef(false);
  // lock đúng theo duration transition
  const lock = () => {
    lockRef.current = true;
    window.setTimeout(() => {
      lockRef.current = false;
    }, LOCK_MS);
  };

  // di chuyển tới card theo delta
  const go = (delta) => {
    if (lockRef.current) return;
    if (!courses.length) return;
    lock();
    setActiveIndex((prev) => mod(prev + delta, courses.length));
  };

  // di chuyển tới card kế tiếp và trước
  const handleNext = () => go(1);
  const handlePrev = () => go(-1);

  // di chuyển tới card theo index
  const handleSelect = (index) => {
    if (lockRef.current) return;
    lock();
    setActiveIndex(index);
  };

  // AUTO LƯỚT (đừng chạy lúc đang lock)
  useEffect(() => {
    if (!autoPlay) return;
    if (!courses.length) return;
    const timer = setInterval(() => {
      if (lockRef.current) return;
      setActiveIndex((prev) => (prev + 1) % courses.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [autoPlay, courses.length]);

  // tạo danh sách card hiển thị
  const cards = useMemo(() => {
    if (!courses.length) return [];
    return OFFSETS.map((offset) => {
      const index = mod(activeIndex + offset, courses.length);
      const item = courses[index];
      return {
        offset,
        index,
        title: item?.title,
        description: item?.description,
        isActive: offset === 0,
      };
    });
  }, [activeIndex, courses]);

  // tính toán transform cho từng card
  const offsetToTransform = (offset) => {
    const x = offset * 230;
    const scale =
      offset === 0
        ? 1.08
        : Math.abs(offset) === 1
        ? 0.95
        : Math.abs(offset) === 2
        ? 0.88
        : 0.8;

    const y = offset === 0 ? -10 : 0;

    // quan trọng: offset = ±3 dùng làm buffer, ẩn đi nhưng vẫn tồn tại để trượt vào
    const opacity =
      offset === 0
        ? 1
        : Math.abs(offset) === 1
        ? 0.82
        : Math.abs(offset) === 2
        ? 0.6
        : 0;

    const zIndex = 10 - Math.abs(offset);

    return {
      transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
      opacity,
      zIndex,
      pointerEvents: offset === 0 ? "auto" : "auto", // vẫn click được các card nhìn thấy
    };
  };

  // throttle wheel banwfg rAF
  const rafRef = useRef(null);
  const wheelAccumRef = useRef(0);

  const onWheel = (e) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    wheelAccumRef.current += delta;

    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      const v = wheelAccumRef.current;
      wheelAccumRef.current = 0;

      if (Math.abs(v) < 40) return; // ngưỡng

      if (v > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    });
  };

  
  
  return (
    <div className="min-h-screen bg-custom flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full px-32 flex flex-col items-center gap-10">
        {/* main */}
        <div className="animate-fade-in relative w-full h-96 shadow-xl rounded-sm z-10 ">
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
        <div className="animate-fade-in logo-bg absolute right-0 top-[60%] -translate-y-1/2 ">
          <img
            src={logo}
            alt="Logo"
            className="h-full max-h-[980px] w-auto py-6"
          />
        </div>

        {/* Khung card */}
        <div className="w-full max-w-8xl z-20 ">
          <div className="h-[420px] flex items-center justify-center">
            <div
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              onMouseEnter={() => setAutoPlay(false)}
              onMouseLeave={() => setAutoPlay(true)}
              onWheel={onWheel}
            >
              {cards.map(({ title, description, isActive, offset, index }) => (
                <div
                  key={index}
                  // key={courses[index]?.id ?? index}
                  // key={`${index}-${offset}`}
                  style={offsetToTransform(offset)}
                  className={[
                    "absolute",
                    "transition-[transform,opacity] duration-[800ms] ease-out",
                    "will-change-transform",
                    "select-none",
                  ].join(" ")}
                >
                  <Card
                    title={title}
                    description={description}
                    slug={courses[index]?.slug}
                    isActive={isActive}
                    onClick={() => handleSelect(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
