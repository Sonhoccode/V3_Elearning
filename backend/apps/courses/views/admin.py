import os
import uuid
from pathlib import Path
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.cache import cache
from django.conf import settings
from django.core.files.storage import FileSystemStorage

from ..models import Category, Course, Lesson, LessonTranslation
from ..serializers import (
    CategoriesItem, AdminCoursesItem, AdminCategoriesItem,
    AdminLessonDetailSerializer, AdminLessonTranslationSerializer
)
from ..cache_utils import bump_menu_version
from apps.Common.permissions import IsAdminRole

LESSON_CACHE_LANGS = ["vi", "en"]


def _invalidate_lesson_cache(*, course_slug=None, category_slug=None, lesson_slugs=None, langs=None):
    langs = langs or LESSON_CACHE_LANGS
    if lesson_slugs is None:
        lesson_slugs = []
    if isinstance(lesson_slugs, str):
        lesson_slugs = [lesson_slugs]

    for lang in langs:
        if course_slug:
            cache.delete(f"lessons_by_course:{course_slug}:lang={lang}")
        if category_slug:
            cache.delete(f"lessons_list:{category_slug}:lang={lang}")
        for lesson_slug in lesson_slugs:
            cache.delete(f"lesson_detail:{lesson_slug}:lang={lang}")

# ========== ADMIN APIs - FULL CRUD ==========

