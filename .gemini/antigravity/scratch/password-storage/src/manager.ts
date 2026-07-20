import * as crypto from 'crypto';
import { deriveKey, encrypt, decrypt, zeroizeBuffer } from './crypto';
import { loadVault, saveVault } from './storage';

/**
 * [US1: Khởi tạo kho chứa - MVP]
 */
export function initVault(masterPassword: string): void {
    const salt = crypto.randomBytes(16);
    let key: Buffer | null = null;
    try {
        key = deriveKey(masterPassword, salt);
        const initialData = JSON.stringify({ records: [] });
        const encrypted = encrypt(initialData, key);
        saveVault({
            salt: salt.toString('hex'),
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            cipherText: encrypted.cipherText
        });
        console.log(' Khởi tạo kho chứa mật khẩu (Vault) thành công tại vault.enc!');
    } catch (error: any) {
        throw new Error(`Khởi tạo thất bại: ${error.message}`);
    } finally {
        if (key) zeroizeBuffer(key);
    }
}

/**
 * [US2: Thêm bản ghi mới]
 * Giải mã kho chứa hiện tại bằng Master Password, chèn thêm bản ghi mới,
 * tái mã hóa toàn bộ cơ sở dữ liệu và lưu đè an toàn (Atomic Write).
 */
export function addRecord(masterPassword: string, record: { title: string; username: string; passwordTho: string; url: string; notes: string }): void {
    const vault = loadVault();
    if (!vault) {
        throw new Error('Kho chứa dữ liệu chưa được khởi tạo. Vui lòng chạy lệnh "init" trước.');
    }

    const saltBuf = Buffer.from(vault.salt, 'hex');
    let key: Buffer | null = null;

    try {
        // Phái sinh khóa từ Master Password
        key = deriveKey(masterPassword, saltBuf);

        // Giải mã dữ liệu cũ trên bộ nhớ RAM
        const decryptedStr = decrypt(vault.cipherText, key, vault.iv, vault.authTag);
        const data = JSON.parse(decryptedStr);

        // Tạo bản ghi mới chuẩn hóa cấu trúc dữ liệu nhạy cảm
        const newRecord = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
            title: record.title,
            username: record.username,
            password: record.passwordTho,
            url: record.url,
            notes: record.notes,
            updated_at: new Date().toISOString()
        };

        // Chèn vào mảng records
        data.records.push(newRecord);

        // Tái mã hóa dữ liệu cập nhật bằng khóa đối xứng AES-256-GCM
        const updatedDataStr = JSON.stringify(data);
        const encrypted = encrypt(updatedDataStr, key);

        // Lưu trữ nguyên tử xuống đĩa cứng
        saveVault({
            salt: vault.salt,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            cipherText: encrypted.cipherText
        });

        console.log(`✨ Thêm thành công tài khoản cho dịch vụ: [${record.title}]!`);
    } catch (error: any) {
        throw new Error(`Không thể thêm bản ghi: ${error.message}`);
    } finally {
        // [CONSTITUTION RULE: ZEROIZATION] Luôn dọn sạch khóa mật mã khỏi bộ nhớ RAM
        if (key) zeroizeBuffer(key);
    }
}

/**
 * [US4: Liệt kê bản ghi - Phase 6]
 * Giải mã kho chứa trên RAM, in ra danh sách thu gọn gồm Tiêu đề, Username và URL.
 * TUYỆT ĐỐI KHÔNG hiển thị mật khẩu thô trong danh sách này để đảm bảo an toàn.
 */
export function listRecords(masterPassword: string): void {
    const vault = loadVault();
    if (!vault) {
        throw new Error('Kho chứa dữ liệu chưa được khởi tạo. Vui lòng chạy lệnh "init" trước.');
    }

    const saltBuf = Buffer.from(vault.salt, 'hex');
    let key: Buffer | null = null;

    try {
        key = deriveKey(masterPassword, saltBuf);

        // Giải mã dữ liệu kho chứa đưa lên RAM
        const decryptedStr = decrypt(vault.cipherText, key, vault.iv, vault.authTag);
        const data = JSON.parse(decryptedStr);

        if (!data.records || data.records.length === 0) {
            console.log(' Kho chứa hiện tại chưa có tài khoản nào.');
            return;
        }

        console.log('\n=== DANH SÁCH TÀI KHOẢN ĐANG LƯU TRỮ ===');
        data.records.forEach((rec: any, idx: number) => {
            console.log(`${idx + 1}. [${rec.title}] - User: ${rec.username} | Link: ${rec.url || 'N/A'}`);
        });
        console.log('========================================\n');
    } catch (error: any) {
        throw new Error(`Không thể lấy danh sách: ${error.message}`);
    } finally {
        // [CONSTITUTION RULE: ZEROIZATION] Luôn dọn sạch khóa mật mã khỏi RAM
        if (key) zeroizeBuffer(key);
    }
}

/**
 * [US3: Truy vấn chi tiết - Phase 5]
 * Tìm kiếm bản ghi theo Tiêu đề (Title) - Không phân biệt hoa thường.
 * Hiển thị đầy đủ thông tin bao gồm mật khẩu thô sau khi xác thực thành công.
 */
