import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

def grade_code_submission(assignment_title: str, assignment_content: str, submitted_code: str) -> dict:
    """
    Sử dụng Gemini để tự động chấm điểm code và đưa ra nhận xét.
    Trả về dict: {"score": number, "feedback": str}
    """
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        return {"score": None, "feedback": "Hệ thống thiếu cấu hình GOOGLE_API_KEY để chấm điểm tự động."}

    try:
        model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=google_api_key,
            temperature=0.2, # Low temperature for consistent grading
            max_retries=0
        )

        prompt_template = """Bạn là một giảng viên chấm bài môn lập trình.
Đề bài (Tên): {title}
Nội dung đề bài:
{content}

Bài nộp của sinh viên:
{submitted_code}

Dựa vào yêu cầu của đề bài, hãy phân tích logic, chạy thử mã ngầm trong đầu và đánh giá bài làm của sinh viên theo thang điểm từ 0 đến 10.
Yêu cầu bắt buộc: Chỉ trả về ĐÚNG MỘT khối định dạng JSON nguyên chất với cấu trúc dưới đây. Không giải thích thêm bất kỳ điều gì ngoài khối JSON.
{{
  "score": <số điểm từ 0 đến 10, chấp nhận 1 chữ số thập phân>,
  "feedback": "<nhận xét chi tiết của bạn về cách giải, tối ưu/chưa tối ưu điều gì, lỗi sai (nếu có) và lý do cho điểm>"
}}
"""
        prompt = PromptTemplate.from_template(prompt_template)
        chain = prompt | model
        
        response = chain.invoke({
            "title": assignment_title,
            "content": assignment_content,
            "submitted_code": submitted_code
        })
        
        content = response.content.strip()
        # Clean markdown delimiters if model includes them
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
            
        data = json.loads(content.strip())
        score = float(data.get("score", 0))
        # Bounds check
        if score < 0: score = 0
        if score > 10: score = 10
            
        return {
            "score": score,
            "feedback": data.get("feedback", "")
        }
    except Exception as e:
        return {"score": None, "feedback": f"Lỗi hệ thống AI trong quá trình chấm điểm: {str(e)}"}
