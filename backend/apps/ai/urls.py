from django.urls import path
from . import views

urlpatterns = [
    path('ingest/', views.AdminIngestView.as_view(), name='admin-ingest'),
    path('documents/', views.InternalDocumentListCreateView.as_view(), name='internal-documents'),
    path('documents/<uuid:doc_id>/', views.InternalDocumentDetailView.as_view(), name='internal-document-detail'),
    path('quiz/generate/', views.QuizGenerateView.as_view(), name='quiz-generate'),
]
