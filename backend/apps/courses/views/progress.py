from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from ..models import Lesson, LessonProgress


def _build_course_filters(course_value):
    if course_value is None:
        return None, None
    course_value = str(course_value).strip()
    if not course_value:
        return None, None
    if course_value.isdigit():
        course_id = int(course_value)
        return Q(course_id=course_id), Q(lesson__course_id=course_id)
    return Q(course__slug=course_value), Q(lesson__course__slug=course_value)


class LessonProgressListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        course_value = request.query_params.get("course")
        lesson_filter, progress_filter = _build_course_filters(course_value)
        if lesson_filter is None or progress_filter is None:
            return Response(
                {"detail": "course is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        completed_slugs = list(
            LessonProgress.objects.filter(
                user=request.user,
                lesson__kind="lesson",
            )
            .filter(progress_filter)
            .values_list("lesson__slug", flat=True)
        )

        return Response(
            {
                "course": course_value,
                "completed_slugs": completed_slugs,
            }
        )


class LessonProgressCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        course_value = request.data.get("course")
        lesson_slug = request.data.get("lesson_slug")

        lesson_filter, _progress_filter = _build_course_filters(course_value)
        if lesson_filter is None or not lesson_slug:
            return Response(
                {"detail": "course and lesson_slug are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            lesson = Lesson.objects.get(lesson_filter, slug=lesson_slug)
        except Lesson.DoesNotExist:
            return Response(
                {"detail": "Lesson not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if lesson.kind != "lesson":
            return Response(
                {"detail": "Only kind=lesson can be completed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        obj, created = LessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson,
        )

        return Response(
            {
                "completed": True,
                "created": created,
                "lesson_slug": lesson.slug,
                "completed_at": obj.completed_at,
            }
        )
