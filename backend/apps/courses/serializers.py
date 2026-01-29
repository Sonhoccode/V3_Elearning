# apps/courses/serializers.py
from rest_framework import serializers
from .models import Category, Course, Lesson, LessonTranslation

class CoursesItem(serializers.ModelSerializer):
    # Serializer cho hiển thị khóa học cơ bản
    class Meta:
        model = Course
        fields = ["id", "title", "slug", "description", "order"]

class AdminCoursesItem(serializers.ModelSerializer):
    # Serializer cho admin - hiển thị khóa học với trạng thái kích hoạt
    class Meta:
        model = Course
        fields = ["id", "title", "slug", "description", "order", "is_active", "category"]

class CategoriesItem(serializers.ModelSerializer):
    # Serializer cho hiển thị danh mục cùng với các khóa học bên trong
    courses = CoursesItem(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "order", "courses"]

class AdminCategoriesItem(serializers.ModelSerializer):
    # Serializer cho admin - hiển thị danh mục với trạng thái kích hoạt
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "order", "is_active"]


class AdminLessonTranslationSerializer(serializers.ModelSerializer):
    # Serializer cho admin - quản lý translations
    class Meta:
        model = LessonTranslation
        fields = ("id", "lang", "title", "short_description", "content", "status")


class AdminLessonDetailSerializer(serializers.ModelSerializer):
    # Serializer cho admin - hiển thị lesson với tất cả translations
    translations = AdminLessonTranslationSerializer(many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = ("id", "course", "parent", "slug", "order", "is_active", "translations")


class AdminLessonWriteSerializer(serializers.ModelSerializer):
    # Serializer cho admin - ghi (tạo/sửa) lesson
    class Meta:
        model = Lesson
        fields = ("id", "course", "parent", "slug", "order", "is_active")


