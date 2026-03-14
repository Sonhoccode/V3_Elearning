// frontend/user/src/pages/RoadmapPage.jsx

import RoadmapItem from "../components/items/RoadmapItem.jsx";
import { useTranslation } from "react-i18next";
export default function RoadmapPage() {
  const { roadmapFrontend, roadmapBackend, roadmapOther } = RoadmapItem();
  const { t } = useTranslation("roadmap");

  return (
    <div className="flex flex-col items-center roadmap-bg mb-20 ">
      {/* Review roadmap frontend */}
      <div className="w-full max-w-screen-2xl flex flex-wrap justify-around items-center border-t-4 border-white shadow-lg mt-10 py-10 px-4 gap-10">
        <div className="flex flex-1 flex-col items-center justify-center ">
          <h1
            data-aos="fade-right"
            data-aos-duration="500"
            data-aos-easing="ease-in-sine"
            className="text-4xl font-bold mb-6"
          >
            {t("bg-frontend.title")}
          </h1>
          <p
            data-aos="zoom-in"
            data-aos-duration="600"
            data-aos-delay="300"
            data-aos-easing="ease-in-sine"
            className="px-4 font-medium text-lg"
          >
            {t("bg-frontend.description")}
          </p>
        </div>
        <div className=" h-full flex flex-1 flex-col p-10 bg-frontend rounded-lg shadow-xl">
          {roadmapFrontend}
        </div>
      </div>
      {/* Review roadmap backend */}
      <div className="w-full max-w-screen-2xl flex flex-wrap justify-around items-center border-t-4 border-white shadow-lg mt-10 py-10 px-4 gap-10">
        <div className="h-full flex-1 grid grid-cols-2 gap-x-10 gap-y-12 gap-2 p-12 place-items-center bg-backend rounded-lg shadow-xl">
          {roadmapBackend}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center ">
          <h1
            data-aos="fade-left"
            data-aos-duration="500"
            data-aos-easing="ease-in-sine"
            className="text-4xl font-bold mb-6"
          >
            {t("bg-backend.title")}
          </h1>
          <p
            data-aos="zoom-in"
            data-aos-duration="600"
            data-aos-delay="300"
            data-aos-easing="ease-in-sine"
            className="px-4 font-medium text-lg"
          >
            {t("bg-backend.description")}
          </p>
        </div>
      </div>
      <div className="w-full max-w-screen-2xl flex flex-col justify-around bg-orther items-center border-t-4 border-white shadow-lg mt-10 py-10 px-4 gap-10">
        <div className="p-10 flex flex-1 flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-6">{t("bg-other.title")}</h1>
          <p className="px-4 font-medium text-lg">
            {t("bg-other.description")}
          </p>
        </div>
        <div className="h-full flex flex-1 flex-wrap gap-20">
          {roadmapOther}
        </div>
      </div>
    </div>
  );
}
