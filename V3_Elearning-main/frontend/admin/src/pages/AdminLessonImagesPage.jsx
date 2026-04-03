import { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { deleteLessonImage, fetchLessonImages } from "../api/AdminLessonsAPI";

export default function AdminLessonImagesPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [deletingPath, setDeletingPath] = useState("");

  const loadImages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchLessonImages();
      setGroups(res.groups || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách ảnh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const filteredGroups = useMemo(() => {
    if (!query) return groups;
    const q = query.toLowerCase();
    return groups
      .map((group) => {
        const courseTitle = group.course?.title?.toLowerCase() || "";
        const courseSlug = group.course?.slug?.toLowerCase() || "";
        const items = (group.items || []).filter((item) => {
          const filename = item.filename?.toLowerCase() || "";
          const path = item.path?.toLowerCase() || "";
          return filename.includes(q) || path.includes(q);
        });

        if (courseTitle.includes(q) || courseSlug.includes(q)) {
          return group;
        }

        if (items.length === 0) return null;
        return { ...group, items };
      })
      .filter(Boolean);
  }, [groups, query]);

  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage("Đã copy link ảnh");
      setTimeout(() => setCopyMessage(""), 1500);
    } catch (err) {
      setCopyMessage("Không thể copy link");
      setTimeout(() => setCopyMessage(""), 1500);
    }
  };

  const escapeHtml = (value) => {
    return (value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  };

  const buildImageTag = (url, altText) => {
    const safeAlt = escapeHtml((altText || "").trim());
    return `<img src="${url}" alt="${safeAlt}" loading="lazy" />`;
  };

  const handleCopyTag = async (item) => {
    const tag = buildImageTag(item.url, item.filename || "");
    try {
      await navigator.clipboard.writeText(tag);
      setCopyMessage("Đã copy thẻ img");
      setTimeout(() => setCopyMessage(""), 1500);
    } catch (err) {
      setCopyMessage("Không thể copy thẻ img");
      setTimeout(() => setCopyMessage(""), 1500);
    }
  };

  const handleDelete = async (item) => {
    if (!item?.path) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này?")) return;
    setDeletingPath(item.path);
    try {
      await deleteLessonImage(item.path);
      setGroups((prev) =>
        prev
          .map((group) => ({
            ...group,
            items: (group.items || []).filter((img) => img.path !== item.path),
          }))
          .filter((group) => group.items.length > 0)
      );
    } catch (err) {
      setError(err.message || "Không thể xóa ảnh");
    } finally {
      setDeletingPath("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Thư viện ảnh bài học</h2>
          <p className="text-sm text-gray-500 mt-1">Ảnh đã upload, chia theo khóa học</p>
        </div>
        <Button type="button" variant="secondary" onClick={loadImages} isLoading={loading}>
          Tải lại
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-4">
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Tìm theo khóa học, tên file hoặc path"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {copyMessage && <span className="text-sm text-gray-600">{copyMessage}</span>}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-center text-gray-500">
          Chưa có ảnh nào
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <div
              key={
                group.course?.slug ||
                group.course?.id ||
                group.items?.[0]?.path ||
                "group"
              }
              className="rounded-lg border border-[var(--color-border)] bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {group.course?.title || group.course?.slug}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {group.course?.slug ? `Slug: ${group.course.slug}` : "Không có slug"}
                    {group.items?.length ? ` • ${group.items.length} ảnh` : ""}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {(group.items || []).map((item) => (
                  <div
                    key={item.path}
                    className="flex gap-3 rounded-lg border border-gray-200 p-3"
                  >
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                      <img
                        src={item.url}
                        alt={item.filename || "lesson-image"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-800">
                        {item.filename || item.path}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Lesson ID: {item.lesson_id || "-"}
                      </div>
                      <div className="mt-1 truncate text-xs text-gray-400">
                        {item.path}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopy(item.url)}
                        >
                          Copy link
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopyTag(item)}
                        >
                          Copy thẻ img
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(item)}
                          isLoading={deletingPath === item.path}
                        >
                          Xóa
                        </Button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          Mở ảnh
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
