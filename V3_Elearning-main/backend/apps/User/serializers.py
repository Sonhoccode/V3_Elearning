from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.Common.models import User


class GmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        email = (attrs.get("email") or "").strip().lower()
        password = attrs.get("password")

        if not email or not password:
            raise AuthenticationFailed("No active account found", code="no_active_account")

        if not email.endswith("@gmail.com"):
            raise AuthenticationFailed("Email must be a Gmail address", code="authorization")

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise AuthenticationFailed("No active account found", code="no_active_account")

        self.user = authenticate(
            request=self.context.get("request"),
            username=user.username,
            password=password,
        )

        if self.user is None:
            raise AuthenticationFailed("No active account found", code="no_active_account")

        refresh = self.get_token(self.user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
