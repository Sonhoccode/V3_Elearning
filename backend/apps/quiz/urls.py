from django.urls import path
from .views import QuizListView, QuizDetailView

urlpatterns = [
    path('', QuizListView.as_view(), name='quiz-list'),
    path('<int:id>/', QuizDetailView.as_view(), name='quiz-detail'),
]
