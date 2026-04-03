from django.urls import path
from .views import (
    TeacherClassListCreateView,
    StudentJoinClassView,
    StudentMyClassesView,
    ClassAssignmentsView,
    TeacherAssignmentSubmissionsView,
    TeacherClassStudentsView,
    TeacherAssignmentDeleteView,
    StudentAssignmentSubmitView,
    StudentAssignmentMySubmissionView,
)

urlpatterns = [
    path("classes/", TeacherClassListCreateView.as_view(), name="class-list-create"),
    path("classes/join/", StudentJoinClassView.as_view(), name="class-join"),
    path("classes/my-classes/", StudentMyClassesView.as_view(), name="class-my-classes"),
    path("classes/<int:class_id>/assignments/", ClassAssignmentsView.as_view(), name="class-assignments"),
    path("classes/<int:class_id>/students/", TeacherClassStudentsView.as_view(), name="class-students"),
    path("assignments/<int:assignment_id>/submissions/", TeacherAssignmentSubmissionsView.as_view(), name="assignment-submissions"),
    path("assignments/<int:assignment_id>/", TeacherAssignmentDeleteView.as_view(), name="assignment-delete"),
    path("assignments/<int:assignment_id>/submit/", StudentAssignmentSubmitView.as_view(), name="assignment-submit"),
    path("assignments/<int:assignment_id>/my-submission/", StudentAssignmentMySubmissionView.as_view(), name="assignment-my-submission"),
]
