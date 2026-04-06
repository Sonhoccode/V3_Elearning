// src/api/client.jsx

import axios from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

// If env is not set, fall back to same-origin /api
const resolvedBaseURL = baseURL ? `${baseURL}/api` : "/api";

const api = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Nếu sau này có JWT thì set token ở đây
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Bắt lỗi response cho dễ debug
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Giữ nguyên error để page tự xử lý UI
    return Promise.reject(err);
  }
);

export default api;
