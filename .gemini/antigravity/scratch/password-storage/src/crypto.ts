import * as crypto from 'crypto';

/**
 * [CONSTITUTION RULE: ZEROIZATION]
 * Ghi đè số 0 hoàn toàn lên vùng bộ nhớ Buffer để xóa dấu vết dữ liệu nhạy cảm trên RAM.
 * Cần gọi hàm này ngay sau khi Master Password hoặc Secrect Key vừa hoàn thành tác vụ.
 */
export function zeroizeBuffer(buffer: Buffer): void {
    if (buffer && buffer.length > 0) {
        buffer.fill(0);
    }
}

/**
 * [CONSTITUTION RULE: ZERO-KNOWLEDGE]
 * Phái sinh khóa mã hóa 256-bit từ Master Password bằng PBKDF2-HMAC-SHA256.
 * Đảm bảo xóa sạch bản thô của password trên RAM ngay sau khi chạy xong.
 */
export function deriveKey(masterPassword: string, salt: Buffer): Buffer {
    const passwordBuffer = Buffer.from(masterPassword, 'utf8');
    try {
        const iterations = 100000; // Số vòng lặp đảm bảo chống Brute-force phần cứng
        const keyLength = 32;      // 32 bytes = 256 bits cho AES-256
        const digest = 'sha256';
        return crypto.pbkdf2Sync(passwordBuffer, salt, iterations, keyLength, digest);
    } finally {
        zeroizeBuffer(passwordBuffer);
    }
}

/**
 * [ARCHITECTURE: AES-256-GCM ENCRYPTION]
 * Mã hóa dữ liệu thô bằng thuật toán AES-256 đối xứng có xác thực (Authenticated Encryption).
 * Trả về ciphertext kèm chuỗi IV ngẫu nhiên và mã xác thực Auth Tag.
 */
export function encrypt(plainText: string, key: Buffer): { cipherText: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(12); // Chuẩn IV của mã GCM là 12 bytes
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let cipherText = cipher.update(plainText, 'utf8', 'hex');
    cipherText += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return {
        cipherText,
        iv: iv.toString('hex'),
        authTag
    };
}

/**
 * [ARCHITECTURE: AES-256-GCM DECRYPTION]
 * Giải mã dữ liệu và xác thực tính toàn vẹn của file thông qua Auth Tag.
 * Bẫy lỗi an toàn: Tuyệt đối không in mã lỗi gốc để tránh lộ thông tin (Leak information).
 */
export function decrypt(cipherText: string, key: Buffer, ivHex: string, authTagHex: string): string {
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let plainText = decipher.update(cipherText, 'hex', 'utf8');
        plainText += decipher.final('utf8');
        return plainText;
    } catch (error) {
        throw new Error('Giải mã thất bại: Kho dữ liệu đã bị chỉnh sửa bất hợp pháp hoặc sai Master Password.');
    }
}
