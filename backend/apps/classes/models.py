import string
import random

from django.conf import settings
from django.db import models


def generate_join_code(length=8):
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choices(alphabet, k=length))
        if not Class.objects.filter(join_code=code).exists():
            return code


class Class(models.Model):
    name = models.CharField(max_length=255)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teaching_classes",
    )
    join_code = models.CharField(max_length=8, unique=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.join_code:
            self.join_code = generate_join_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.teacher_id})"


class ClassEnrollment(models.Model):
    class_id = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="class_enrollments",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("class_id", "student")


class Assignment(models.Model):
    ASSIGNMENT_TYPE_CHOICES = (
        ("QUIZ", "Quiz"),
        ("CODE", "Code"),
    )

    class_id = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=ASSIGNMENT_TYPE_CHOICES)
    content = models.JSONField()
    deadline = models.DateTimeField(null=True, blank=True)


class Submission(models.Model):
    assignment_id = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assignment_submissions",
    )
    submitted_content = models.JSONField()
    score = models.FloatField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
