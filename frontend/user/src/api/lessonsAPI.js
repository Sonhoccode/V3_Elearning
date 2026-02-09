const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchLessonsByCourse({ courseSlug, lang, signal } = {}) {
  if (!courseSlug) return [];
  const res = await fetch(
    `${API_BASE}/api/v1/courses/${courseSlug}/lessons/?lang=${lang}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    }
  );
  if (!res.ok) throw new Error("Lỗi tải lessons");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchLessonDetail({ lessonSlug, lang, signal } = {}) {
  if (!lessonSlug) return null;
  const res = await fetch(
    `${API_BASE}/api/v1/lessons/${lessonSlug}/?lang=${lang}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    }
  );
  if (!res.ok) return null;
  return res.json();
}
