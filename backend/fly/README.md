# Fly.io deployment

This repo is prepared for 3 separate Fly apps:

- `backend`: Django API
- `user`: React user frontend
- `admin`: React admin frontend

## Files

- `backend/fly/backend/fly.toml`
- `backend/fly/user/fly.toml`
- `backend/fly/admin/fly.toml`
- `backend/.env.fly.example`
- `frontend/user/.env.fly.example`
- `frontend/admin/.env.fly.example`

## Suggested app names

- `your-backend-app`
- `your-user-app`
- `your-admin-app`

## Deploy order

1. Create backend app and Postgres/Redis if needed.
2. Set backend secrets from `backend/.env.fly.example`.
3. Deploy backend.
4. Update frontend `VITE_API_BASE_URL` build args to the real backend URL.
5. Deploy user frontend.
6. Deploy admin frontend.
7. Update backend `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, and `DJANGO_ALLOWED_HOSTS` to real domains if they changed.

## Example secret commands

```bash
fly secrets set DJANGO_SECRET_KEY=... DATABASE_URL=... BACKEND_URL=https://your-backend-app.fly.dev FRONTEND_URL=https://your-user-app.fly.dev -a your-backend-app
fly secrets set GOOGLE_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... -a your-backend-app
```

## Notes

- PDF OCR and AI grading are still synchronous/background-thread based in the app code, so Fly deployment is prepared, but heavy AI requests can still be slow.
- `COOKIE_SAMESITE=None` is recommended when frontend and backend run on different Fly subdomains and cookies are used cross-site.
