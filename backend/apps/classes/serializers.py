from rest_framework import serializers
from .models import Class, ClassEnrollment, Assignment, Submission
from apps.Common.models import User


class ClassTeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ["id", "name", "teacher", "join_code", "is_active"]
        read_only_fields = ["id", "teacher", "join_code"]


class ClassStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ["id", "name", "teacher", "is_active"]
        read_only_fields = ["id", "teacher", "is_active"]


class ClassEnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassEnrollment
        fields = ["id", "class_id", "student", "joined_at"]
        read_only_fields = ["id", "student", "joined_at"]


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ["id", "class_id", "title", "type", "content", "deadline"]
        read_only_fields = ["id", "class_id"]


class StudentInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class SubmissionSerializer(serializers.ModelSerializer):
    student_info = StudentInfoSerializer(source="student", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "assignment_id",
            "student",
            "student_info",
            "submitted_content",
            "score",
            "ai_feedback",
            "submitted_at",
        ]
        read_only_fields = ["id", "assignment_id", "student", "score", "ai_feedback", "submitted_at"]


class JoinClassSerializer(serializers.Serializer):
    join_code = serializers.CharField(max_length=8)
