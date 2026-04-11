// frontend/user/src/components/items/CoursesItemList.jsx
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ORDERED_COLORS = [
  "#D9EEE1", // HTML
  "#FFF4A3", // CSS
  "#FFD580", // JavaScript
  "#96D4D4", // Python
  "#F3ECEA", // C++
  "#E7D1FF", // PHP
];

export default function CoursesLanguage({ categories }) {
const { t } = useTranslation("common");

const renderList = (categoryId) => {
    const courses = categories?.find((category) => category.id === categoryId)?.courses ?? [];

    return (
        <div className="p-1 grid grid-cols-1 lg:grid-cols-2 justify-evenly gap-6 md:gap-10 lg:gap-20">
            {courses.map((course, index) => {
                const ItemColor = ORDERED_COLORS[index % ORDERED_COLORS.length];
                return (
                    <div
                        key={course.id}
                        className="p-6 md:p-10 flex flex-col gap-6 md:gap-10 justify-center items-center rounded-lg"
                        data-aos = "fade-up"
                        data-aos-duration="300"
                        data-aos-offset="0"
                        data-aos-easing="ease-in-sine"
                        style={{ backgroundColor: ItemColor }}
                    >
                        <div className="font-bold text-3xl md:text-5xl lg:text-4xl xl:text-6xl text-center break-words max-w-full">
                            {course.title}
                        </div>    
                        <NavLink
                            type="button"
                            to={`/courses/${course.slug}`}
                            className="py-2 px-14 bg-[#FFCCCC] font-semibold text-lg rounded-2xl hover:scale-[1.02] transition-shadow shadow-md"
                        >
                            {t("Learn")} {course.title}
                        </NavLink>
                    </div>
                );
            })}
        </div>
    );
};
    return { renderList };
}