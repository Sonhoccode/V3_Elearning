from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    # dùng CookieJWTAuthentication -> request.user đã có
    u = request.user
    return Response({
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "role": getattr(u, "role", None),
    })

@csrf_exempt
@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_me(request):
    user = request.user
    data = request.data

    # Cho phép update các field này
    if "username" in data:
        user.username = data["username"]

    if "email" in data:
        user.email = data["email"]

    # nếu có role thì chỉ cho admin sửa
    if "role" in data:
        if getattr(user, "role", None) == "admin":
            user.role = data["role"]
        else:
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

    user.save()

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": getattr(user, "role", None),
        "message": "Profile updated successfully"
    })

