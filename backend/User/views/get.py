from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Common.models import User

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request, id ):
    try:
        user = User.objects.get(id = id)

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }, status = status.HTTP_200_OK)
    
    except User.DoesNotExist:
        return Response({"error": "User khong toon tai"}, status = status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status = status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user(request, id):
    try:
        user = User.objects.get(id = id)

        data = request.data
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        user.role = data.get('role', user.role)
        user.save()

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }, status = status.HTTP_200_OK)
    
    except User.DoesNotExist:
        return Response({"error": "User khong toon tai"}, status = status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status = status.HTTP_500_INTERNAL_SERVER_ERROR)