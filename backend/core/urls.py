from django.urls import path, include
from django.contrib import admin


urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/health/", include("apps.health.urls")),
    path('api/user/', include('User.urls')),
    path('api/quiz/', include('Quiz.urls')),
]
