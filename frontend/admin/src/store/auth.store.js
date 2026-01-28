import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as loginApi } from "../api/auth";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await loginApi(email, password);
          // Assuming data contains { access: "...", refresh: "..." }
          const token = data.access;
          
          // Helper to set local storage if client.js doesn't pick it up automatically from store
          // But client.js reads localStorage.getItem("access_token")
          localStorage.setItem("access_token", token);
          if (data.refresh) {
              localStorage.setItem("refresh_token", data.refresh);
          }

          set({ 
            token, 
            isAuthenticated: true, 
            isLoading: false,
            // You might want to set user info here if returned or decode token
            user: { email }
          });
          return true;
        } catch (error) {
          console.error("Login failed:", error);
          set({ 
            error: error.response?.data?.detail || "Login failed", 
            isLoading: false,
            isAuthenticated: false
          });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth_store",
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated, user: state.user }),
    }
  )
);
