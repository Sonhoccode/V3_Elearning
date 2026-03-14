// // src/api/categories.api.js

const API_BASE = import.meta.env.VITE_API_BASE;

function parseError(res, defaultMsg) {
    return res.json()
        .then((data) => {
            if (data && typeof data === "object") {
                return data.detail || data.message || defaultMsg;
            }
            return defaultMsg;
        })
        .catch(() => defaultMsg);
}

// GET categories
export async function fetchCategories({ signal } = {}) {
    const res = await fetch(`${API_BASE}/api/v1/categories/`,{
        mehtod: "GET",
        headers: { Accept: "application/json" },
        signal,
    });
    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi tải categories"));
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