class AdminLessonViewSet(ModelViewSet):
    """
    ViewSet cho quản lý lessons (admin)
    
    Endpoints:
    - GET    /api/admin/lessons/              : List tất cả lessons
    - POST   /api/admin/lessons/              : Tạo lesson mới
    - GET    /api/admin/lessons/<slug>/       : Chi tiết lesson
    - PATCH  /api/admin/lessons/<slug>/update/: Cập nhật metadata
    - DELETE /api/admin/lessons/<slug>/delete/: Xóa lesson
    - POST   /api/admin/lessons/<slug>/translations/: Tạo/cập nhật translation
    """
    queryset = Lesson.objects.all().order_by("order")
    serializer_class = AdminLessonDetailSerializer
    lookup_field = 'slug'
    permission_classes = [IsAuthenticated, IsAdminRole]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        """
        POST: Tạo lesson mới
        Body: {"course": <course_id>, "slug": "...", "order": 0, "kind": "lesson|group"}
        """
        course_id = request.data.get("course")
        slug = request.data.get("slug")
        order = request.data.get("order", 0)
        parent_id = request.data.get("parent", None)
        kind = request.data.get("kind", "lesson")
        
        # Validate required fields
        if not course_id or not slug:
            return Response(
                {"detail": "course và slug là bắt buộc"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if kind not in ["lesson", "group"]:
            return Response(
                {"detail": "kind phải là 'lesson' hoặc 'group'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Kiểm tra course tồn tại
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(
                {"detail": "Course không tồn tại"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Kiểm tra slug đã tồn tại chưa trong course này
        if Lesson.objects.filter(course=course, slug=slug).exists():
            return Response(
                {"detail": "Slug đã tồn tại trong course này"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Tạo lesson mới
        lesson_data = {
            "course": course,
            "slug": slug,
            "order": order,
            "kind": kind if kind in ["lesson", "group"] else "lesson",
        }
        
        if parent_id:
            try:
                parent = Lesson.objects.get(id=parent_id)
                lesson_data["parent"] = parent
            except Lesson.DoesNotExist:
                pass
        
        lesson = Lesson.objects.create(**lesson_data)
        _invalidate_lesson_cache(
            course_slug=course.slug,
            category_slug=course.category.slug,
        )
        serializer = self.get_serializer(lesson)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch'], url_path='update')
    def update_metadata(self, request, slug=None):
        """
        PATCH: Cập nhật metadata của lesson (slug, order, course, parent)
        Body: {"slug": "...", "order": 0, "course": <id>, "parent": <id>, "kind": "lesson"|"group"}
        """
        try:
            lesson = self.get_object()
        except Lesson.DoesNotExist:
            return Response(
                {"detail": "Lesson not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Cập nhật các fields nếu có
        new_slug = request.data.get("slug")
        new_order = request.data.get("order")
        new_course_id = request.data.get("course")
        new_parent_id = request.data.get("parent")
        new_kind = request.data.get("kind")
        
        old_slug = lesson.slug
        if new_slug and new_slug != slug:
            # Kiểm tra slug mới đã tồn tại chưa
            if Lesson.objects.filter(course=lesson.course, slug=new_slug).exclude(id=lesson.id).exists():
                return Response(
                    {"detail": "Slug already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            lesson.slug = new_slug
        
        if new_order is not None:
            lesson.order = new_order

        if new_kind in ["lesson", "group"]:
            lesson.kind = new_kind
        
        if new_course_id:
            try:
                course = Course.objects.get(id=new_course_id)
                lesson.course = course
            except Course.DoesNotExist:
                return Response(
                    {"detail": "Course not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                    )

        if new_kind is not None:
            if new_kind not in ["lesson", "group"]:
                return Response(
                    {"detail": "kind phải là 'lesson' hoặc 'group'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            lesson.kind = new_kind

        if "parent" in request.data:
            new_parent_id = request.data["parent"]
            if new_parent_id in [None, ""]:
                lesson.parent = None
            else:
                try:
                    parent = Lesson.objects.get(id=new_parent_id)
                    # Prevent circular dependency (optional but good)
                    if parent.id == lesson.id:
                         return Response({"detail": "Cannot be own parent"}, status=status.HTTP_400_BAD_REQUEST)
                    lesson.parent = parent
                except Lesson.DoesNotExist:
                    return Response(
                        {"detail": "Parent lesson not found"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
        
        lesson.save()
        _invalidate_lesson_cache(
            course_slug=lesson.course.slug,
            category_slug=lesson.course.category.slug,
            lesson_slugs=[old_slug, lesson.slug],
        )
        
        serializer = self.get_serializer(lesson)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='translations')
    def upsert_translation(self, request, slug=None):
        """
        POST: Tạo hoặc cập nhật translation cho lesson
        Body: {
            "lang": "en" | "vi",
            "title": "...",
            "short_description": "...",
            "content": "...",
            "status": "draft" | "published"
        }
        """
        try:
            lesson = self.get_object()
        except Lesson.DoesNotExist:
            return Response(
                {"detail": "Lesson not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        lang = request.data.get("lang")
        if lang not in ["vi", "en"]:
            return Response(
                {"detail": "lang phải là 'vi' hoặc 'en'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        data = {
            "lang": lang,
            "title": request.data.get("title", ""),
            "short_description": request.data.get("short_description", ""),
            "content": request.data.get("content", ""),
            "status": request.data.get("status", "draft"),
        }
        
        # Kiểm tra translation đã tồn tại chưa
        try:
            translation = LessonTranslation.objects.get(lesson=lesson, lang=lang)
            # Update existing translation
            serializer = AdminLessonTranslationSerializer(
                translation, data=data, partial=True
            )
        except LessonTranslation.DoesNotExist:
            # Create new translation
            serializer = AdminLessonTranslationSerializer(data=data)
        
        if serializer.is_valid():
            obj = serializer.save(lesson=lesson)
            _invalidate_lesson_cache(
                course_slug=lesson.course.slug,
                category_slug=lesson.course.category.slug,
                lesson_slugs=lesson.slug,
            )
            return Response(AdminLessonTranslationSerializer(obj).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'], url_path='delete')
    def delete_lesson(self, request, slug=None):
        """
        DELETE: Xóa lesson và tất cả translations
        """
        try:
            lesson = self.get_object()
        except Lesson.DoesNotExist:
            return Response(
                {"detail": "Lesson not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        lesson_slug = lesson.slug
        course_slug = lesson.course.slug
        category_slug = lesson.course.category.slug
        lesson.delete()
        _invalidate_lesson_cache(
            course_slug=course_slug,
            category_slug=category_slug,
            lesson_slugs=lesson_slug,
        )
        return Response(
            {"detail": "Lesson deleted successfully"}, 
            status=status.HTTP_204_NO_CONTENT
        )

    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, slug=None):
        lesson = self.get_object()
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "Vui lòng chọn file ảnh."}, status=status.HTTP_400_BAD_REQUEST)

        content_type = (file_obj.content_type or "").lower()
        if not content_type.startswith("image/"):
            return Response({"detail": "File không đúng định dạng ảnh."}, status=status.HTTP_400_BAD_REQUEST)

        course_slug = lesson.course.slug
        lesson_id = lesson.id
        ext = os.path.splitext(file_obj.name)[1].lower() or ".png"
        filename = f"{uuid.uuid4().hex}{ext}"
        rel_path = (Path("courses") / course_slug / "lessons" / str(lesson_id) / filename).as_posix()

        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
        fs = FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)
        saved_path = fs.save(rel_path, file_obj)
        url = request.build_absolute_uri(fs.url(saved_path).replace("\\", "/"))

        return Response(
            {
                "url": url,
                "path": saved_path,
                "content_type": content_type,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='images')
    def list_images(self, request):
        course_param = (request.query_params.get("course") or "").strip()
        try:
            limit = int(request.query_params.get("limit")) if request.query_params.get("limit") else None
        except ValueError:
            limit = None
        try:
            offset = int(request.query_params.get("offset")) if request.query_params.get("offset") else 0
        except ValueError:
            offset = 0

        course_slug_filter = None
        if course_param:
            if course_param.isdigit():
                course = Course.objects.filter(id=int(course_param)).first()
                course_slug_filter = course.slug if course else course_param
            else:
                course_slug_filter = course_param

        base_dir = Path(settings.MEDIA_ROOT) / "courses"
        items = []

        if base_dir.exists():
            for course_dir in base_dir.iterdir():
                if not course_dir.is_dir():
                    continue
                course_slug = course_dir.name
                if course_slug_filter and course_slug != course_slug_filter:
                    continue
                lessons_dir = course_dir / "lessons"
                if not lessons_dir.exists():
                    continue
                for lesson_dir in lessons_dir.iterdir():
                    if not lesson_dir.is_dir():
                        continue
                    lesson_id = lesson_dir.name
                    for file in lesson_dir.iterdir():
                        if not file.is_file():
                            continue
                        rel_path = file.relative_to(settings.MEDIA_ROOT).as_posix()
                        url = request.build_absolute_uri(f"{settings.MEDIA_URL}{rel_path}")
                        items.append(
                            {
                                "course_slug": course_slug,
                                "lesson_id": lesson_id,
                                "filename": file.name,
                                "path": rel_path,
                                "url": url,
                            }
                        )

        total_count = len(items)
        if offset:
            items = items[offset:]
        if limit is not None:
            items = items[:limit]

        course_slugs = {item["course_slug"] for item in items}
        course_map = {
            c.slug: {"id": c.id, "slug": c.slug, "title": c.title}
            for c in Course.objects.filter(slug__in=course_slugs)
        }

        groups_map = {}
        for item in items:
            course_slug = item["course_slug"]
            groups_map.setdefault(
                course_slug,
                {"course": course_map.get(course_slug) or {"slug": course_slug}, "items": []},
            )
            groups_map[course_slug]["items"].append(
                {
                    "url": item["url"],
                    "path": item["path"],
                    "filename": item["filename"],
                    "lesson_id": item["lesson_id"],
                }
            )

        groups = list(groups_map.values())
        return Response(
            {
                "groups": groups,
                "limit": limit,
                "offset": offset,
                "count": total_count,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['delete'], url_path='images/delete')
    def delete_image(self, request):
        rel_path = (request.query_params.get("path") or "").strip().lstrip("/").replace("\\", "/")
        if not rel_path:
            return Response({"detail": "Thiếu tham số path."}, status=status.HTTP_400_BAD_REQUEST)

        base_root = Path(settings.MEDIA_ROOT).resolve()
        abs_path = (base_root / rel_path).resolve()
        if not str(abs_path).startswith(str(base_root)):
            return Response({"detail": "Đường dẫn không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        if abs_path.exists() and abs_path.is_file():
            abs_path.unlink()

            # Cleanup empty directories up to courses folder
            parent = abs_path.parent
            while parent != base_root and parent.exists() and not any(parent.iterdir()):
                parent.rmdir()
                parent = parent.parent

        return Response({"success": True}, status=status.HTTP_200_OK)

    
# View cho course admin
class AdminCourseList(ModelViewSet):
    serializer_class = AdminCoursesItem
    queryset = Course.objects.all()
    permission_classes = [IsAuthenticated, IsAdminRole]
    
    def get_serializer_class(self):
        # get all courses for admin
        if self.action in ["list", "retrieve"]:
            return AdminCoursesItem
        # post, put, patch, delete for admin
        return AdminCoursesItem
    
    def perform_create(self, serializer):
        serializer.save()
        bump_menu_version()

    def perform_update(self, serializer):
        serializer.save()
        bump_menu_version()

    def perform_destroy(self, instance):
        instance.delete()
        bump_menu_version()
        
# View cho category admin
class AdminCategoriesList(ModelViewSet):
    serializer_class = CategoriesItem
    queryset = Category.objects.all()
    permission_classes = [IsAuthenticated, IsAdminRole]
    
    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return AdminCategoriesItem
        return AdminCategoriesItem

    def perform_create(self, serializer):
        serializer.save()
        bump_menu_version()
    
    def perform_update(self, serializer):
        serializer.save()
        bump_menu_version()
        
    def perform_destroy(self, instance):
        instance.delete()
        bump_menu_version()
