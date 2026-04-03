# 📚 Hệ thống E-Learning (Đồ án TTTN)

Hệ thống E-Learning cho đồ án TTTN, gồm:
- **Backend:** Django (API)
- **Frontend User:** React + Vite
- **Frontend Admin:** React + Vite
- **Database:** PostgreSQL (Supabase)

Backend và Frontend **tách biệt hoàn toàn**.

---

## 1. ⚙️ Yêu cầu môi trường

### Backend
- Python **3.9**
- pip
- Python Launcher (`py`)

### Frontend
- Node.js **>= 18**
- npm

---

## 2. 📁 Cấu trúc thư mục

```txt
TTTN/
├─ backend/
│  ├─ core/
│  ├─ apps/
│  ├─ manage.py
│  ├─ requirements.txt
│  └─ .env            # 🚨 KHÔNG commit/public
│
└─ frontend/
   ├─ user/
   └─ admin/
```

---

## 3. 🚀 KHỞI CHẠY BACKEND (BẮT BUỘC CHẠY TRƯỚC)

Backend phải chạy và hoạt động ổn định trước khi khởi động bất kỳ Frontend nào.

### Bước 1: Vào thư mục backend
```bash
cd backend
```

### Bước 2: Tạo virtual environment (Python 3.9)
```bash
py -3.9 -m venv .venv
```

### Bước 3: Activate môi trường ảo
```bash
.\.venv\Scripts\activate
```
**Kiểm tra:**
```bash
python --version
# Phải là Python 3.9.x
```

### Bước 4: Cài dependency
```bash
pip install -r requirements.txt
```

### Bước 5: Migrate database
```bash
python manage.py migrate
```

### Bước 6: Chạy backend server
```bash
python manage.py runserver
```
Backend chạy tại: `http://127.0.0.1:8000`
Kiểm tra: `GET http://127.0.0.1:8000/api/health/`

---

## 4. 💻 KHỞI CHẠY FRONTEND USER

### Bước 1: Vào thư mục user
```bash
cd frontend/user
```

### Bước 2: Cài dependency
```bash
npm install
```

### Bước 3: Chạy frontend user
```bash
npm start
```
Truy cập: `http://localhost:5173`

---

## 5. 👑 KHỞI CHẠY FRONTEND ADMIN

### Bước 1: Vào thư mục admin
```bash
cd frontend/admin
```

### Bước 2: Cài dependency
```bash
npm install
```

### Bước 3: Chạy frontend user
```bash
npm start
```
Truy cập: `http://localhost:5174`

---

## 6. 🚦 THỨ TỰ CHẠY ĐÚNG (QUAN TRỌNG)

1. **Backend**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Frontend User**
   ```bash
   cd frontend/user
   npm start
   ```

3. **Frontend Admin**
   ```bash
   cd frontend/admin
   npm start
   ```

👉 **Lưu ý:** Backend phải luôn chạy trước frontend.