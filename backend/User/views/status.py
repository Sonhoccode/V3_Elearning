from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated,AllowAny

@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    res = Response({'success': True})

    res.delete_cookie('access_token', path='/', samesite='None')
    res.delete_cookie('refresh_token', path='/', samesite='None')

    return res

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def is_authenticated(request):
    user = request.user

    return Response({
        'authenticated': True,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': getattr(user, 'role', None),
        }
    })
