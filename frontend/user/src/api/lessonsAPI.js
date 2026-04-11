const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

export async function fetchLessonProgress({ courseSlug, signal } = {}) {
  if (!courseSlug) return [];
  const res = await fetch(
    `${API_BASE}/api/v1/lessons/progress/?course=${courseSlug}`,
    {
      method: "GET",
      headers: { Accept: "application/json", ...getAuthHeaders() },
      credentials: "include",
      signal,
    }
  );
  if (!res.ok) throw new Error("Lỗi tải tiến độ");
  const data = await res.json();
  return Array.isArray(data?.completed_slugs) ? data.completed_slugs : [];
}

export async function markLessonCompleted({ courseSlug, lessonSlug }) {
  if (!courseSlug || !lessonSlug) return null;
  const res = await fetch(`${API_BASE}/api/v1/lessons/progress/complete/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({
      course: courseSlug,
      lesson_slug: lessonSlug,
    }),
  });
  if (!res.ok) throw new Error("Lỗi lưu tiến độ");
  return res.json();
}
