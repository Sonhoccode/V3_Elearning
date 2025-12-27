# courses/models.py
from django.db import models

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
    

class Content(models.Model):
    KIND_CHOICES = (
        ("group", "Group"),
        ("lesson", "Lesson"),
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="contents"
    )

    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="children"
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField()
    kind = models.CharField(max_length=10, choices=KIND_CHOICES)
    content = models.TextField(null=True, blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("course", "slug")
        ordering = ["order"]
        db_table = "contents"

    def __str__(self):
        return self.title
