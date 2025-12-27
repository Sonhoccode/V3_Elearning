# apps/courses/serializers.py
from rest_framework import serializers
from .models import Category, Course


class CoursesItem(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title", "slug", "description", "order"]


class CategoryItem(serializers.ModelSerializer):
    courses = CoursesItem(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "order", "courses"]
