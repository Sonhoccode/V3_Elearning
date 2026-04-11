// frontend/user/src/components/items/CoursesItemList.jsx
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ORDERED_COLORS = [
  "#BAE6FD", // Tailwind
  "#C7D2FE", // React
  "#A7F3D0", // Django
  "#FDE68A", // NodeJS
  "#BFDBFE", // PostgreSQL
  "#FFCFD2", // MongoDB
];

export default function CoursesOrther({ categories }) {
const { t } = useTranslation("common");

const renderList = (excluderID) => {
    const courses = categories?.filter((category) => category.id !== excluderID).flatMap(category => category.courses) ?? [];

    return (
        <div className="p-1 mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-evenly gap-6 md:gap-10 lg:gap-16 xl:gap-20">
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
                        <div className="font-bold text-3xl md:text-4xl lg:text-3xl xl:text-5xl text-center break-words max-w-full">
                            {course.title}
                        </div>    
                        <NavLink
                            type="button"
                            to={`/courses/${course.slug}`}
                            className="py-2 px-14 bg-[#FFCCCC] font-semibold text-lg rounded-2xl hover:scale-[1.05] transition-shadow shadow-md"
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