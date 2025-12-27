# apps/courses/cache_utils.py
from django.core.cache import cache
from django_redis.exceptions import ConnectionInterrupted
from redis.exceptions import ConnectionError as RedisConnectionError
from rest_framework.response import Response

MENU_VERSION_KEY = "menu:version"
DEFAULT_MENU_VERSION = 1
MENU_CACHE_TTL = 60000 * 1000000

# lay ngon ngu tu request
def get_lang(request):
    lang = request.query_params.get("lang")
    if lang:
        return lang.lower()
    accept = request.headers.get("Accept-Language", "")
    return (accept[:2] or "vi").lower()

# xac dinh doi tuong nguoi dung
def get_audience(request):
    u = getattr(request, "user", None)
    if u and u.is_authenticated and (u.is_staff or u.is_superuser):
        return "admin"
    return "public"

# lay phien ban menu hien tai
def get_menu_version():
    v = cache.get(MENU_VERSION_KEY)
    if v is None:
        cache.set(MENU_VERSION_KEY, DEFAULT_MENU_VERSION, None)
        return DEFAULT_MENU_VERSION
    return int(v)

# tang phien ban menu de lam moi cache
def bump_menu_version():
    try:
        cache.incr(MENU_VERSION_KEY)
    except Exception:
        v = get_menu_version()
        cache.set(MENU_VERSION_KEY, v + 1, None)

# tao khoa cache cho menu
def build_menu_cache_key(resource, request):
    v = get_menu_version()
    lang = get_lang(request)
    aud = get_audience(request)
    return f"menu:{resource}:v={v}:lang={lang}"

# lay danh sach tu cache neu co
def cached_list(view, request, *, resource, ttl=MENU_CACHE_TTL):
    key = build_menu_cache_key(resource, request)

    try:
        cached_data = cache.get(key)
        if cached_data is not None:
            return Response(cached_data)
    except (ConnectionInterrupted, RedisConnectionError):
        pass

    qs = view.filter_queryset(view.get_queryset())
    serializer = view.get_serializer(qs, many=True)
    data = serializer.data

    try:
        cache.set(key, data, timeout=ttl)
    except (ConnectionInterrupted, RedisConnectionError):
        pass

    return Response(data)
