import { useEffect, useState } from "react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import LanguageIcon from "@mui/icons-material/Language";
import { useTranslation } from "react-i18next";

export default function DropLanguage() {
  const [langOpen, setLangOpen] = useState(false);
  const { t, i18n } = useTranslation("common");

  const currentLang = (i18n.resolvedLanguage || i18n.language || "vi").split(
    "-"
  )[0];

  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest("[data-lang-menu]")) setLangOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="ml-auto flex items-center gap-2 relative" data-lang-menu>
      <button
        onClick={() => setLangOpen((v) => !v)}
        type="button"
        className="text-lg flex items-center px-1 py-4 transition-all text-gray-700 hover:bg-[#FFCCCC] font-bold"
      >
        <LanguageIcon />
        {/* {t("language.language")} */}
        <ArrowDropDownIcon
          className={
            langOpen ? "rotate-180 transition-transform" : "transition-transform"
          }
        />
      </button>

      {langOpen && (
        <aside
          className="
            absolute top-full right-0 mt-2 z-50
            min-w-[180px] overflow-hidden
            rounded-xl border border-gray-100 bg-white
            shadow-lg
            origin-top-right animate-[fadeInTranslate_.12s_ease-out]
          "
        >
          <div className="p-2">
            <button
              onClick={() => {
                changeLanguage("en");
                setLangOpen(false);
              }}
              type="button"
              className={`
                w-full px-3 py-2 rounded-lg
                flex items-center justify-between
                transition-all
                ${
                  currentLang === "en"
                    ? "bg-[#FFCCCC] text-gray-900 font-bold"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <span className="text-sm">{t("language.en")}</span>
              <span
                className={`
                  text-[11px] px-2 py-0.5 rounded-full
                  ${currentLang === "en" ? "bg-white/70" : "bg-gray-100"}
                `}
              >
                EN
              </span>
            </button>

            <button
              onClick={() => {
                changeLanguage("vi");
                setLangOpen(false);
              }}
              type="button"
              className={`
                mt-1 w-full px-3 py-2 rounded-lg
                flex items-center justify-between
                transition-all
                ${
                  currentLang === "vi"
                    ? "bg-[#FFCCCC] text-gray-900 font-bold"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <span className="text-sm">{t("language.vi")}</span>
              <span
                className={`
                  text-[11px] px-2 py-0.5 rounded-full
                  ${currentLang === "vi" ? "bg-white/70" : "bg-gray-100"}
                `}
              >
                VI
              </span>
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
