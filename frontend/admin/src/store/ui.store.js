// src/store/ui.store.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUIStore = create(
  persist(
    (set) => ({
      lang: "en",
      theme: "light",

      setLang: (lang) => set({ lang }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
    }),
    { name: "ui_store" }
  )
);
