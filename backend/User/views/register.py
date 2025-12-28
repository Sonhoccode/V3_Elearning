from Common.models import User
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):

    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get('role', 'student')  # 🔥 LẤY ROLE

    # chỉ cho phép 2 role khi đăng ký
    ALLOWED_ROLES = ['student', 'teacher']

    if not username or not email or not password:
        return Response(
            {'registered': False, 'error': 'Thiếu dữ liệu'},
            status=400
        )

    if role not in ALLOWED_ROLES:
        role = 'student'   # fallback an toàn

    if User.objects.filter(username=username).exists():
        return Response(
            {'registered': False, 'error': 'Username đã tồn tại'},
            status=400
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {'registered': False, 'error': 'Email đã tồn tại'},
            status=400
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role          # 🔥 LƯU ROLE
    )

    return Response({
        'registered': True,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
        }
    }, status=201)
