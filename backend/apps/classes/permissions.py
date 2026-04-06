from rest_framework.permissions import BasePermission


class IsTeacherRole(BasePermission):
    message = "Teacher access required."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == "teacher"
        )


class IsStudentRole(BasePermission):
    message = "Student access required."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == "student"
        )
