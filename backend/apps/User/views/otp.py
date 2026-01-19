from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from apps.Common.models import User, Verification
from django.utils import timezone

@api_view(['POST'])
@permission_classes([AllowAny])
def VerifyOTP(request):
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        otp = request.data.get('otp')

        if (not username and not email) or not otp:
            return Response({"error": "Thiếu username/email hoặc otp"}, status=status.HTTP_400_BAD_REQUEST)

        if email:
            user = User.objects.filter(email__iexact=email).first()
            if not user:
                return Response({"error": "Người dùng không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        else:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return Response({"error": "Người dùng không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        
        verification = Verification.objects.filter(
            us=user, 
            vc_otp=otp, 
            
            ).order_by('-vc_start').first()
        
        if not verification:
            return Response({"error": "OTP không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)
        if verification.vc_status:
            return Response({"error": "OTP đã được sử dụng"}, status=status.HTTP_400_BAD_REQUEST)
        if timezone.now() > verification.vc_end:
            return Response({"error": "OTP đã hết hạn"}, status=status.HTTP_400_BAD_REQUEST)
        
        verification.vc_status = True
        verification.save()

        if hasattr(user, 'is_verified'):
            user.is_verified = True
            user.save()

        return Response({"message": "Xác thực OTP thành công"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
