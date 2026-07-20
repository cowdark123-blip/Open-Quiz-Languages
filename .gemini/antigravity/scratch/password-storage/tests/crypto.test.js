"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const crypto_1 = require("../src/crypto");
function runCryptoTests() {
    console.log('🔄 [TEST] Đang kiểm thử tầng bảo mật mật mã cốt lõi...');
    const masterPassword = 'MySuperSecurePassword2026';
    const salt = Buffer.from('abcdef0123456789abcdef0123456789', 'hex');
    const secretPayload = JSON.stringify({ records: [{ id: '1', secret: 'password123' }] });
    // Test 1: Kiểm tra tính đúng đắn của chu trình mã hóa & giải mã
    const key = (0, crypto_1.deriveKey)(masterPassword, salt);
    const encrypted = (0, crypto_1.encrypt)(secretPayload, key);
    const decrypted = (0, crypto_1.decrypt)(encrypted.cipherText, key, encrypted.iv, encrypted.authTag);
    assert.strictEqual(decrypted, secretPayload, '❌ Lỗi: Dữ liệu sau khi giải mã không khớp với dữ liệu gốc!');
    console.log('✅ Test 1: Chu trình Mã hóa -> Giải mã hoạt động chính xác.');
    // Test 2: Kiểm tra tính toàn vẹn dữ liệu (Chống giả mạo - Tamper Resistance)
    // Giả lập hacker chỉnh sửa 1 bit cuối cùng của chuỗi cipherText
    const lastChar = encrypted.cipherText.slice(-1);
    const tamperedChar = lastChar === '0' ? '1' : '0';
    const tamperedCipherText = encrypted.cipherText.slice(0, -1) + tamperedChar;
    assert.throws(() => {
        (0, crypto_1.decrypt)(tamperedCipherText, key, encrypted.iv, encrypted.authTag);
    }, /Giải mã thất bại/, '❌ Lỗi: Hệ thống không chặn đứng được dữ liệu bị giả mạo!');
    console.log('✅ Test 2: Kháng giả mạo tốt (Phát hiện và chặn đứng file bị sửa đổi bit).');
    // Test 3: Kiểm tra cơ chế dọn dẹp bộ nhớ (Zeroization)
    (0, crypto_1.zeroizeBuffer)(key);
    assert.strictEqual(key[0], 0, '❌ Lỗi: Cơ chế Zeroize không ghi đè được số 0 lên Buffer!');
    console.log('✅ Test 3: Cơ chế Zeroization trên RAM hoạt động hoàn hảo.');
    console.log('\n🎉 TOÀN BỘ BÀI KIỂM THỬ BẢO MẬT ĐÃ ĐẠT CHUẨN (ALL TESTS PASSED)!');
}
try {
    runCryptoTests();
}
catch (error) {
    console.error('\n❌ Thử nghiệm thất bại:');
    console.error(error.message);
    process.exit(1);
}
