import * as assert from 'assert';
import { deriveKey, encrypt, decrypt, zeroizeBuffer } from '../src/crypto';

function runCryptoTests() {
    console.log('🔄 [TEST] Đang kiểm thử tầng bảo mật mật mã cốt lõi...');

    const masterPassword = 'MySuperSecurePassword2026';
    const salt = Buffer.from('abcdef0123456789abcdef0123456789', 'hex');
    const secretPayload = JSON.stringify({ records: [{ id: '1', secret: 'password123' }] });

    // Test 1: Kiểm tra tính đúng đắn của chu trình mã hóa & giải mã
    const key = deriveKey(masterPassword, salt);
    const encrypted = encrypt(secretPayload, key);
    const decrypted = decrypt(encrypted.cipherText, key, encrypted.iv, encrypted.authTag);

    assert.strictEqual(decrypted, secretPayload, '❌ Lỗi: Dữ liệu sau khi giải mã không khớp với dữ liệu gốc!');
    console.log('✅ Test 1: Chu trình Mã hóa -> Giải mã hoạt động chính xác.');

    // Test 2: Kiểm tra tính toàn vẹn dữ liệu (Chống giả mạo - Tamper Resistance)
    // Giả lập hacker chỉnh sửa 1 bit cuối cùng của chuỗi cipherText
    const lastChar = encrypted.cipherText.slice(-1);
    const tamperedChar = lastChar === '0' ? '1' : '0';
    const tamperedCipherText = encrypted.cipherText.slice(0, -1) + tamperedChar;

    assert.throws(() => {
        decrypt(tamperedCipherText, key, encrypted.iv, encrypted.authTag);
    }, /Giải mã thất bại/, '❌ Lỗi: Hệ thống không chặn đứng được dữ liệu bị giả mạo!');
    console.log('✅ Test 2: Kháng giả mạo tốt (Phát hiện và chặn đứng file bị sửa đổi bit).');

    // Test 3: Kiểm tra cơ chế dọn dẹp bộ nhớ (Zeroization)
    zeroizeBuffer(key);
    assert.strictEqual(key[0], 0, '❌ Lỗi: Cơ chế Zeroize không ghi đè được số 0 lên Buffer!');
    console.log('✅ Test 3: Cơ chế Zeroization trên RAM hoạt động hoàn hảo.');

    console.log('\n🎉 TOÀN BỘ BÀI KIỂM THỬ BẢO MẬT ĐÃ ĐẠT CHUẨN (ALL TESTS PASSED)!');
}

try {
    runCryptoTests();
} catch (error: any) {
    console.error('\n❌ Thử nghiệm thất bại:');
    console.error(error.message);
    process.exit(1);
}
