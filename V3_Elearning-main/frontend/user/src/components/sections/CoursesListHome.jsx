
import CoursesLanguage from "../items/CoursesLanguage.jsx";
import CoursesOrther from "../items/CoursesOrther.jsx";

export default function CoursesListHome({ categories, isLoading }) {
  const { renderList: renderLanguageList } = CoursesLanguage({ categories });
  const { renderList: renderOrtherList } = CoursesOrther({ categories });

  return (
    <>
      <div className="w-full h-full z-10 p-10 ">
        {isLoading ? (
          <div className="p-1 grid grid-cols-2 justify-evenly gap-20 min-h-[420px]">
            <div className="h-56 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-56 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        ) : (
          renderLanguageList(1)
        )}
        {isLoading ? (
          <div className="p-1 grid grid-cols-3 justify-evenly gap-20 min-h-[420px]">
            <div className="h-56 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-56 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-56 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        ) : (
          renderOrtherList(1)
        )}
      </div>
    </>
  );
}
