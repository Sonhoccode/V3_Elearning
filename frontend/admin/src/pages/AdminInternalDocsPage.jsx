import { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  createInternalDocument,
  deleteInternalDocument,
  fetchInternalDocuments,
} from "../api/AdminDocumentsAPI";

const statusStyles = {
  ready: "bg-green-100 text-green-700",
  processing: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

export default function AdminInternalDocsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("text");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  const loadDocs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchInternalDocuments();
      setItems(res.items || []);
    } catch (err) {
      setError(err.message || "Không thể tải tài liệu nội bộ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const filteredItems = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((doc) => {
      const titleText = doc.title?.toLowerCase() || "";
      const filename = doc.original_filename?.toLowerCase() || "";
      return titleText.includes(q) || filename.includes(q);
    });
  }, [items, query]);

  const resetForm = () => {
    setTitle("");
    setText("");
    setFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Vui lòng nhập tên tài liệu.");
      return;
    }

    if (mode === "text" && !text.trim()) {
      setError("Vui lòng nhập nội dung văn bản.");
      return;
    }

    if (mode === "file" && !file) {
      setError("Vui lòng chọn file PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("inputType", mode === "file" ? "file" : "text");
    formData.append("title", title.trim());
    if (mode === "text") {
      formData.append("text", text.trim());
    } else if (file) {
      formData.append("file", file);
    }

    setSaving(true);
    try {
      const created = await createInternalDocument(formData);
      setItems((prev) => [created, ...prev]);
      resetForm();
    } catch (err) {
      setError(err.message || "Không thể thêm tài liệu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!doc?.id) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;
    setDeletingId(doc.id);
    setError("");
    try {
      await deleteInternalDocument(doc.id);
      setItems((prev) => prev.filter((item) => item.id !== doc.id));
    } catch (err) {
      setError(err.message || "Không thể xóa tài liệu");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tài liệu nội bộ</h2>
          <p className="text-sm text-gray-500 mt-1">
            Thêm mới, quản lý và xoá tài liệu phục vụ AI nội bộ.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={loadDocs} isLoading={loading}>
          Tải lại
        </Button>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800">Thêm tài liệu mới</h3>
          <p className="text-sm text-gray-500 mt-1">
            Hỗ trợ văn bản trực tiếp, PDF (OCR) hoặc Word (.docx).
          </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            label="Tên tài liệu"
            placeholder="Ví dụ: Nội quy công ty"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="doc-type"
                value="text"
                checked={mode === "text"}
                onChange={() => setMode("text")}
              />
              Nhập văn bản
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="doc-type"
                value="file"
                checked={mode === "file"}
                onChange={() => setMode("file")}
              />
              Upload PDF
            </label>
          </div>

          {mode === "text" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung văn bản
              </label>
              <textarea
                className="block w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={6}
                placeholder="Dán nội dung tài liệu tại đây..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File PDF hoặc DOCX
              </label>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && (
                <p className="mt-2 text-xs text-gray-500">
                  Đã chọn: {file.name}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" isLoading={saving}>
              Thêm tài liệu
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              Làm mới
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-800">Danh sách tài liệu</h3>
          <div className="w-full max-w-sm">
            <Input
              label="Tìm theo tên hoặc file"
              placeholder="Nhập từ khóa..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-gray-50 p-6 text-center text-gray-500">
            Chưa có tài liệu nội bộ nào.
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {filteredItems.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] bg-white p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-base font-semibold text-gray-800">
                      {doc.title}
                    </h4>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {doc.source_type?.toUpperCase()}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        statusStyles[doc.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {doc.original_filename
                      ? `File: ${doc.original_filename}`
                      : "Nguồn: văn bản"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Chunks: {doc.chunk_count ?? 0} • Tạo: {formatDate(doc.created_at)}
                  </div>
                  {doc.error_message && (
                    <div className="mt-2 text-xs text-red-500">
                      Lỗi: {doc.error_message}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(doc)}
                    isLoading={deletingId === doc.id}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
