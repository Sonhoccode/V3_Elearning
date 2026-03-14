// src/api/courses.api.js
const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchCourses(opts) {
    const signal = opts && opts.signal ? opts.signal : undefined;
    const url = API_BASE + "/api/v1/courses/";

    let res;
    // eslint-disable-next-line no-useless-catch
    try {
        res = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: signal,
        });
    } catch (err) {
        throw err;
    }

    if (!res.ok) {
        let detail = "";
        try {
            const data = await res.json()
            if (data && typeof data === "object") {
                detail = data.detail || data.message || "";
            } else if (typeof data === "string") {
                detail = data;
            }
        // eslint-disable-next-line no-unused-vars
        } catch (e) {
            // ignore
        }
        throw new Error(detail || "HTTP " + res.status + " khi tải courses");
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export const fetchLessonCount = async (courseId) => {
  const res = await fetch(`/api/courses/${courseId}/lesson-count/`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch lesson count");

  return res.json();
};

export const fetchCourseProgress = async (courseId) => {
  const res = await fetch(`${API_BASE}/api/v1/courses/${courseId}/progress/`, {
    credentials: "include"
  });
  return res.json();
};

export const completeLesson = async (lessonSlug) => {
  const res = await fetch(`${API_BASE}/api/v1/lessons/${lessonSlug}/complete/`, {
    method: "POST",
    credentials: "include"
  });

  if (!res.ok) throw new Error("Failed to complete lesson");

  return res.json();
};