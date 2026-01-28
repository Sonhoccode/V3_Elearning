from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Quiz
from .serializers import QuizSerializer

class QuizListView(generics.ListAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [AllowAny]

class QuizDetailView(generics.RetrieveAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    lookup_field = 'id'
    permission_classes = [AllowAny]
