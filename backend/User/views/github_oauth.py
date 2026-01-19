import os
import requests
from urllib.parse import urlencode

from django.shortcuts import redirect
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from Common.models import User


@api_view(["GET"])
@permission_classes([AllowAny])
def github_login(request):
    client_id = os.getenv("GITHUB_CLIENT_ID")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # bạn có thể thêm state nếu muốn chống CSRF (nâng cao)
    params = {
        "client_id": client_id,
        "redirect_uri": request.build_absolute_uri("/api/user/oauth/github/callback/"),
        "scope": "read:user user:email",
    }

    url = "https://github.com/login/oauth/authorize?" + urlencode(params)
    return redirect(url)


@api_view(["GET"])
@permission_classes([AllowAny])
def github_callback(request):
    code = request.query_params.get("code")
    if not code:
        return Response({"success": False, "error": "Missing code"}, status=400)

    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # 1) exchange code -> access_token
    token_res = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
        },
        timeout=20,
    ).json()

    access_token = token_res.get("access_token")
    if not access_token:
        return Response({"success": False, "error": "Cannot get github access_token"}, status=401)

    # 2) get github user profile
    gh_user = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        timeout=20,
    ).json()

    github_id = gh_user.get("id")
    username = gh_user.get("login")
    if not github_id or not username:
        return Response({"success": False, "error": "Cannot read github user"}, status=401)

    # 3) get primary email (có thể null nếu user giấu email)
    gh_emails = requests.get(
        "https://api.github.com/user/emails",
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        timeout=20,
    ).json()

    primary_email = None
    if isinstance(gh_emails, list):
        for e in gh_emails:
            if e.get("primary") and e.get("verified"):
                primary_email = e.get("email")
                break
        if not primary_email and len(gh_emails) > 0:
            primary_email = gh_emails[0].get("email")

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
            password="",
            is_verified=True,  
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

    res = redirect(f"{frontend_url}/oauth/callback")  # FE route để hoàn tất
    res.set_cookie("access_token", access_jwt, httponly=True, secure=False, samesite="Lax", path="/")
    res.set_cookie("refresh_token", refresh_jwt, httponly=True, secure=False, samesite="Lax", path="/")

    return res


@api_view(["GET"])
def me(request):
    # dùng CookieJWTAuthentication -> request.user đã có
    u = request.user
    return Response({
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "role": getattr(u, "role", None),
        "is_verified": getattr(u, "is_verified", True),
    })
