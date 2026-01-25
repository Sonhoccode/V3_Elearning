from Common.models import User
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        # ❗ LOGIN FAIL → TRẢ THẲNG, KHÔNG XỬ LÝ TIẾP
        if response.status_code != 200:
            return response

        tokens = response.data

        try:
            access = AccessToken(tokens["access"])
            refresh_token = tokens["refresh"]

            user_id = access["user_id"]
            user = User.objects.get(id=user_id)

            # 🔐 CHẶN CHƯA VERIFY OTP
            if not user.is_verified:
                return Response(
                    {
                        "success": False,
                        "error": "Tài khoản chưa xác thực OTP"
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            # 🔐 CHẶN TEACHER CHƯA DUYỆT
            if user.role == "teacher" and not user.is_approved:
                return Response(
                    {
                        "success": False,
                        "error": "Tài khoản giáo viên đang chờ admin duyệt"
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            # 🔥 GẮN CLAIM
            access["role"] = user.role
            access["username"] = user.username
            access_token = str(access)

            res = Response({
                "success": True,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "is_verified": user.is_verified,
                }
            })

            res.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,
                samesite="Lax",
                path="/"
            )

            res.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,
                samesite="Lax",
                path="/"
            )

            return res

        except User.DoesNotExist:
            return Response(
                {"success": False, "error": "User not found"},
                status=status.HTTP_401_UNAUTHORIZED
            )


class CustomRefreshTokenView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response(
                {'refreshed': False, 'error': 'No refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            # gán refresh token cho SimpleJWT xử lý
            request.data['refresh'] = refresh_token
            response = super().post(request, *args, **kwargs)

            # ====== LẤY USER ======
            refresh = RefreshToken(refresh_token)
            user_id = refresh['user_id']
            user = User.objects.get(id=user_id)

            # ====== ACCESS TOKEN + ROLE ======
            access = AccessToken(response.data['access'])
            access['role'] = user.role
            access['username'] = user.username

            access_token = str(access)

            res = Response({
                'refreshed': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': getattr(user, 'role', None)
                }
            })

            res.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=False,
                samesite='Lax',
                path='/'
            )

            return res

        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            return Response(
                {'refreshed': False, 'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
        