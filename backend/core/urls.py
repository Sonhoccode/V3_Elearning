# backend/core/urls.py
from django.urls import path, include

urlpatterns = [
    path("api/v1/", include("apps.health.urls")),
    path("api/v1/", include("apps.courses.urls")),
]
