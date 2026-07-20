# Feature Specification: password-manager

**Feature Branch**: `001-password-manager`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Tài liệu này đặc tả các tính năng cốt lõi..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Khởi tạo & Đăng nhập (Priority: P1)

Người dùng truy cập ứng dụng Web, đăng nhập bằng nút "Sign in with Google" (Supabase Auth). Sau đó, nhập Master Password. Nếu là lần đầu tiên, hệ thống sinh Salt và thiết lập vault trên local, sau đó đồng bộ (PUT) lên Supabase Database.

**Why this priority**: Bước đầu tiên để vào ứng dụng trên Web.

**Independent Test**: Đăng nhập bằng tài khoản Google, nhập Master Password, kiểm tra xem bảng `vaults` trên Supabase có lưu dữ liệu JSONB khởi tạo không.

**Acceptance Scenarios**:

1. **Given** người dùng chưa có dữ liệu vault trên cloud, **When** đăng nhập Google thành công và nhập Master Password, **Then** Frontend dùng Web Crypto API sinh kho chứa rỗng, mã hóa và gọi API gửi lên Backend để lưu vào Supabase.
2. **Given** người dùng đã có vault, **When** đăng nhập Google, **Then** hệ thống fetch dữ liệu từ Supabase và yêu cầu nhập Master Password để giải mã tại Client.

---

### User Story 2 - Thêm bản ghi mới (Priority: P1)

Người dùng thêm một mật khẩu mới vào kho bằng lệnh `anti-pass add`. Hệ thống yêu cầu nhập Master Password để mở khóa, sau đó nhập thông tin (Title, Username, URL, Password ẩn) và mã hóa lại để lưu trữ.

**Why this priority**: Chức năng cốt lõi của trình quản lý mật khẩu.

**Independent Test**: Kiểm tra xem bản ghi có được lưu vào file mã hóa không bằng cách gọi lệnh add.

**Acceptance Scenarios**:

1. **Given** người dùng đã khởi tạo vault, **When** chạy `anti-pass add`, xác thực thành công và nhập đủ thông tin, **Then** bản ghi mới được mã hóa và lưu vào vault, các biến trong RAM chứa dữ liệu nhạy cảm được zeroize.

---

### User Story 3 - Truy vấn chi tiết (Priority: P1)

Người dùng lấy mật khẩu của một dịch vụ bằng lệnh `anti-pass get <title>`.

**Why this priority**: Mục đích chính để lấy lại mật khẩu đã lưu.

**Independent Test**: Kiểm tra xem ứng dụng có in ra đúng mật khẩu sau khi giải mã không.

**Acceptance Scenarios**:

1. **Given** vault chứa bản ghi "Github", **When** người dùng gọi `anti-pass get Github` và xác thực thành công, **Then** ứng dụng hiển thị thông tin chi tiết (bao gồm Password) và zeroize RAM ngay sau đó.
2. **Given** vault chứa bản ghi "Github", **When** người dùng nhập sai Master Password, **Then** ứng dụng báo "Giải mã thất bại" và thoát.

---

### User Story 4 - Liệt kê bản ghi (Priority: P2)

Người dùng xem danh sách các dịch vụ đã lưu bằng lệnh `anti-pass list`. Mật khẩu thô không bao giờ được hiển thị.

**Why this priority**: Giúp người dùng quản lý và tìm kiếm các bản ghi đã lưu.

**Independent Test**: Đảm bảo mật khẩu không bao giờ xuất hiện trong console khi chạy `list`.

**Acceptance Scenarios**:

1. **Given** vault có nhiều bản ghi, **When** chạy `anti-pass list` và xác thực thành công, **Then** ứng dụng in ra danh sách gồm Title, Username, URL (không có Password).

---

### User Story 5 - Xóa bản ghi (Priority: P3)

Người dùng xóa một bản ghi khỏi vault bằng lệnh `anti-pass delete <title>`.

**Why this priority**: Cần thiết để duy trì kho lưu trữ, nhưng ít quan trọng hơn CRUD cơ bản.

**Independent Test**: Đảm bảo bản ghi bị xóa khỏi file mã hóa sau lệnh này.

**Acceptance Scenarios**:

1. **Given** vault chứa bản ghi "Github", **When** chạy `anti-pass delete Github` và xác thực thành công, **Then** bản ghi bị xóa khỏi file `vault.enc`.

### Edge Cases

- What happens when người dùng nhập sai Master Password nhiều lần? -> Ứng dụng thoát ngay, không lưu state sai.
- How does system handle file `vault.enc` bị mất hoặc hỏng? -> Báo lỗi không thể mở kho lưu trữ, yêu cầu `init` lại hoặc restore backup.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST cung cấp giao diện Web (React) cho các tính năng: Khởi tạo/Đăng nhập, Thêm, Xem, Xóa mật khẩu.
- **FR-002**: Đăng nhập MUST thông qua Supabase Auth (Google OAuth).
- **FR-003**: Khi lưu trữ, Frontend MUST mã hóa dữ liệu JSON payload bằng thuật toán AES-256-GCM (Web Crypto API) với IV ngẫu nhiên 12-byte. Backend (Express) chỉ nhận và lưu chuỗi đã mã hóa vào bảng `vaults`.
- **FR-004**: Khóa giải mã MUST được phái sinh từ Master Password thông qua PBKDF2 (Web Crypto API) ở trình duyệt.
- **FR-005**: Mọi biến nhớ tại Client chứa Master Password, Key, và dữ liệu thô MUST được bảo vệ và dọn dẹp khi reload/đóng trang.

### Key Entities *(include if feature involves data)*

- **Vaults Table (Supabase)**: `id` (UUID, Primary Key), `user_id` (UUID, Foreign Key tới `auth.users`), `vault_data` (JSONB: `{ salt, iv, authTag, cipherText }`), `updated_at` (Timestamp).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quá trình giải mã tại Client diễn ra mượt mà, không giật lag.
- **SC-002**: Không có bất kỳ payload API nào gửi Master Password hoặc plaintext data qua mạng (Xác minh bằng Network Tab).
- **SC-003**: Backend Express (Vercel Serverless) chỉ nhận và lưu data, hoàn toàn không có hàm mật mã học nào được thực thi ở Backend.

## Assumptions

- Trình duyệt của người dùng hiện đại và hỗ trợ chuẩn Web Crypto API.
- Google OAuth và Supabase hoạt động ổn định.
