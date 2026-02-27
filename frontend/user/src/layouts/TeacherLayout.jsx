import React, { useMemo } from "react";

const skillData = [
  {
    category: "Frontend",
    skills: [
      {
        name: "React",
        img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
      },
      {
        name: "HTML",
        img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg",
      },
      {
        name: "CSS",
        img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg",
      },
      {
        name: "JavaScript",
        img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
      },
      {
        name: "TailwindCSS",
        img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg",
      },
    ],
  },
  {
    category: "Backend",
    skills: [
      {
        name: "Django",
        img: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/django/django-plain.svg",
      },
    ],
  },
];

export default function Skill() {
  const renderedSkills = useMemo(() => {
    return skillData.map((cat) => (
      <div
        key={cat.category}
        className="mb-12 p-8 bg-white/10 backdrop-blur-lg border border-white/30 shadow-lg"
        data-aos="fade-up"
      >
        {/* Tên nhóm Skill */}
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-l-4 border-blue-500 pl-4">
          {cat.category}
        </h2>

        {/* Grid hiển thị Logo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {cat.skills.map((s) => (
            <div
              key={s.name}
              className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-md 
                         border border-white/20 rounded-2xl shadow-sm 
                         hover:bg-white/20 hover:-translate-y-1 transition-all duration-300"
            >
              <img
                src={s.img}
                alt={s.name}
                className="w-12 h-12 mb-3 drop-shadow-md"
              />
              <span className="text-sm font-semibold text-gray-700">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    ));
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-8">
      <h1
        className="text-4xl font-extrabold mb-12 w-fit text-center p-8 bg-white/10 backdrop-blur-lg border rounded-lg border-white/30 shadow-lg"
        data-aos="zoom-in"
      >
        Technical Skills
      </h1>
      {renderedSkills}
    </div>
  );
}
