# backend/core/urls.py
from django.urls import path, include
from django.conf import settings
from django.views.generic.base import RedirectView
from django.conf.urls.static import static
from django.http import JsonResponse


def healthcheck(_request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("health/", healthcheck),
    path('favicon.ico', RedirectView.as_view(url=settings.STATIC_URL + 'logo_icon.png')),
    path("api/v1/", include("apps.courses.urls")),
    path('api/user/', include('apps.User.urls')),
    path("api/chat/", include("apps.chat.urls")),
    path("api/ai/", include("apps.ai.urls")),
    path("api/", include("apps.classes.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
