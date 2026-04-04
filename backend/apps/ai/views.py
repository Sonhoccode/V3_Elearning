import json
import os
import re
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import FileSystemStorage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from .vector_store import ingest_custom_text, ingest_pdf
from .config import DATA_FOLDER_PATH, LLM_MODEL_NAME
from apps.Common.permissions import IsAdminRole

class AdminIngestView(views.APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        input_type = request.data.get("inputType", "text")
        
        try:
            if input_type == "text":
                text = request.data.get("text")
                source_name = request.data.get("source_name", "Admin Input")
                
                if not text:
                    return Response({"error": "Nội dung văn bản bị trống."}, status=status.HTTP_400_BAD_REQUEST)
                    
                ingest_custom_text(text, source_name)
                return Response({"message": "Tài liệu văn bản đã được Vector hóa và lưu thành công!"}, status=status.HTTP_200_OK)
                
            elif input_type == "file":
                file_obj = request.FILES.get("file")
                
                if not file_obj:
                    return Response({"error": "Vui lòng chọn 1 file PDF."}, status=status.HTTP_400_BAD_REQUEST)
                if not file_obj.name.lower().endswith(".pdf"):
                    return Response({"error": "Hệ thống chỉ tạm thời hỗ trợ file định dạng .pdf"}, status=status.HTTP_400_BAD_REQUEST)
                
                # Lưu PDF vào ổ đĩa để PyPDFLoader có thể đọc được
                os.makedirs(DATA_FOLDER_PATH, exist_ok=True)
                fs = FileSystemStorage(location=DATA_FOLDER_PATH)
                
                # Check file trung ten
                if fs.exists(file_obj.name):
                    # Delete the old file locally if it exists to overwrite
                    fs.delete(file_obj.name)
                    
                filename = fs.save(file_obj.name, file_obj)
                file_path = os.path.join(DATA_FOLDER_PATH, filename)
                
                # Chạy quá trình Embedding của File PDF
                ingest_pdf(file_path)
                
                # Bạn có thể uncomment dòng dưới nếu không muốn giữ lại Local File
                # os.remove(file_path)
                
                return Response({"message": f"File '{filename}' đã tải lên và phân tách (chunks) nạp vào DB thành công!"}, status=status.HTTP_200_OK)
            
            else:
                return Response({"error": "Tham số inputType không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuizGenerateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        topic = (request.data.get("topic") or "Lập trình cơ bản").strip()
        level = (request.data.get("level") or "").strip()
        num_questions = int(request.data.get("num_questions") or 10)
        choices_per_question = int(request.data.get("choices_per_question") or 4)

        num_questions = max(1, min(num_questions, 20))
        choices_per_question = max(2, min(choices_per_question, 6))

        user_test_result = getattr(request.user, "test_result", None)
        if not level and user_test_result:
            level = user_test_result.level
        if not level:
            level = "Beginner"

        system_prompt = f"""
Bạn là hệ thống tạo đề kiểm tra năng lực.
Hãy tạo {num_questions} câu trắc nghiệm về chủ đề: "{topic}" phù hợp với trình độ: "{level}".
Mỗi câu có đúng {choices_per_question} đáp án.

Trả về DUY NHẤT 1 JSON hợp lệ theo mẫu:
{{
  "questions": [
    {{
      "id": "q1",
      "title": "Câu hỏi ...",
      "answers": [
        {{ "id": "A", "text": "Đáp án A" }},
        {{ "id": "B", "text": "Đáp án B" }},
        ...
      ],
      "correctAnswerId": "A"
    }}
  ]
}}
Không được thêm giải thích hay ký tự thừa ngoài JSON.
"""

        try:
            llm = ChatGoogleGenerativeAI(
                model=LLM_MODEL_NAME,
                temperature=0.2,
                api_key=os.getenv("GOOGLE_API_KEY"),
            )

            response = llm.invoke(
                [SystemMessage(content=system_prompt), HumanMessage(content="Tạo bộ câu hỏi.")]
            )

            raw = response.content if hasattr(response, "content") else str(response)
            json_text = raw
            try:
                data = json.loads(json_text)
            except json.JSONDecodeError:
                match = re.search(r"\{.*\}", raw, re.S)
                if not match:
                    return Response(
                        {"error": "AI trả về dữ liệu không hợp lệ."},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
                json_text = match.group(0)
                data = json.loads(json_text)

            questions = data.get("questions", [])
            if not isinstance(questions, list) or not questions:
                return Response(
                    {"error": "AI trả về danh sách câu hỏi rỗng."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            normalized = []
            for idx, q in enumerate(questions, start=1):
                answers = q.get("answers") or []
                if not isinstance(answers, list) or not answers:
                    continue
                q_id = q.get("id") or f"q{idx}"
                q_title = (q.get("title") or "").strip()
                if not q_title:
                    q_title = f"Câu hỏi {idx}"
                normalized_answers = []
                for a_idx, ans in enumerate(answers):
                    ans_id = ans.get("id") or chr(65 + a_idx)
                    ans_text = (ans.get("text") or "").strip()
                    if not ans_text:
                        ans_text = f"Đáp án {ans_id}"
                    normalized_answers.append({"id": ans_id, "text": ans_text})
                correct_id = q.get("correctAnswerId") or normalized_answers[0]["id"]
                normalized.append(
                    {
                        "id": q_id,
                        "title": q_title,
                        "answers": normalized_answers[:choices_per_question],
                        "correctAnswerId": correct_id,
                    }
                )

            return Response({"questions": normalized}, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response(
                {"error": f"Không thể tạo quiz: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
