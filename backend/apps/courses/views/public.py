from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from ..models import Category, Course, Lesson, LessonTranslation
from ..serializers import CategoriesItem, CoursesItem
from ..cache_utils import cached_list, MENU_CACHE_TTL
from .helpers import active_categories, active_courses

# Lay tu danh muc va khoa hoc tu cache neu co
class CategoriesList(ReadOnlyModelViewSet):
    serializer_class = CategoriesItem
    permission_classes = [AllowAny]
    queryset = Category.objects.all()
    
    def get_queryset(self):
        return active_categories(super().get_queryset())
    
    # luu vao cache neu chua co 
    def list(self, request, *args, **kwargs):
        return cached_list(self, request, resource="categories", ttl=MENU_CACHE_TTL)

# Lay danh sach khoa hoc
class CourseList(ReadOnlyModelViewSet):
    serializer_class = CoursesItem
    permission_classes = [AllowAny]
    queryset = Course.objects.all()
    
    # chi lay nhung khoa hoc hoat dong
    def get_queryset(self):
        return active_courses()
    
    # luu vao cache neu chua co 
    def list(self, request, *args, **kwargs):
        return cached_list(self, request, resource="courses", ttl=MENU_CACHE_TTL)


# ========== USER APIs - LESSONS READ ONLY ==========

class LessonsByCategoryList(ReadOnlyModelViewSet):
    """
    ViewSet cho danh sách lessons theo category (chỉ đọc)
    
    GET /api/categories/<category>/lessons/?lang=en
    Trả về: Danh sách lessons published trong category
    """
    permission_classes = [AllowAny]
    queryset = Lesson.objects.none()
    
    def list(self, request, category=None, *args, **kwargs):
        # Lấy category từ URL kwargs nếu không có trong parameter
        if category is None:
            category = kwargs.get('category')
        
        lang = request.GET.get("lang", "en")
        
        # Lấy tất cả lessons trong category này
        
        # Lấy category object
        try:
            category_obj = Category.objects.get(slug=category)
        except Category.DoesNotExist:
            return Response([])
        
        # Lấy tất cả courses trong category
        courses = Course.objects.filter(category=category_obj, is_active=True)
        
        # Lấy tất cả lessons từ các courses này
        lessons = Lesson.objects.filter(
            course__in=courses,
            is_active=True
        ).order_by("order")
        
        result = []
        for lesson in lessons:
            # Lấy translation published cho language này
            try:
                translation = lesson.translations.get(lang=lang, status="published")
            except LessonTranslation.DoesNotExist:
                # Fallback sang English
                try:
                    translation = lesson.translations.get(lang="en", status="published")
                except LessonTranslation.DoesNotExist:
                    continue  # Skip lesson này nếu không có translation published
            
            result.append({
                "id": lesson.id,
                "parent": lesson.parent_id,
                "slug": lesson.slug,
                "order": lesson.order,
                "title": translation.title,
                "short_description": translation.short_description,
                "lang": translation.lang,
            })
        
        return Response(result)


class LessonDetailViewSet(ReadOnlyModelViewSet):
    """
    ViewSet cho chi tiết lesson (chỉ đọc)
    
    GET /api/lessons/<slug>/?lang=en
    Trả về: Chi tiết lesson với translation published
    """
    permission_classes = [AllowAny]
    queryset = Lesson.objects.all()
    lookup_field = 'slug'
    
    def retrieve(self, request, slug=None, *args, **kwargs):
        lang = request.GET.get("lang", "en")
        
        try:
            lesson = Lesson.objects.get(slug=slug)
        except Lesson.DoesNotExist:
            return Response(
                {"detail": "Not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Lấy translation published
        try:
            translation = lesson.translations.get(lang=lang, status="published")
        except LessonTranslation.DoesNotExist:
            # Fallback sang English
            try:
                translation = lesson.translations.get(lang="en", status="published")
            except LessonTranslation.DoesNotExist:
                translation = None
        
        data = {
            "slug": lesson.slug,
            "order": lesson.order,
            "lang": lang,
            "translation": {
                "lang": translation.lang if translation else None,
                "title": translation.title if translation else None,
                "short_description": translation.short_description if translation else None,
                "content": translation.content if translation else None,
            },
        }
        
        return Response(data)
