import os
import requests
from urllib.parse import urlencode

from django.shortcuts import redirect
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from apps.Common.models import User


@api_view(["GET"])
@permission_classes([AllowAny])
def google_login(request):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    frontend_url = os.getenv("FRONTEND_URL") or request.headers.get("Origin", "")
    backend_url = os.getenv("BACKEND_URL") or request.build_absolute_uri("/").rstrip("/")
    redirect_uri = f"{backend_url}/api/user/oauth/google/callback/"

    if not client_id:
        return Response({"success": False, "error": "Missing GOOGLE_CLIENT_ID"}, status=500)

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }

    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return redirect(url)


@api_view(["GET"])
@permission_classes([AllowAny])
def google_callback(request):
    code = request.query_params.get("code")
    if not code:
        return Response({"success": False, "error": "Missing code"}, status=400)

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    frontend_url = os.getenv("FRONTEND_URL") or request.headers.get("Origin", "")
    backend_url = os.getenv("BACKEND_URL") or request.build_absolute_uri("/").rstrip("/")
    redirect_uri = f"{backend_url}/api/user/oauth/google/callback/"

    if not client_id or not client_secret:
        return Response({"success": False, "error": "Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET"}, status=500)

    # 1) exchange code -> access_token
    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        headers={"Accept": "application/json"},
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=20,
    ).json()

    access_token = token_res.get("access_token")
    if not access_token:
        return Response(
            {"success": False, "error": "Cannot get google access_token", "details": token_res},
            status=401
        )

    # 2) get google user profile
    gh_user = requests.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        timeout=20,
    ).json()

    # Google OIDC userinfo trả về "sub" (user id), không phải "id"
    google_id = gh_user.get("sub") or gh_user.get("id")
    email = gh_user.get("email")
    username = email or (f"google_{google_id}" if google_id else None)
    if not google_id or not username:
        return Response(
            {"success": False, "error": "Cannot read google user", "details": gh_user},
            status=401
        )

    # 3) lấy email (google userinfo đã có email)
    primary_email = email

    # 4) create/update user trong DB (ORM, không serializer)
    # bạn có thể chọn unique theo username hoặc email.
    # khuyến nghị: nếu email có thì ưu tiên email, không thì dùng username.
    if primary_email:
        user = User.objects.filter(email=primary_email).first()
    else:
        user = User.objects.filter(username=username).first()

    if not user:
        # role mặc định student
        user = User.objects.create(
            username=username,
            email=primary_email or "",
            role="student",
            password="",  # github login không dùng password nội bộ
        )
    else:
        # update username/email nếu thiếu
        if not user.username:
            user.username = username
        if primary_email and not user.email:
            user.email = primary_email
        user.save()

    # 5) issue JWT + set cookies
    refresh = RefreshToken.for_user(user)
    access_jwt = str(refresh.access_token)
    refresh_jwt = str(refresh)

    callback_base = frontend_url.rstrip("/")
    callback_url = f"{callback_base}/oauth/callback" if callback_base else "/oauth/callback"
    res = redirect(callback_url)  # FE route để hoàn tất
    res.set_cookie(
        "access_token",
        access_jwt,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/",
    )
    res.set_cookie(
        "refresh_token",
        refresh_jwt,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/",
    )

    return res
