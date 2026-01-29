from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework.exceptions import AuthenticationFailed

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        access_token = request.COOKIES.get('access_token')

        # 1️⃣ Không có cookie → bỏ qua (cho phép auth khác chạy)
        if not access_token:
            return None

        try:
            # 2️⃣ Validate token
            validated_token = self.get_validated_token(access_token)

            # 3️⃣ Lấy user từ token
            user = self.get_user(validated_token)

        except InvalidToken:
            # 🔥 Token sai / hết hạn → 401 rõ ràng
            raise AuthenticationFailed('Invalid or expired token')

        except Exception:
            raise AuthenticationFailed('Authentication error')

        # 4️⃣ Thành công
        return (user, validated_token)
