# Google OAuth Debug & Fix (V3_Elearning)

Tài liệu này ghi lại các lỗi đã gặp khi login Google và cách xử lý.

## 1) Lỗi 400: `invalid_request` + `Required parameter is missing: response_type`
**Triệu chứng**
- Khi bấm Google login, Google trả lỗi 400.
- Màn hình báo: thiếu `response_type`.

**Nguyên nhân**
- Backend tạo URL OAuth thiếu `response_type=code`.
- `scope` dùng kiểu GitHub (`read:user`) nên sai chuẩn Google.

**Cách fix**
Trong `backend/apps/User/views/google_oauth.py`:
- Thêm `response_type=code`.
- Dùng `scope=openid email profile`.
- Thêm `access_type=offline`, `prompt=consent` (tùy chọn nhưng nên có).


## 2) Lỗi 401 khi callback: không lấy được access_token
**Triệu chứng**
- Callback `/api/user/oauth/google/callback/` trả 401.

**Nguyên nhân phổ biến**
- Thiếu hoặc sai `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- `redirect_uri` không khớp Google Console.
- `BACKEND_URL` không đúng so với host thực tế.

**Cách fix**
Trong bước exchange token, cần gửi:
- `redirect_uri` đúng tuyệt đối với Google Console
- `grant_type=authorization_code`

Ngoài ra cần cấu hình đúng trong Google Console:
- Authorized JavaScript origins: `http://localhost:5173`
- Authorized redirect URIs: `http://localhost:8000/api/user/oauth/google/callback/`


## 3) Lỗi 401: `Cannot read google user`
**Triệu chứng**
- Callback trả JSON:
  ```json
  { "success": false, "error": "Cannot read google user" }
  ```

**Nguyên nhân**
- Google OIDC trả user id ở field `sub`, không phải `id`.

**Cách fix**
Trong `google_oauth.py`:
- Đổi lấy `google_id = gh_user.get("sub")` (fallback `id`).
- Lấy email từ `gh_user.get("email")`.


## Check nhanh sau khi fix
1. Restart backend.
2. Bấm Google login.
3. Nếu còn lỗi, xem JSON `details` trả về từ callback để biết sai ở đâu.

