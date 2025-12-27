# apps/courses/urls.py
from rest_framework.routers import DefaultRouter
from .views import CategoryList, CourseList

router = DefaultRouter()
router.register(r"categories", CategoryList, basename="category")
router.register(r"courses", CourseList, basename="course")

urlpatterns = router.urls