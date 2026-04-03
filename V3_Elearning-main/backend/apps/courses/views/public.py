from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import action

from ..models import Category, Course, Lesson, LessonTranslation, LessonProgress
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

    lookup_field = "slug"

    def get_queryset(self):
        return active_courses()

    def list(self, request, *args, **kwargs):
        return cached_list(self, request, resource="courses", ttl=MENU_CACHE_TTL)

    # ===== API PROGRESS =====
    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def progress(self, request, slug=None):

        user = request.user
        course = self.get_object()

        total = Lesson.objects.filter(course=course, kind="lesson").count()

        completed = LessonProgress.objects.filter(
            user=user,
            lesson__course=course,
            completed=True
        ).count()

        percent = (completed / total * 100) if total else 0

        return Response({
            "total": total,
            "completed": completed,
            "percent": percent
        })


# ========== USER APIs - LESSONS READ ONLY ==========

class LessonsByCategoryList(ReadOnlyModelViewSet):

    permission_classes = [AllowAny]
    queryset = Lesson.objects.none()

    def list(self, request, category=None, *args, **kwargs):

        if category is None:
            category = kwargs.get('category')

        lang = request.GET.get("lang", "en")

        cache_key = f"lessons_list:{category}:lang={lang}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        try:
            category_obj = Category.objects.get(slug=category)
        except Category.DoesNotExist:
            return Response([])

        courses = Course.objects.filter(category=category_obj, is_active=True)

        lessons = Lesson.objects.filter(
            course__in=courses,
            is_active=True
        ).order_by("order")

        result = []
        for lesson in lessons:

            try:
                translation = lesson.translations.get(lang=lang, status="published")
            except LessonTranslation.DoesNotExist:
                try:
                    translation = lesson.translations.get(lang="en", status="published")
                except LessonTranslation.DoesNotExist:
                    continue

            result.append({
                "id": lesson.id,
                "parent": lesson.parent_id,
                "slug": lesson.slug,
                "kind": lesson.kind,
                "order": lesson.order,
                "title": translation.title,
                "short_description": translation.short_description,
                "lang": translation.lang,
            })

        cache.set(cache_key, result, timeout=MENU_CACHE_TTL)
        return Response(result)


class LessonsByCourseList(ReadOnlyModelViewSet):

    permission_classes = [AllowAny]
    queryset = Lesson.objects.none()

    def list(self, request, course=None, *args, **kwargs):

        if course is None:
            course = kwargs.get("course")

        lang = request.GET.get("lang", "en")

        cache_key = f"lessons_by_course:{course}:lang={lang}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        try:
            course_obj = Course.objects.get(slug=course, is_active=True)
        except Course.DoesNotExist:
            return Response([])

        lessons = Lesson.objects.filter(
            course=course_obj,
            is_active=True
        ).order_by("order")

        result = []
        for lesson in lessons:

            try:
                translation = lesson.translations.get(lang=lang, status="published")
            except LessonTranslation.DoesNotExist:
                try:
                    translation = lesson.translations.get(lang="en", status="published")
                except LessonTranslation.DoesNotExist:
                    continue

            result.append({
                "id": lesson.id,
                "parent": lesson.parent_id,
                "slug": lesson.slug,
                "kind": lesson.kind,
                "order": lesson.order,
                "title": translation.title,
                "short_description": translation.short_description,
                "lang": translation.lang,
            })

        cache.set(cache_key, result, timeout=MENU_CACHE_TTL)
        return Response(result)


class LessonDetailViewSet(ReadOnlyModelViewSet):

    permission_classes = [AllowAny]
    queryset = Lesson.objects.all()
    lookup_field = 'slug'

    def retrieve(self, request, slug=None, *args, **kwargs):

        lang = request.GET.get("lang", "en")

        cache_key = f"lesson_detail:{slug}:lang={lang}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        try:
            lesson = Lesson.objects.get(slug=slug)
        except Lesson.DoesNotExist:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            translation = lesson.translations.get(lang=lang, status="published")
        except LessonTranslation.DoesNotExist:
            try:
                translation = lesson.translations.get(lang="en", status="published")
            except LessonTranslation.DoesNotExist:
                translation = None

        data = {
            "slug": lesson.slug,
            "kind": lesson.kind,
            "order": lesson.order,
            "lang": lang,
            "translation": {
                "lang": translation.lang if translation else None,
                "title": translation.title if translation else None,
                "short_description": translation.short_description if translation else None,
                "content": translation.content if translation else None,
            },
        }

        cache.set(cache_key, data, timeout=MENU_CACHE_TTL)
        return Response(data)

    # ===== API ĐÁNH DẤU HOÀN THÀNH BÀI HỌC =====
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def complete(self, request, slug=None):

        lesson = self.get_object()

        progress, created = LessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson
        )

        progress.completed = True
        progress.save()

        return Response({
            "status": "completed"
        })