# courses/models.py
from django.db import models
from django.conf import settings

# choices cho trạng thái bài học
STATUS_CHOICES = (
    ("draft", "Draft"),
    ("published", "Published"),
)

# phân loại lesson: nhóm (group) hoặc bài học (lesson)
LESSON_KIND_CHOICES = (
    ("group", "Group"),
    ("lesson", "Lesson"),
)

# danh mục khoá học
class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order"]
        db_table = "categories"

    def __str__(self):
        return self.name

# khoá học
class Course(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="courses"
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = "courses"
    
# bài học
class Lesson(models.Model):
    KIND_CHOICES = (
        ("group", "Group"),
        ("lesson", "Lesson"),
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="lessons"
    )

    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="children"
    )

    slug = models.SlugField()
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default="lesson")
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("course", "slug")
        ordering = ["order"]
        db_table = "lessons"

    def __str__(self):
        return self.slug


# nội dung bài học đa ngôn ngữ
class LessonTranslation(models.Model):
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="translations"
    )

    lang = models.CharField(max_length=10)  # vi, en,...
    title = models.CharField(max_length=255)
    short_description = models.TextField(blank=True)
    content = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("lesson", "lang")
        db_table = "lesson_translations"

    def __str__(self):
        return f"{self.lesson.slug} [{self.lang}]"


class LessonProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lesson_progress",
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="progress_records",
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "lesson")
        db_table = "lesson_progress"

    def __str__(self):
        return f"{self.user_id} -> {self.lesson_id}"
