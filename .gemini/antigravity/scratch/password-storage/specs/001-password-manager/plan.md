# Implementation Plan: password-manager (v1.0.0)

Kế hoạch này phân rã các yêu cầu từ `spec.md` thành các tác vụ phát triển cụ thể, tuân thủ nghiêm ngặt các tiêu chuẩn bảo mật trong `constitution.md`.

## 1. Technical Context

- **Ngôn ngữ**: Node.js (TypeScript)
- **Mật mã học**: Module `crypto` tích hợp sẵn của Node.js (Không cài thêm thư viện crypto ngoài).
    - *Key Derivation*: `crypto.pbkdf2Sync` (HMAC-SHA256, 100,000 vòng lặp).
    - *Encryption*: `aes-256-gcm`.
- **Giao diện CLI**: `commander` và `readline` (để mute/ẩn mật khẩu khi người dùng nhập).

## 2. Constitution Check

- Kiến Trúc Zero-Knowledge: Đã tuân thủ (Chỉ lưu file vault.enc, không lưu Master Password).
- Zeroization: Sẽ triển khai `zeroizeBuffer` trên RAM (Task 1.5).
- Tối Giản Để Kiểm Toán: Tuân thủ tuyệt đối bằng cách chỉ dùng `crypto` native của Node.js, không dùng thư viện ngoài cho mật mã học.

## 3. Kiến Trúc Thư Mục Dự Kiến (Monorepo)

Sử dụng mô hình Monorepo để dễ dàng quản lý và deploy lên Vercel:

```text
password-storage/
├── frontend/           # Vite + React (Web UI & Web Crypto API)
├── api/                # Node.js + Express (Serverless Functions)
├── vercel.json         # Cấu hình routing (Vercel)
├── package.json        # Workspace gốc
├── CONSTITUTION.md     # (.specify/memory/constitution.md)
└── SPECIFICATION.md    # (specs/001-password-manager/spec.md)
```

## 4. Danh Sách Tác Vụ Chi Tiết (Task Breakdown)

### Pha 1: Khởi Tạo Monorepo, Supabase & Vercel
- [ ] **Task 1.1**: Khởi tạo `package.json` gốc với cấu hình npm workspaces (`frontend`, `api`).
- [ ] **Task 1.2**: Tạo file `vercel.json` định tuyến `/api/*` về thư mục `api`, và route mặc định về `frontend`.
- [ ] **Task 1.3**: Khởi tạo dự án Supabase, cấu hình Google OAuth.
- [ ] **Task 1.4**: Cung cấp script SQL tạo bảng `vaults` (UUID `id`, UUID `user_id` liên kết với `auth.users`, JSONB `vault_data`).

### Pha 2: Phát triển Backend (Express Serverless)
- [ ] **Task 2.1**: Thiết lập Express.js trong thư mục `api/` và tích hợp `supabase-js` (sử dụng Service Role Key để bypass RLS hoặc xử lý bằng Auth header).
- [ ] **Task 2.2**: Viết API `GET /api/vault`. Backend sẽ verify token JWT qua Supabase Auth, lấy `user_id`, và truy xuất record trong bảng `vaults`.
- [ ] **Task 2.3**: Viết API `PUT /api/vault`. Backend verify JWT và cập nhật cột JSONB `vault_data` cho `user_id` tương ứng.

### Pha 3: Phát triển Frontend (React & Web Crypto API)
- [ ] **Task 3.1**: Cài đặt React/Vite tại `frontend/`. Tích hợp Supabase Client để cấu hình nút Đăng nhập Google.
- [ ] **Task 3.2**: Chuyển đổi module Crypto cũ sang sử dụng **Web Crypto API** (PBKDF2, AES-256-GCM, Crypto.getRandomValues).
- [ ] **Task 3.3**: Xây dựng UI: Màn hình nhập Master Password, bảng quản lý mật khẩu, tính năng sinh mật khẩu ngẫu nhiên an toàn.
- [ ] **Task 3.4**: Đảm bảo dọn dẹp các trạng thái mật khẩu khỏi Context/State ngay sau khi tác vụ kết thúc để chống rò rỉ bộ nhớ trình duyệt.
