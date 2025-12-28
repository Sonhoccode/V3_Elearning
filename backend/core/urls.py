from django.urls import path, include


urlpatterns = [
    path("api/health/", include("apps.health.urls")),
    path('api/user/', include('User.urls')),
]
