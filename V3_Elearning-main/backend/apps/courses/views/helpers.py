from django.db.models import Prefetch
from ..models import Category, Course, Lesson, LessonTranslation

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


# ========== HELPER FUNCTIONS CHO LESSONS ==========

def get_published_translations(lang="en"):
    """
    Trả về queryset các translations đã published
    Dùng để prefetch cho lessons
    """
    return (
        LessonTranslation.objects
        .filter(status="published", lang=lang)
        .only("id", "lang", "title", "short_description", "content", "status")
    )


def active_lessons(lang="en"):
    """
    Trả về queryset các lessons có ít nhất 1 translation published
    Prefetch translations để tối ưu query
    """
    return (
        Lesson.objects
        .filter(translations__status="published", translations__lang=lang)
        .distinct()
        .prefetch_related(
            Prefetch("translations", queryset=get_published_translations(lang))
        )
        .order_by("order")
    )
