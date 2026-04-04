import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // lng: "vi",
    fallbackLng: "en",
    supportedLngs: ["vi", "en"],

    ns: ["home", "common", "auth", "lesson", "classes", "assessment"],
    defaultNS: "home",

    debug: import.meta.env.DEV,
    interpolation: { escapeValue: false },

    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
