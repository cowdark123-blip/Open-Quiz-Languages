import * as fs from 'fs';
import * as path from 'path';

// Đường dẫn file lưu trữ mặc định trong thư mục dự án
const DEFAULT_VAULT_PATH = path.join(process.cwd(), 'vault.enc');

export interface EncryptedVault {
    salt: string;
    iv: string;
    authTag: string;
    cipherText: string;
}

/**
 * [ARCHITECTURE: SECURE STORAGE - ATOMIC WRITE]
 * Lưu dữ liệu đã mã hóa xuống đĩa bằng cơ chế ghi nguyên tử (Atomic Write).
 * Ghi vào file tạm (.tmp) trước, sau đó đổi tên (rename) đè lên file chính.
 * Điều này ngăn chặn hoàn toàn việc file bị hỏng hoặc mất dữ liệu nếu ứng dụng bị ngắt đột ngột/mất điện giữa chừng.
 */
export function saveVault(data: EncryptedVault, filePath: string = DEFAULT_VAULT_PATH): void {
    const tempPath = `${filePath}.tmp`;
    try {
        const content = JSON.stringify(data, null, 2);
        
        // Ghi vào file tạm thời
        fs.writeFileSync(tempPath, content, 'utf8');
        
        // Đổi tên file tạm thành file chính thức (Thao tác nguyên tử ở tầng OS)
        fs.renameSync(tempPath, filePath);
    } catch (error) {
        // Dọn dẹp file tạm nếu quá trình ghi thất bại dữ chừng
        if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch (_) {}
        }
        throw new Error('Lỗi hệ thống: Không thể ghi hoặc cập nhật kho dữ liệu bảo mật.');
    }
}

/**
 * [ARCHITECTURE: SECURE STORAGE - LOAD]
 * Đọc file dữ liệu đã mã hóa từ đĩa.
 * Trả về null nếu kho chưa được khởi tạo (file chưa tồn tại).
 */
export function loadVault(filePath: string = DEFAULT_VAULT_PATH): EncryptedVault | null {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content) as EncryptedVault;
    } catch (error) {
        // Bẫy lỗi an toàn: Không trả ra chi tiết hệ thống để tránh khai thác thông tin
        throw new Error('Lỗi hệ thống: Kho dữ liệu mã hóa cấu trúc không hợp lệ hoặc bị lỗi đọc file.');
    }
}
