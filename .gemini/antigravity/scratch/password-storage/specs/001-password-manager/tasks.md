# Danh Sách Tác Vụ (tasks.md) - Full-stack Web (v2.0)

## Pha 1: Khởi Tạo Monorepo, Supabase & Vercel
- [ ] **Task 1.1**: Khởi tạo `package.json` gốc với cấu hình npm workspaces (`frontend`, `api`).
- [ ] **Task 1.2**: Tạo file `vercel.json` định tuyến `/api/*` về thư mục `api`, và route mặc định về `frontend`.
- [ ] **Task 1.3**: Khởi tạo dự án Supabase, cấu hình Google OAuth.
- [ ] **Task 1.4**: Chạy script SQL tạo bảng `vaults` (UUID `id`, UUID `user_id` liên kết với `auth.users`, JSONB `vault_data`).

## Pha 2: Phát triển Backend (Express Serverless)
- [ ] **Task 2.1**: Thiết lập Express.js trong thư mục `api/` và tích hợp `supabase-js` (sử dụng Service Role Key để bypass RLS hoặc middleware auth).
- [ ] **Task 2.2**: Viết API `GET /api/vault`. Backend sẽ verify token JWT qua Supabase Auth, lấy `user_id`, và truy xuất record trong bảng `vaults`.
- [ ] **Task 2.3**: Viết API `PUT /api/vault`. Backend verify JWT và cập nhật cột JSONB `vault_data` cho `user_id` tương ứng.

## Pha 3: Phát triển Frontend (React & Web Crypto API)
- [ ] **Task 3.1**: Cài đặt React/Vite tại `frontend/`. Tích hợp Supabase Client để cấu hình nút Đăng nhập Google.
- [ ] **Task 3.2**: Chuyển đổi module Crypto cũ sang sử dụng **Web Crypto API** (PBKDF2, AES-256-GCM, Crypto.getRandomValues).
- [ ] **Task 3.3**: Xây dựng UI: Màn hình nhập Master Password, bảng quản lý mật khẩu, tính năng sinh mật khẩu ngẫu nhiên an toàn.
- [ ] **Task 3.4**: Đảm bảo dọn dẹp các trạng thái mật khẩu khỏi Context/State ngay sau khi tác vụ kết thúc để chống rò rỉ bộ nhớ trình duyệt.
