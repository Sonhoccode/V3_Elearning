const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

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

// get categories
export async function fetchCategories({ signal } = {}) {
    const res = await fetch(`${API_BASE}/api/v1/categories/`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
    });

    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi tải categories"));
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

// post categories
export async function createCategories(payload) {
    const res = await fetch(`${API_BASE}/api/v1/categories/`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi tạo category"));
    }

    return res.json();
}

// get courses
export async function fetchCourses({ signal } = {}) {
    const res = await fetch(`${API_BASE}/api/v1/admin/courses/`, {
        method: "GET",
        headers: { Accept: "application/json", ...getAuthHeaders() },
        signal,
    });
    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi tải courses"));
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

// post courses
export async function createCourses(payload) {
    const res = await fetch(`${API_BASE}/api/v1/admin/courses/`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi tạo courses"));
    }

    return res.json();
}

// delete courses
export async function deleteCourse(id) {
    const res = await fetch(`${API_BASE}/api/v1/admin/courses/${id}/`, {
        method: "DELETE",
        headers: {
            "Accept": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi xóa course"));
    }
    
    // 204 No Content usually returns null, but let's check content-length or just don't parse json if 204
    if (res.status === 204) return null;
    return res.json();
}
