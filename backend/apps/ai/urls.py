from django.urls import path
from . import views

urlpatterns = [
    path('ingest/', views.AdminIngestView.as_view(), name='admin-ingest'),
    path('quiz/generate/', views.QuizGenerateView.as_view(), name='quiz-generate'),
]
