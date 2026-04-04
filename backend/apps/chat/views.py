import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Conversation, Message
from .serializers import ChatSerializer
from apps.ai.agent_service import run_agent
from .memory_store import add_message, get_history, search_memory
from apps.courses.models import Lesson, LessonProgress, Course
from django.db.models import Count, Q


def build_progress_summary(user):
    total_lessons = Lesson.objects.filter(is_active=True, kind="lesson").count()
    completed_lessons = LessonProgress.objects.filter(
        user=user, lesson__is_active=True, lesson__kind="lesson"
    ).count()
    completion_rate = (
        round((completed_lessons / total_lessons) * 100, 1)
        if total_lessons
        else 0
    )

    course_stats = (
        Course.objects.filter(is_active=True)
        .annotate(
            total_lessons=Count(
                "lessons",
                filter=Q(lessons__is_active=True, lessons__kind="lesson"),
                distinct=True,
            ),
            completed_lessons=Count(
                "lessons__progress_records",
                filter=Q(
                    lessons__progress_records__user=user,
                    lessons__is_active=True,
                    lessons__kind="lesson",
                ),
                distinct=True,
            ),
        )
        .filter(total_lessons__gt=0)
        .order_by("-completed_lessons", "-total_lessons")
    )

    top_courses = []
    for course in course_stats[:3]:
        percent = (
            round((course.completed_lessons / course.total_lessons) * 100, 1)
            if course.total_lessons
            else 0
        )
        top_courses.append(
            f"- {course.title}: {course.completed_lessons}/{course.total_lessons} ({percent}%)"
        )

    summary_lines = [
        f"Tổng bài đã học: {completed_lessons}/{total_lessons} ({completion_rate}%)."
    ]
    if top_courses:
        summary_lines.append("Tiến độ theo khóa học (top 3):")
        summary_lines.extend(top_courses)

    return "\n".join(summary_lines)


def is_assessment_intent(message: str) -> bool:
    if not message:
        return False
    text = message.lower()
    keywords = [
        "bài test",
        "lam bai test",
        "làm bài test",
        "test năng lực",
        "đánh giá năng lực",
        "kiem tra nang luc",
        "kiểm tra năng lực",
        "assessment",
    ]
    return any(keyword in text for keyword in keywords)


class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Không trả về lịch sử chat cho client
        conversation = (
            Conversation.objects.filter(user=request.user)
            .order_by("-created_at")
            .first()
        )
        conversation_id = str(conversation.id) if conversation else None

        return Response(
            {"conversation_id": conversation_id, "messages": []},
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = ChatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        conversation_id = serializer.validated_data.get("conversation_id")
        user_message = serializer.validated_data["message"]
        session_id = serializer.validated_data.get("session_id") or f"user-{request.user.id}"

        # 1️⃣ Create or get conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, user=request.user)
            except Conversation.DoesNotExist:
                return Response({"detail": "Conversation không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        else:
            conversation = (
                Conversation.objects.filter(user=request.user)
                .order_by("-created_at")
                .first()
            )
            if not conversation:
                conversation = Conversation.objects.create(user=request.user)

        # 2️⃣ Vector memory search (per user + session)
        memory_hits = []
        history = []
        try:
            memory_hits = search_memory(request.user.id, session_id, user_message, k=5)
            add_message(request.user.id, session_id, "user", user_message)
            history = get_history(request.user.id, session_id)
        except Exception:
            history = [{"role": "user", "content": user_message}]

        # 3.5️⃣ Load User Profile
        user_test_result = getattr(request.user, 'test_result', None)
        if user_test_result:
            user_profile = f"Trình độ (Level): {user_test_result.level}\nĐiểm mạnh: {user_test_result.strengths}\nĐiểm yếu cần cải thiện: {user_test_result.weaknesses}\nĐịnh hướng gợi ý: {user_test_result.recommended_paths}"
        else:
            user_profile = "Học viên chưa làm bài test đánh giá năng lực."

        progress_summary = build_progress_summary(request.user)
        user_profile = f"{user_profile}\n\nTiến độ học tập:\n{progress_summary}"

        if memory_hits:
            memory_context = "\n".join(
                [f"- ({hit['role']}) {hit['content']}" for hit in memory_hits]
            )
            user_profile = f"{user_profile}\n\nGhi nhớ hội thoại liên quan:\n{memory_context}"

        # 4️⃣ Shortcut: assessment link
        if is_assessment_intent(user_message):
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
            assistant_reply = (
                f"Bạn có thể làm bài test tại đây: {frontend_url}/assessment"
            )
        else:
            # 4️⃣ Call Agent
            assistant_reply = run_agent(history, user_profile)

        # 5️⃣ Save assistant message to vector DB
        try:
            add_message(request.user.id, session_id, "assistant", assistant_reply)
        except Exception:
            pass

        return Response(
            {
                "conversation_id": str(conversation.id),
                "reply": assistant_reply,
            },
            status=status.HTTP_200_OK,
        )
