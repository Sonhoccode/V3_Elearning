# apps/courses/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriesList, CourseList, AdminCourseList, AdminCategoriesList,
    LessonsByCategoryList, LessonsByCourseList, LessonDetailViewSet, AdminLessonViewSet
)

router = DefaultRouter()
router.register(r"categories", CategoriesList, basename="category")
router.register(r"courses", CourseList, basename="course")

# admin
router.register(r"admin/categories", AdminCategoriesList, basename="admin-category")
router.register(r"admin/courses", AdminCourseList, basename="admin-course")
router.register(r"admin/lessons", AdminLessonViewSet, basename="admin-lesson")

urlpatterns = [
    # User APIs cho lessons
    path("categories/<str:category>/lessons/", LessonsByCategoryList.as_view({'get': 'list'}), name="get-lessons-by-category"),
    path("courses/<str:course>/lessons/", LessonsByCourseList.as_view({'get': 'list'}), name="get-lessons-by-course"),
    path("lessons/<slug:slug>/", LessonDetailViewSet.as_view({'get': 'retrieve'}), name="lesson-detail"),
] + router.urls
