from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.User.models import TestResult
from apps.User.serializers import TestResultSerializer


class TestResultView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            result = TestResult.objects.get(user=request.user)
            serializer = TestResultSerializer(result)
            return Response(serializer.data)
        except TestResult.DoesNotExist:
            return Response({"detail": "Chưa có kết quả test"}, status=status.HTTP_200_OK)

    def post(self, request):
        score = float(request.data.get("score", 0))

        if score < 40:
            level = "Người mới bắt đầu (Beginner)"
            strengths = "Mới bắt đầu làm quen với kiến thức nền tảng"
            weaknesses = "Chưa có kinh nghiệm thực chiến và kiến thức chuyên sâu"
            recommended_paths = "Gợi ý củng cố lý thuyết nền tảng, bài tập cơ bản."
        elif score <= 80:
            level = "Lập trình viên Trung bình (Intermediate)"
            strengths = "Đã có kiến thức nền khá vững"
            weaknesses = "Đôi lúc thiết kế hệ thống chưa tối ưu"
            recommended_paths = "Gợi ý làm bài tập nâng cao, dự án thực tế nhỏ."
        else:
            level = "Chuyên gia (Advanced)"
            strengths = "Sở hữu kiến thức toàn diện và tư duy tốt"
            weaknesses = "Có thể còn thiếu kỹ năng thiết kế System Architecture phức tạp"
            recommended_paths = "Gợi ý học sâu về Architecture, Pattern, và Scaling system."

        data_to_save = {
            "score": score,
            "level": level,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommended_paths": recommended_paths,
        }

        result, _created = TestResult.objects.get_or_create(user=request.user)
        serializer = TestResultSerializer(result, data=data_to_save, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
