# backend/core/urls.py
from django.urls import path, include
from django.conf import settings
from django.views.generic.base import RedirectView

urlpatterns = [
    path('favicon.ico', RedirectView.as_view(url=settings.STATIC_URL + 'logo_icon.png')),
    path("api/v1/", include("apps.courses.urls")),
    path('api/user/', include('apps.User.urls')),
]
