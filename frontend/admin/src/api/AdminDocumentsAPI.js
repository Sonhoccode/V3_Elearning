const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function parseError(res, defaultMsg) {
  return res
    .json()
    .then((data) => {
      if (data && typeof data === "object") {
        return data.detail || data.message || data.error || defaultMsg;
      }
      return defaultMsg;
    })
    .catch(() => defaultMsg);
}

export async function fetchInternalDocuments() {
  const res = await fetch(`${API_BASE}/api/ai/documents/`, {
    method: "GET",
    headers: { Accept: "application/json", ...getAuthHeaders() },
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Không thể tải danh sách tài liệu"));
  }

  return res.json();
}

export async function createInternalDocument(formData) {
  const res = await fetch(`${API_BASE}/api/ai/documents/`, {
    method: "POST",
    headers: { Accept: "application/json", ...getAuthHeaders() },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Không thể thêm tài liệu"));
  }

  return res.json();
}

export async function deleteInternalDocument(id) {
  const res = await fetch(`${API_BASE}/api/ai/documents/${id}/`, {
    method: "DELETE",
    headers: { Accept: "application/json", ...getAuthHeaders() },
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Không thể xóa tài liệu"));
  }

  return res.json();
}
