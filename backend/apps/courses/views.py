# courses/views.py
# from django.core.cache import cache
# from django_redis.exceptions import ConnectionInterrupted
# from redis.exceptions import ConnectionError as RedisConnectionError

from django.db.models import Prefetch
# from rest_framework.response import Response 
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.permissions import AllowAny

from .models import Category, Course
from .serializers import CategoryItem, CoursesItem
from .cache_utils import cached_list, MENU_CACHE_TTL

# lay danh sach khoa hoc active
def active_courses():
    return (
        Course.objects
        .filter(is_active=True)
        .only("id", "title", "slug", "description", "order", "category_id")
        .order_by("order", "title")
    )
    
# chi lay nhung danh muc hoat dong
def active_categories(base_qs=None):
    if base_qs is None:
        base_qs = Category.objects.all()
    return (
        base_qs
        .filter(is_active=True)
        .only("id", "name", "slug", "order")
        .prefetch_related(Prefetch("courses", queryset=active_courses()))
        .order_by("order", "name")
    )
    

# Lay tu danh muc va khoa hoc tu cache neu co
class CategoryList(ReadOnlyModelViewSet):
    serializer_class = CategoryItem
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

    
    