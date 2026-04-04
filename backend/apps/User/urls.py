from django.urls import path
from .views import auth, register, status, admin, github_oauth, google_oauth , otp, get, test_result

urlpatterns = [
    path('token/', auth.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', auth.CustomRefreshTokenView.as_view(), name='token_refresh'),
    path('logout/', status.logout),
    path('authenticated/', status.is_authenticated),
    path('register/', register.register),
    path('verify_otp/', otp.VerifyOTP, name='otp'),
    path('admin/teachers/pending/',admin.pending_teachers),
    path('admin/teachers/approve/<int:user_id>/', admin.approve_teacher),
    path("oauth/github/login/", github_oauth.github_login),
    path("oauth/github/callback/", github_oauth.github_callback),
    path("oauth/google/login/", google_oauth.google_login),
    path("oauth/google/callback/", google_oauth.google_callback),
    path("me/", get.me),
    path("me/update/", get.update_me),
    path("test-result/", test_result.TestResultView.as_view()),
]
