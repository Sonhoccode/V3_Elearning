const API_BASE = import.meta.env.VITE_API_BASE;

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

/**
 * Lấy danh sách tất cả lessons (bao gồm cả draft)
 * @returns {Promise} Danh sách tất cả lessons
 */
export async function fetchLessons({ signal } = {}) {
    const res = await fetch(`${API_BASE}/api/v1/admin/lessons/`, {
        method: "GET",
        headers: { Accept: "application/json", ...getAuthHeaders() },
        signal,
    });

    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi tải danh sách bài học"));
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

/**
 * Lấy chi tiết một lesson (admin view - có tất cả translations)
 * @param {string} slug - Slug của lesson
 * @returns {Promise} Chi tiết lesson với tất cả translations
 */
export async function fetchLessonDetail(slug) {
    const res = await fetch(`${API_BASE}/api/v1/admin/lessons/${slug}/`, {
        method: "GET",
        headers: { Accept: "application/json", ...getAuthHeaders() },
    });

    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi tải chi tiết bài học"));
    }

    return res.json();
}

/**
 * Tạo lesson mới
 * @param {Object} payload - Dữ liệu lesson {course, slug, order, parent, kind}
 * @returns {Promise} Lesson mới được tạo
 */
export async function createLesson(payload) {
    const res = await fetch(`${API_BASE}/api/v1/admin/lessons/`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi tạo bài học"));
    }

    return res.json();
}

/**
 * Cập nhật metadata của lesson (slug, order, course, parent, kind)
 * @param {string} slug - Slug của lesson
 * @param {Object} payload - Dữ liệu cần update {slug, order, course, parent, kind}
 * @returns {Promise} Lesson đã được update
 */
export async function updateLessonMetadata(slug, payload) {
    const res = await fetch(`${API_BASE}/api/v1/admin/lessons/${slug}/update/`, {
        method: "PATCH",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi cập nhật bài học"));
    }

    return res.json();
}

/**
 * Tạo hoặc cập nhật translation cho lesson
 * @param {string} slug - Slug của lesson
 * @param {Object} payload - Dữ liệu translation {lang, title, short_description, content, status}
 * @returns {Promise} Translation đã được tạo/cập nhật
 */
export async function upsertLessonTranslation(slug, payload) {
    const res = await fetch(`${API_BASE}/api/v1/admin/lessons/${slug}/translations/`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi lưu bản dịch"));
    }

    return res.json();
}

/**
 * Upload image for lesson content
 * @param {string} slug - Slug của lesson
 * @param {File} file - File ảnh
 * @returns {Promise} {url, path, content_type}
 */
export async function uploadLessonImage(slug, file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/v1/admin/lessons/${slug}/upload-image/`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            ...getAuthHeaders(),
        },
        body: formData,
    });

    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi upload ảnh"));
    }

    return res.json();
}

/**
 * Lấy danh sách ảnh đã upload (group theo course)
 * @param {Object} params - {course, limit, offset}
 * @returns {Promise} {groups, limit, offset, count}
 */
export async function fetchLessonImages({ course, limit, offset } = {}) {
    const params = new URLSearchParams();
    if (course) params.set("course", course);
    if (typeof limit === "number") params.set("limit", String(limit));
    if (typeof offset === "number") params.set("offset", String(offset));

    const query = params.toString();
    const res = await fetch(`${API_BASE}/api/v1/admin/lessons/images/${query ? `?${query}` : ""}`, {
        method: "GET",
        headers: { Accept: "application/json", ...getAuthHeaders() },
    });

    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi tải danh sách ảnh"));
    }

    return res.json();
}

/**
 * Xóa ảnh đã upload
 * @param {string} path - Full path in bucket (e.g. courses/<slug>/lessons/<id>/<file>)
 * @returns {Promise}
 */
export async function deleteLessonImage(path) {
    const params = new URLSearchParams();
    params.set("path", path);
    const res = await fetch(`${API_BASE}/api/v1/admin/lessons/images/delete/?${params.toString()}`, {
        method: "DELETE",
        headers: { Accept: "application/json", ...getAuthHeaders() },
    });

    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi xóa ảnh"));
    }

    return true;
}

/**
 * Xóa lesson và tất cả translations
 * @param {string} slug - Slug của lesson cần xóa
 * @returns {Promise} Kết quả xóa
 */
export async function deleteLesson(slug) {
    const res = await fetch(`${API_BASE}/api/v1/admin/lessons/${slug}/delete/`, {
        method: "DELETE",
        headers: { Accept: "application/json", ...getAuthHeaders() },
    });

    if (!res.ok) {
        throw new Error(await parseError(res, "Lỗi xóa bài học"));
    }

    return res.json();
}
