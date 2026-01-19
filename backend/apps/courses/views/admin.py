from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from ..models import Category, Course, Lesson, LessonTranslation
from ..serializers import (
    CategoriesItem, AdminCoursesItem, AdminCategoriesItem,
    AdminLessonDetailSerializer, AdminLessonTranslationSerializer
)
from ..cache_utils import bump_menu_version

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
    # permission_classes = [IsAdminUser]  # Uncomment khi có authentication
    
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
    # permission_classes = [IsAdminUser]
    
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
    # permission_classes = [IsAdminUser]
    
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
