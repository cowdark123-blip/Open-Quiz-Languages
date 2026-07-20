<!-- 
Sync Impact Report:
- Version change: none -> 1.0.0
- Modified principles: 
  - I. Nguyên Tắc Cốt Lõi (Core Principles)
  - II. Kiến Trúc Mật Mã & Lưu Trữ (Cryptography Architecture)
  - III. Tiêu Chuẩn Viết Code & An Toàn Bộ Nhớ (Coding Standards)
  - IV. Quản Lý Phụ Thuộc (Dependency Management)
- Templates requiring updates:
  - .specify/templates/plan-template.md (⚠ pending)
  - .specify/templates/spec-template.md (⚠ pending)
  - .specify/templates/tasks-template.md (⚠ pending)
- Follow-up TODOs: none
-->

# Antigravity Password Storage Constitution

Bản hiến chương này thiết lập các nguyên tắc bất biến, kiến trúc bảo mật và tiêu chuẩn kỹ thuật áp dụng cho toàn bộ vòng đời phát triển của ứng dụng Quản lý Mật khẩu (Antigravity Password Storage). Mọi dòng code được viết ra đều phải tuân thủ nghiêm ngặt các quy định dưới đây.

## Nguyên Tắc Cốt Lõi (Core Principles)

### Kiến Trúc Zero-Knowledge (Không tri thức) trên Web
Hệ thống không bao giờ được phép biết, lưu trữ hoặc truyền tải Mật khẩu chính (Master Password) dưới dạng thô qua mạng. Người dùng là người duy nhất nắm giữ chìa khóa giải mã dữ liệu của họ.
- **Client-Side Encryption (CSE)**: Toàn bộ quá trình mã hóa (Encrypt) và giải mã (Decrypt) phải diễn ra trên trình duyệt bằng **Web Crypto API**.
- **Vai trò Backend**: Backend (Express Serverless / Supabase) chỉ đóng vai trò lưu trữ chuỗi dữ liệu đã được mã hóa (JSONB payload gồm `salt`, `iv`, `authTag`, `cipherText`). Backend tuyệt đối không có khả năng giải mã dữ liệu này.

### Xác thực & Định danh (Authentication)
- Sử dụng **Supabase Auth (Google OAuth 2.0)** để định danh User ID và quản lý phiên bản (Session JWT).
- Supabase Auth chỉ làm nhiệm vụ cấp token truy cập; nó không liên quan đến cơ chế mã hóa nội dung Vault.

### Bảo Mật Bị Động & Chủ Động
Dữ liệu luôn ở trạng thái mã hóa khi lưu trữ (Data-at-Rest) trên cơ sở dữ liệu. Khi nằm trên bộ nhớ RAM của trình duyệt để xử lý, dữ liệu nhạy cảm (như Master Password hay Key thô) phải được giải phóng sớm nhất có thể.

### Tối Giản Để Kiểm Toán (Auditability)
Ưu tiên sử dụng các thư viện mật mã tiêu chuẩn, có sẵn của ngôn ngữ/hệ điều hành. Tuyệt đối không tự tùy biến thuật toán mã hóa (Don't roll your own crypto) và hạn chế tối đa thư viện từ bên thứ ba không rõ nguồn gốc.

## Kiến Trúc Mật Mã & Lưu Trữ (Cryptography Architecture)

Ứng dụng bắt buộc phải triển khai mô hình mã hóa theo các tiêu chuẩn sau:

### Hàm băm và Phái sinh khóa (Key Derivation)
- **Thuật toán**: Sử dụng Argon2id (hoặc PBKDF2-HMAC-SHA256 nếu môi trường hạn chế tài nguyên) để biến đổi Master Password thành Khóa mã hóa (Encryption Key).
- **Salt**: Mỗi lần khởi tạo hoặc đổi Master Password, một chuỗi Salt ngẫu nhiên có độ dài tối thiểu 16-byte (sử dụng bộ sinh số ngẫu nhiên an toàn của hệ điều hành - CSPRNG) phải được tạo ra và lưu kèm với file dữ liệu.
- **Tham số cấu hình**: Số vòng lặp (iterations) và dung lượng bộ nhớ sử dụng phải đủ lớn để chống lại các cuộc tấn công dò mã (Brute-force) bằng phần cứng chuyên dụng (GPU/ASIC).

### Mã hóa dữ liệu (Data Encryption)
- **Thuật toán**: AES-256-GCM (Advanced Encryption Standard với Galois/Counter Mode). Đây là chuẩn mã hóa đối xứng có xác thực (Authenticated Encryption), giúp ngăn chặn việc dữ liệu bị giả mạo hoặc chỉnh sửa khi chưa được giải mã.
- **IV (Initialization Vector)**: Mỗi lần ghi file hoặc cập nhật mật khẩu, một chuỗi IV ngẫu nhiên 12-byte mới bắt buộc phải được tạo ra thông qua CSPRNG. Không bao giờ tái sử dụng IV cho cùng một khóa mã hóa.

## Tiêu Chuẩn Viết Code & An Toàn Bộ Nhớ (Coding Standards)

### Quy tắc RAM sạch
Dữ liệu nhạy cảm là mục tiêu hàng đầu của các cuộc tấn công đọc trộm bộ nhớ (Memory dumping).
- **Xóa dấu vết bộ nhớ**: Sau khi hiển thị hoặc sử dụng mật khẩu/khóa mã hóa, các biến chứa dữ liệu này phải được ghi đè bằng giá trị 0 (Zeroization) trước khi kích hoạt cơ chế dọn rác (Garbage Collection).

### Bẫy lỗi an toàn (Fail-Safe Error Handling)
Các thông báo lỗi xuất ra console hoặc file log tuyệt đối không được chứa thông tin nhạy cảm (như Master Password, Key, IV, dữ liệu chưa mã hóa). Lỗi mật mã chỉ hiển thị thông báo chung (ví dụ: "Giải mã thất bại").

### Bảo vệ Input
Mọi dữ liệu nhập vào từ người dùng phải được chuẩn hóa để tránh các lỗi tràn bộ nhớ (Buffer Overflow) hoặc chèn mã độc (Injection).

## Quản Lý Phụ Thuộc (Dependency Management)

- Chỉ sử dụng các gói thư viện cốt lõi (Core packages) được cung cấp sẵn bởi ngôn ngữ lập trình cho các tác vụ mật mã.
- Trường hợp bắt buộc phải dùng thư viện ngoài (ví dụ thư viện Argon2), thư viện đó phải là thư viện phổ biến, được cộng đồng kiểm duyệt kỹ lưỡng và có tần suất cập nhật bảo mật đều đặn.

## Governance

Bản hiến chương này (Constitution) là tài liệu tối cao chi phối toàn bộ kiến trúc và quyết định kỹ thuật của dự án. Mọi thay đổi về nguyên tắc bảo mật phải được thảo luận, xem xét kỹ lưỡng và cập nhật vào văn bản này trước khi tiến hành code. 

**Version**: 1.0.0 | **Ratified**: 2026-07-20 | **Last Amended**: 2026-07-20
