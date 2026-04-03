from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Class, ClassEnrollment, Assignment, Submission
from .serializers import (
    ClassTeacherSerializer,
    ClassStudentSerializer,
    ClassEnrollmentSerializer,
    AssignmentSerializer,
    SubmissionSerializer,
    JoinClassSerializer,
    StudentInfoSerializer,
)
from .permissions import IsTeacherRole, IsStudentRole


class TeacherClassListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherRole]

    def get(self, request):
        classes = Class.objects.filter(teacher=request.user).order_by("-id")
        serializer = ClassTeacherSerializer(classes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ClassTeacherSerializer(data=request.data)
        if serializer.is_valid():
            obj = serializer.save(teacher=request.user)
            return Response(ClassTeacherSerializer(obj).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentJoinClassView(APIView):
    permission_classes = [IsAuthenticated, IsStudentRole]

    def post(self, request):
        serializer = JoinClassSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        join_code = serializer.validated_data["join_code"]
        try:
            class_obj = Class.objects.get(join_code=join_code, is_active=True)
        except Class.DoesNotExist:
            return Response(
                {"detail": "Invalid join code"},
                status=status.HTTP_404_NOT_FOUND,
            )

        enrollment, created = ClassEnrollment.objects.get_or_create(
            class_id=class_obj,
            student=request.user,
        )

        data = ClassEnrollmentSerializer(enrollment).data
        return Response(
            data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class StudentMyClassesView(APIView):
    permission_classes = [IsAuthenticated, IsStudentRole]

    def get(self, request):
        classes = Class.objects.filter(enrollments__student=request.user).order_by("-id")
        serializer = ClassStudentSerializer(classes, many=True)
        return Response(serializer.data)


class ClassAssignmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, class_id):
        role = getattr(request.user, "role", None)
        if role == "teacher":
            try:
                Class.objects.get(id=class_id, teacher=request.user)
            except Class.DoesNotExist:
                return Response({"detail": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
        elif role == "student":
            is_enrolled = ClassEnrollment.objects.filter(
                class_id_id=class_id,
                student=request.user,
            ).exists()
            if not is_enrolled:
                return Response({"detail": "Not enrolled in this class"}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        assignments = Assignment.objects.filter(class_id_id=class_id).order_by("-id")
        serializer = AssignmentSerializer(assignments, many=True)
        data = serializer.data

        if role == "student":
            submitted_ids = set(
                Submission.objects.filter(
                    assignment_id__in=assignments,
                    student=request.user,
                ).values_list("assignment_id", flat=True)
            )
            for item in data:
                item["has_submitted"] = item.get("id") in submitted_ids

        return Response(data)

    def post(self, request, class_id):
        if getattr(request.user, "role", None) != "teacher":
            return Response({"detail": "Teacher access required"}, status=status.HTTP_403_FORBIDDEN)

        try:
            class_obj = Class.objects.get(id=class_id, teacher=request.user)
        except Class.DoesNotExist:
            return Response({"detail": "Class not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AssignmentSerializer(data=request.data)
        if serializer.is_valid():
            obj = serializer.save(class_id=class_obj)
            return Response(AssignmentSerializer(obj).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TeacherAssignmentSubmissionsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherRole]

    def get(self, request, assignment_id):
        try:
            assignment = Assignment.objects.select_related("class_id").get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        if assignment.class_id.teacher_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        submissions = Submission.objects.filter(assignment_id=assignment).order_by("-submitted_at")
        serializer = SubmissionSerializer(submissions, many=True)
        return Response(serializer.data)


class TeacherClassStudentsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherRole]

    def get(self, request, class_id):
        try:
            class_obj = Class.objects.get(id=class_id, teacher=request.user)
        except Class.DoesNotExist:
            return Response({"detail": "Class not found"}, status=status.HTTP_404_NOT_FOUND)

        students = [enrollment.student for enrollment in class_obj.enrollments.select_related("student")]
        serializer = StudentInfoSerializer(students, many=True)
        return Response(serializer.data)


class TeacherAssignmentDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherRole]

    def get(self, request, assignment_id):
        try:
            assignment = Assignment.objects.select_related("class_id").get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        if assignment.class_id.teacher_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = AssignmentSerializer(assignment)
        return Response(serializer.data)

    def patch(self, request, assignment_id):
        try:
            assignment = Assignment.objects.select_related("class_id").get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        if assignment.class_id.teacher_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = AssignmentSerializer(assignment, data=request.data, partial=True)
        if serializer.is_valid():
            obj = serializer.save()
            return Response(AssignmentSerializer(obj).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, assignment_id):
        try:
            assignment = Assignment.objects.select_related("class_id").get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        if assignment.class_id.teacher_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        assignment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentAssignmentSubmitView(APIView):
    permission_classes = [IsAuthenticated, IsStudentRole]

    def post(self, request, assignment_id):
        try:
            assignment = Assignment.objects.select_related("class_id").get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        is_enrolled = ClassEnrollment.objects.filter(
            class_id=assignment.class_id,
            student=request.user,
        ).exists()
        if not is_enrolled:
            return Response({"detail": "Not enrolled in this class"}, status=status.HTTP_403_FORBIDDEN)

        if Submission.objects.filter(assignment_id=assignment, student=request.user).exists():
            return Response({"detail": "Already submitted"}, status=status.HTTP_400_BAD_REQUEST)

        if assignment.deadline and timezone.now() > assignment.deadline:
            return Response({"detail": "Deadline passed"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubmissionSerializer(data=request.data)
        if serializer.is_valid():
            obj = serializer.save(
                assignment_id=assignment,
                student=request.user,
            )
            return Response(SubmissionSerializer(obj).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentAssignmentMySubmissionView(APIView):
    permission_classes = [IsAuthenticated, IsStudentRole]

    def get(self, request, assignment_id):
        try:
            assignment = Assignment.objects.select_related("class_id").get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        is_enrolled = ClassEnrollment.objects.filter(
            class_id=assignment.class_id,
            student=request.user,
        ).exists()
        if not is_enrolled:
            return Response({"detail": "Not enrolled in this class"}, status=status.HTTP_403_FORBIDDEN)

        try:
            submission = (
                Submission.objects.filter(
                    assignment_id=assignment,
                    student=request.user,
                )
                .order_by("-submitted_at")
                .first()
            )
        except Submission.DoesNotExist:
            submission = None

        if submission is None:
            return Response({"detail": "Submission not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = SubmissionSerializer(submission)
        return Response(serializer.data)
