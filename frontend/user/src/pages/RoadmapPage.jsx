// frontend/user/src/pages/RoadmapPage.jsx

import RoadmapItem from "../components/items/RoadmapItem.jsx";

export default function RoadmapPage() {
  const { roadmapFrontend, roadmapBackend, roadmapOther } = RoadmapItem();


  return (
    <div className="flex flex-col items-center roadmap-bg mb-20 ">
      {/* Review roadmap frontend */}
      <div className="w-full max-w-screen-2xl flex flex-wrap justify-around items-center border-t-4 border-white shadow-lg mt-10 py-10 px-4 gap-10">
        <div className="flex flex-1 flex-col items-center justify-center ">
          <h1 className="text-4xl font-bold mb-6">Lộ Trình Học Frontend</h1>
          <p className="px-4 font-medium text-lg">
            Lộ trình này giúp bạn xây dựng nền tảng vững chắc về phát triển giao
            diện người dùng, bắt đầu từ HTML, CSS cho đến JavaScript và React.
            Phù hợp cho người mới học cũng như những ai muốn hệ thống lại kiến
            thức frontend một cách bài bản.
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
          <h1 className="text-4xl font-bold mb-6">Lộ Trình Học Backend</h1>
          <p className="px-4 font-medium text-lg">
            Lộ trình backend tập trung vào tư duy xử lý phía máy chủ, làm việc
            với cơ sở dữ liệu và xây dựng API cho ứng dụng web. Giúp bạn hiểu rõ
            cách hệ thống vận hành phía sau và kết nối với phần giao diện người
            dùng.
          </p>
        </div>
      </div>
      <div className="w-full max-w-screen-2xl flex flex-col justify-around bg-orther items-center border-t-4 border-white shadow-lg mt-10 py-10 px-4 gap-10">
        <div className="p-10 flex flex-1 flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-6">Lộ Trình Học Backend</h1>
          <p className="px-4 font-medium text-lg">
            Ngoài frontend và backend, chúng mình còn có những 
          </p>
        </div>
        <div className="h-full flex flex-1 flex-wrap gap-20">
          {roadmapOther}
        </div>
      </div>
    </div>

  );
}
