# Phân Tích Toàn Bộ Model (Hiện Tại)

Tài liệu này tổng hợp và phân tích tất cả model hiện có trong `backend/apps/**/models.py`.

## Tổng Quan Ứng Dụng
- `apps/Common`: chứa custom user model và verification OTP.
- `apps/courses`: chứa hệ thống danh mục, khóa học, bài học và bản dịch.
- `apps/User`: chưa định nghĩa model.
- `apps/accounts`: chưa định nghĩa model.

---

## 1) `apps/Common/models.py`

### `UserManager`
Custom manager cho `User`.
- `create_user(username, email, password=None, role='student')`  
  - `role='teacher'` -> `is_approved=False`.
  - Các role khác -> `is_approved=True`.
- `create_superuser(username, email, password)`  
  - Tạo user với `role='admin'`, `is_staff=True`, `is_superuser=True`.

### `User` (custom)
Kế thừa `AbstractBaseUser`, `PermissionsMixin`.

**Fields**
- `username` (unique)
- `email` (unique)
- `role`: `admin | teacher | student`
- `is_approved`: true/false (teacher mặc định false)
- `is_active`, `is_staff`
- `last_login` (nullable)
- `created_at` (auto)
- `is_verified` (bool)

**Auth settings**
- `USERNAME_FIELD = 'username'`
- `REQUIRED_FIELDS = ['email']`
- `objects = UserManager()`

**Meta**
- `db_table = 'user'`
- `ordering = ['-created_at']`

**Notes**
- Đây là user model chính. Các app khác nên tham chiếu đến model này để tránh lệch data.
- `last_login` và `created_at` đã có, nhưng không có `updated_at`.

### `Verification`
Model xác thực OTP.

**Fields**
- `us`: FK -> `User`
- `vc_otp`: OTP string
- `vc_start`, `vc_end`: thời gian hiệu lực
- `vc_status`: đã xác thực hay chưa

**Meta**
- `db_table = 'verification'`

**Notes**
- OTP gắn với user theo FK, không gắn theo email/phone riêng.

---

## 2) `apps/courses/models.py`

### `Category`
Danh mục khóa học.

**Fields**
- `name`
- `slug` (unique)
- `order`
- `is_active`

**Meta**
- `db_table = 'categories'`
- `ordering = ['order']`

**Notes**
- `slug` dùng làm định danh URL.
- `order` là thứ tự hiển thị.

### `Course`
Khóa học thuộc danh mục.

**Fields**
- `category`: FK -> `Category` (`PROTECT`)
- `title`, `slug` (unique)
- `description` (blank)
- `order`
- `is_active`

**Meta**
- `db_table = 'courses'`

**Notes**
- `PROTECT` ngăn xóa Category nếu còn khóa học.
- Không có `created_at/updated_at`.
- Không có `__str__` (nếu cần hiển thị admin sẽ tiện hơn).

### `Lesson`
Bài học trong khóa, hỗ trợ cây (parent/children) và phân loại group/lesson.

**Fields**
- `course`: FK -> `Course` (`CASCADE`)
- `parent`: FK -> `Lesson` (nullable, self-reference)
- `slug`
- `kind`: `group | lesson` (default `lesson`)
- `order`
- `is_active`
- `created_at`, `updated_at`

**Meta**
- `unique_together = (course, slug)`
- `ordering = ['order']`
- `db_table = 'lessons'`

**Notes**
- `parent` tạo cây bài học (section/subsection).
- `kind` dùng để phân biệt node “nhóm” và node “bài học”.
  - `group`: node gom bài, không nên tính vào % hoàn thành.
  - `lesson`: bài học thực sự.

### `LessonTranslation`
Nội dung đa ngôn ngữ cho `Lesson`.

**Fields**
- `lesson`: FK -> `Lesson`
- `lang` (vd: `vi`, `en`)
- `title`
- `short_description`
- `content`
- `status`: `draft | published`
- `created_at`, `updated_at`

**Meta**
- `unique_together = (lesson, lang)`
- `db_table = 'lesson_translations'`

**Notes**
- Một bài học chỉ có một bản dịch mỗi ngôn ngữ.
- `status` phục vụ publish/draft.

---

## 3) `apps/User/models.py`
File hiện chỉ có skeleton:
- Không có model thực tế.

**Notes**
- Có thể app này chỉ dùng views/serializers riêng, còn model dùng từ `apps/Common`.

---

## 4) `apps/accounts/models.py`
File hiện chỉ có skeleton:
- Không có model thực tế.

---

## Quan Hệ Chính
- `Category (1) -> (N) Course`
- `Course (1) -> (N) Lesson`
- `Lesson (1) -> (N) Lesson` (self FK)
- `Lesson (1) -> (N) LessonTranslation`
- `User (1) -> (N) Verification`

---

## Lưu Ý Kiến Trúc
- `User` model nằm ở `apps/Common` trong khi `apps/User` trống → nên thống nhất nơi định nghĩa user để tránh nhầm.
- `Lesson.kind` là nguồn sự thật để tính tiến độ học (không dùng `parent_id`).
- Dữ liệu tree (`parent/children`) nên đồng bộ với `kind` để tránh lệch % hoàn thành.

