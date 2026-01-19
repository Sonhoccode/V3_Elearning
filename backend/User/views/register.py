from Common.models import User, Verification
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
import random

from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):

    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    role = 'student'

    if not username or not email or not password:
        return Response(
            {'registered': False, 'error': 'Thiếu dữ liệu'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'registered': False, 'error': 'Username đã tồn tại'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {'registered': False, 'error': 'Email đã tồn tại'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role  
    )

    # ===== Create OTP =====
    otp_code = str(random.randint(100000, 999999))
    start_time = timezone.now()
    end_time = start_time + timedelta(minutes=5)

    Verification.objects.create(
        us=user,
        vc_otp=otp_code,
        vc_start=start_time,
        vc_end=end_time,
        vc_status=False
    )

    # ===== Send email =====
    try:
        send_mail(
            subject="Mã OTP xác thực tài khoản",
            message=(
                f"Xin chào {username},\n\n"
                f"Mã OTP của bạn là: {otp_code}\n"
                f"Mã có hiệu lực trong 5 phút."
            ),
            from_email="hoang7620345@gmail.com",
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as email_error:
        return Response({
            "message": "Đăng ký thành công nhưng gửi OTP thất bại",
            "user_id": user.id,
            "error": str(email_error)
        }, status=status.HTTP_201_CREATED)

    return Response({
        "message": "Đăng ký thành công! Vui lòng kiểm tra email để nhận mã OTP.",
        "user_id": user.id
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_teacher(request):

    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not email or not password:
        return Response(
            {'registered': False, 'error': 'Thiếu dữ liệu'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'registered': False, 'error': 'Username đã tồn tại'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {'registered': False, 'error': 'Email đã tồn tại'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role='teacher'  # 🔒 CỐ ĐỊNH
    )

    return Response({
        "message": "Đăng ký giáo viên thành công, chờ admin duyệt",
        "user_id": user.id
    }, status=status.HTTP_201_CREATED)
