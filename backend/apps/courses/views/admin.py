import os
from uuid import uuid4

import requests
from django.conf import settings
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser

from ..models import Category, Course, Lesson, LessonTranslation
from ..serializers import (
    CategoriesItem, AdminCoursesItem, AdminCategoriesItem,
    AdminLessonDetailSerializer, AdminLessonTranslationSerializer
)
from ..cache_utils import bump_menu_version
from apps.Common.permissions import IsAdminRole

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
    
    def create(self, request, *args, **kwargs):
        """
        POST: Tạo lesson mới
        Body: {"course": <course_id>, "slug": "...", "order": 0}
        """
        course_id = request.data.get("course")
        slug = request.data.get("slug")
        order = request.data.get("order", 0)
        parent_id = request.data.get("parent", None)
        
        # Validate required fields
        if not course_id or not slug:
            return Response(
                {"detail": "course và slug là bắt buộc"},
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
            "order": order
        }
        
        if parent_id:
            try:
                parent = Lesson.objects.get(id=parent_id)
                lesson_data["parent"] = parent
            except Lesson.DoesNotExist:
                pass
        
        lesson = Lesson.objects.create(**lesson_data)
        serializer = self.get_serializer(lesson)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch'], url_path='update')
    def update_metadata(self, request, slug=None):
        """
        PATCH: Cập nhật metadata của lesson (slug, order, course, parent)
        Body: {"slug": "...", "order": 0, "course": <id>, "parent": <id>}
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
        
        if new_course_id:
            try:
                course = Course.objects.get(id=new_course_id)
                lesson.course = course
            except Course.DoesNotExist:
                return Response(
                    {"detail": "Course not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        
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
            return Response(AdminLessonTranslationSerializer(obj).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=True,
        methods=["post"],
        url_path="upload-image",
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_image(self, request, slug=None):
        """
        POST: Upload image to Supabase Storage, return public URL.
        Body (multipart): file=<image>
        """
        try:
            lesson = self.get_object()
        except Lesson.DoesNotExist:
            return Response(
                {"detail": "Lesson not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        upload = request.FILES.get("file")
        if not upload:
            return Response(
                {"detail": "file là bắt buộc"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_size = 5 * 1024 * 1024
        if upload.size > max_size:
            return Response(
                {"detail": "File quá lớn (tối đa 5MB)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content_type = (upload.content_type or "").lower()
        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
        }
        if content_type not in allowed_types:
            return Response(
                {"detail": "Chỉ hỗ trợ JPG/PNG/GIF/WEBP/SVG"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        supabase_url = settings.SUPABASE_URL
        supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY
        bucket = settings.SUPABASE_BUCKET
        if not supabase_url or not supabase_key or not bucket:
            return Response(
                {"detail": "Supabase chưa được cấu hình"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        ext = os.path.splitext(upload.name or "")[1].lower()
        if not ext:
            ext_map = {
                "image/jpeg": ".jpg",
                "image/png": ".png",
                "image/gif": ".gif",
                "image/webp": ".webp",
                "image/svg+xml": ".svg",
            }
            ext = ext_map.get(content_type, "")

        course_slug = lesson.course.slug or f"course-{lesson.course_id}"
        object_path = f"courses/{course_slug}/lessons/{lesson.id}/{uuid4().hex}{ext}"
        upload_url = f"{supabase_url.rstrip('/')}/storage/v1/object/{bucket}/{object_path}"

        headers = {
            "Authorization": f"Bearer {supabase_key}",
            "apikey": supabase_key,
            "Content-Type": content_type,
            "x-upsert": "true",
        }

        try:
            upload.file.seek(0)
            resp = requests.post(
                upload_url,
                data=upload.file,
                headers=headers,
                timeout=30,
            )
        except requests.RequestException:
            return Response(
                {"detail": "Lỗi kết nối Supabase"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if resp.status_code not in [200, 201]:
            return Response(
                {"detail": "Upload ảnh thất bại"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        public_url = (
            f"{supabase_url.rstrip('/')}/storage/v1/object/public/{bucket}/{object_path}"
        )

        return Response(
            {"url": public_url, "path": object_path, "content_type": content_type},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="images")
    def list_images(self, request):
        """
        GET: List images in Supabase Storage, grouped by course.
        Query: course=<slug>, limit=<int>, offset=<int>
        """
        supabase_url = settings.SUPABASE_URL
        supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY
        bucket = settings.SUPABASE_BUCKET
        if not supabase_url or not supabase_key or not bucket:
            return Response(
                {"detail": "Supabase chưa được cấu hình"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            limit = int(request.query_params.get("limit", 1000))
            offset = int(request.query_params.get("offset", 0))
        except ValueError:
            return Response(
                {"detail": "limit/offset không hợp lệ"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if limit > 1000:
            limit = 1000
        if offset < 0:
            offset = 0

        course_filter = request.query_params.get("course")
        if course_filter:
            prefix = f"courses/{course_filter}/"
        else:
            prefix = "courses/"

        list_url = f"{supabase_url.rstrip('/')}/storage/v1/object/list/{bucket}"
        headers = {
            "Authorization": f"Bearer {supabase_key}",
            "apikey": supabase_key,
        }

        def list_objects(folder_prefix):
            payload = {
                "prefix": folder_prefix,
                "limit": limit,
                "offset": offset,
                "sortBy": {"column": "name", "order": "asc"},
            }
            try:
                resp = requests.post(
                    list_url, json=payload, headers=headers, timeout=30
                )
            except requests.RequestException:
                return None

            if resp.status_code != 200:
                return None

            data = resp.json()
            return data if isinstance(data, list) else None

        courses = Course.objects.all().values("id", "slug", "title")
        course_map = {c["slug"]: c for c in courses}

        grouped = {}

        if course_filter:
            course_slugs = [course_filter]
        else:
            top = list_objects(prefix)
            if top is None:
                return Response(
                    {"detail": "Không thể lấy danh sách ảnh"},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            course_slugs = [
                obj.get("name")
                for obj in top
                if obj.get("name") and "/" not in obj.get("name")
            ]

        for course_slug in course_slugs:
            lessons_prefix = f"courses/{course_slug}/lessons/"
            lesson_folders = list_objects(lessons_prefix)
            if lesson_folders is None:
                return Response(
                    {"detail": "Không thể lấy danh sách ảnh"},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            for lesson_entry in lesson_folders:
                lesson_name = lesson_entry.get("name")
                if not lesson_name or "/" in lesson_name:
                    continue

                lesson_id = lesson_name
                is_file = bool(lesson_entry.get("metadata"))

                targets = []
                if is_file:
                    targets.append(
                        {
                            "obj": lesson_entry,
                            "path": f"{lessons_prefix}{lesson_name}",
                            "lesson_id": None,
                        }
                    )
                else:
                    images_prefix = f"{lessons_prefix}{lesson_name}/"
                    images = list_objects(images_prefix)
                    if images is None:
                        return Response(
                            {"detail": "Không thể lấy danh sách ảnh"},
                            status=status.HTTP_502_BAD_GATEWAY,
                        )
                    for image_obj in images:
                        image_name = image_obj.get("name")
                        if not image_name or "/" in image_name:
                            continue
                        targets.append(
                            {
                                "obj": image_obj,
                                "path": f"{images_prefix}{image_name}",
                                "lesson_id": lesson_id,
                            }
                        )

                for target in targets:
                    obj = target["obj"]
                    full_path = target["path"]
                    filename = full_path.split("/")[-1]
                    metadata = obj.get("metadata") or {}
                    public_url = (
                        f"{supabase_url.rstrip('/')}/storage/v1/object/public/"
                        f"{bucket}/{full_path}"
                    )

                    course_info = course_map.get(course_slug) or {
                        "id": None,
                        "slug": course_slug,
                        "title": course_slug,
                    }

                    if course_slug not in grouped:
                        grouped[course_slug] = {
                            "course": course_info,
                            "items": [],
                        }

                    grouped[course_slug]["items"].append(
                        {
                            "path": full_path,
                            "url": public_url,
                            "filename": filename,
                            "lesson_id": target["lesson_id"],
                            "metadata": metadata,
                            "updated_at": obj.get("updated_at"),
                        }
                    )

        groups = list(grouped.values())
        groups.sort(key=lambda g: g["course"]["title"] or g["course"]["slug"])

        return Response(
            {
                "groups": groups,
                "limit": limit,
                "offset": offset,
                "count": sum(len(g["items"]) for g in groups),
            }
        )

    @action(detail=False, methods=["delete"], url_path="images/delete")
    def delete_image(self, request):
        """
        DELETE: Remove image from Supabase Storage.
        Query: path=<full_path>
        """
        supabase_url = settings.SUPABASE_URL
        supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY
        bucket = settings.SUPABASE_BUCKET
        if not supabase_url or not supabase_key or not bucket:
            return Response(
                {"detail": "Supabase chưa được cấu hình"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        path = request.query_params.get("path", "").strip()
        if not path:
            return Response(
                {"detail": "path là bắt buộc"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not path.startswith("courses/"):
            return Response(
                {"detail": "path không hợp lệ"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        delete_url = (
            f"{supabase_url.rstrip('/')}/storage/v1/object/{bucket}/{path}"
        )
        headers = {
            "Authorization": f"Bearer {supabase_key}",
            "apikey": supabase_key,
        }

        try:
            resp = requests.delete(delete_url, headers=headers, timeout=30)
        except requests.RequestException:
            return Response(
                {"detail": "Lỗi kết nối Supabase"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if resp.status_code not in [200, 204]:
            return Response(
                {"detail": "Xóa ảnh thất bại"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
    
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
        
        lesson.delete()
        return Response(
            {"detail": "Lesson deleted successfully"}, 
            status=status.HTTP_204_NO_CONTENT
        )

    
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
