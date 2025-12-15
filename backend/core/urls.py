from django.urls import path, include

urlpatterns = [
    path("api/health/", include("apps.health.urls")),
]
