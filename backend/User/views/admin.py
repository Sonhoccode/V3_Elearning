from Common.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_teachers(request):

    # 🔒 chỉ admin
    if request.user.role != 'admin':
        return Response(
            {'error': 'Chỉ admin mới có quyền'},
            status=status.HTTP_403_FORBIDDEN
        )

    teachers = User.objects.filter(
        role='teacher',
        is_approved=False
    )

    data = [
        {
            'id': t.id,
            'username': t.username,
            'email': t.email,
        }
        for t in teachers
    ]

    return Response({'teachers': data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_teacher(request, user_id):

    # 🔒 chỉ admin
    if request.user.role != 'admin':
        return Response(
            {'error': 'Chỉ admin mới có quyền'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        teacher = User.objects.get(
            id=user_id,
            role='teacher'
        )
    except User.DoesNotExist:
        return Response(
            {'error': 'Không tìm thấy teacher'},
            status=status.HTTP_404_NOT_FOUND
        )

    teacher.is_approved = True
    teacher.save()

    return Response({
        'approved': True,
        'teacher': {
            'id': teacher.id,
            'username': teacher.username,
            'email': teacher.email,
        }
    })
