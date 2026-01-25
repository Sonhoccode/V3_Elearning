from django.urls import path
from .views import auth, register, status, admin, github_oauth, get, otp

urlpatterns = [
    path('token/', auth.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', auth.CustomRefreshTokenView.as_view(), name='token_refresh'),
    path('logout/', status.logout),
    path('authenticated/', status.is_authenticated),
    path('register/', register.register),
    path('register-teacher/', register.register_teacher),
    path('verify_otp/', otp.VerifyOTP, name='otp'),
    path('get/<str:id>/',get.get_user),
    path('update/<str:id>/',get.update_user),
    path('admin/teachers/pending/',admin.pending_teachers),
    path('admin/teachers/approve/<int:user_id>/', admin.approve_teacher),
    path("oauth/github/login/", github_oauth.github_login),
    path("oauth/github/callback/", github_oauth.github_callback),
    path("me/", github_oauth.me),
]