export function getRecord(masterPassword: string, title: string): void {
    const vault = loadVault();
    if (!vault) {
        throw new Error('Kho chứa dữ liệu chưa được khởi tạo. Vui lòng chạy lệnh "init" trước.');
    }

    const saltBuf = Buffer.from(vault.salt, 'hex');
    let key: Buffer | null = null;

    try {
        key = deriveKey(masterPassword, saltBuf);

        const decryptedStr = decrypt(vault.cipherText, key, vault.iv, vault.authTag);
        const data = JSON.parse(decryptedStr);

        // Tìm kiếm bản ghi trùng tiêu đề (Case-insensitive)
        const record = data.records.find((rec: any) => rec.title.toLowerCase() === title.toLowerCase());

        if (!record) {
            console.log(` Không tìm thấy tài khoản nào khớp với tiêu đề: [${title}]`);
            return;
        }

        console.log(`\n=== THÔNG TIN TÀI KHOẢN: ${record.title} ===`);
        console.log(`- Tên đăng nhập: ${record.username}`);
        console.log(`- Mật khẩu thô : ${record.password}`);
        console.log(`- Đường dẫn URL: ${record.url || 'N/A'}`);
        console.log(`- Ghi chú thêm : ${record.notes || 'N/A'}`);
        console.log(`- Cập nhật lúc : ${record.updated_at}`);
        console.log('========================================\n');
    } catch (error: any) {
        throw new Error(`Không thể truy vấn tài khoản: ${error.message}`);
    } finally {
        // [CONSTITUTION RULE: ZEROIZATION] Luôn dọn sạch khóa mật mã khỏi RAM
        if (key) zeroizeBuffer(key);
    }
}

/**
 * [US5: Xóa bản ghi - Phase 7]
 * Tìm kiếm và xóa hoàn toàn một bản ghi dựa theo Tiêu đề (case-insensitive).
 * Sau khi lọc bỏ, tiến hành tái mã hóa và lưu đè an toàn (Atomic Write).
 */
export function deleteRecord(masterPassword: string, title: string): void {
    const vault = loadVault();
    if (!vault) {
        throw new Error('Kho chứa dữ liệu chưa được khởi tạo. Vui lòng chạy lệnh "init" trước.');
    }

    const saltBuf = Buffer.from(vault.salt, 'hex');
    let key: Buffer | null = null;

    try {
        key = deriveKey(masterPassword, saltBuf);

        // Giải mã dữ liệu kho chứa lên RAM
        const decryptedStr = decrypt(vault.cipherText, key, vault.iv, vault.authTag);
        const data = JSON.parse(decryptedStr);

        const initialLength = data.records.length;
        
        // Lọc bỏ bản ghi trùng tiêu đề (Case-insensitive)
        data.records = data.records.filter((rec: any) => rec.title.toLowerCase() !== title.toLowerCase());

        if (data.records.length === initialLength) {
            console.log(` Không tìm thấy tài khoản nào khớp với tiêu đề: [${title}] để xóa.`);
            return;
        }

        // Tái mã hóa dữ liệu sau khi xóa
        const updatedDataStr = JSON.stringify(data);
        const encrypted = encrypt(updatedDataStr, key);

        // Lưu trữ nguyên tử xuống đĩa
        saveVault({
            salt: vault.salt,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            cipherText: encrypted.cipherText
        });

        console.log(` Đã xóa thành công tài khoản dịch vụ: [${title}] khỏi kho chứa!`);
    } catch (error: any) {
        throw new Error(`Không thể xóa bản ghi: ${error.message}`);
    } finally {
        // [CONSTITUTION RULE: ZEROIZATION] Luôn dọn sạch khóa mật mã khỏi RAM
        if (key) zeroizeBuffer(key);
    }
}

/**
 * [FEATURE: SECURE PASSWORD GENERATOR]
 * Sinh mật khẩu ngẫu nhiên độ an toàn cao bằng CSPRNG (crypto.randomBytes).
 * Cho phép tùy chọn độ dài (mặc định là 16 ký tự).
 * Đảm bảo phân phối đều các ký tự: Chữ hoa, chữ thường, số và ký tự đặc biệt.
 */
export function generatePassword(length: number = 16): string {
    if (length < 6) {
        throw new Error('Độ dài mật khẩu tối thiểu phải từ 6 ký tự để đảm bảo an toàn.');
    }

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';
    
    // Đảm bảo mật khẩu luôn có ít nhất 1 ký tự thuộc mỗi nhóm
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += symbols[crypto.randomInt(0, symbols.length)];

    // Sinh các ký tự còn lại ngẫu nhiên an toàn
    for (let i = password.length; i < length; i++) {
        const randomIndex = crypto.randomInt(0, allChars.length);
        password += allChars[randomIndex];
    }

    // Trộn ngẫu nhiên chuỗi kết quả một lần nữa để xóa thứ tự cố định ban đầu
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    const securePassword = passwordArray.join('');
    console.log(`\n🔑 Mật khẩu ngẫu nhiên an toàn đã được tạo: \x1b[32m${securePassword}\x1b[0m\n`);
    return securePassword;
}
