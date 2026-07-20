import { Command } from 'commander';
import * as readline from 'readline';
import { initVault, addRecord, listRecords, getRecord, deleteRecord, generatePassword } from './manager';

const program = new Command();

program
    .name('anti-pass')
    .description('Ứng dụng quản lý mật khẩu Antigravity an toàn cao')
    .version('1.0.0');

function askQuestion(query: string): Promise<string> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(query, (answer) => { rl.close(); resolve(answer); });
    });
}
function askHiddenQuestion(query: string): Promise<string> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        process.stdout.write(query);
        // @ts-ignore
        rl._writeToOutput = function _writeToOutput(stringToWrite: string) {
            if (stringToWrite === '\r\n' || stringToWrite === '\n' || stringToWrite === '\r') {
                process.stdout.write(stringToWrite);
            }
        };
        rl.question('', (answer) => { rl.close(); resolve(answer); });
    });
}

// Lệnh CLI: anti-pass init
program
    .command('init')
    .description('Khởi tạo một kho chứa mật khẩu mới')
    .action(async () => {
        try {
            const password = await askHiddenQuestion('Nhập Master Password để khởi tạo kho chứa: ');
            console.log('');
            if (!password || password.trim().length < 6) {
                console.error(' Lỗi: Mật khẩu chính phải có độ dài từ 6 ký tự trở lên.');
                process.exit(1);
            }
            initVault(password);
        } catch (error: any) {
            console.error(` Thất bại: ${error.message}`);
            process.exit(1);
        }
    });

// Lệnh CLI: anti-pass add
program
    .command('add')
    .description('Thêm một tài khoản bảo mật mới vào kho lưu trữ')
    .action(async () => {
        try {
            const masterPassword = await askHiddenQuestion('Nhập Master Password để mở khóa kho: ');
            console.log('');
            const title = await askQuestion('Nhập Tiêu đề dịch vụ (ví dụ: Facebook, Github): ');
            const username = await askQuestion('Nhập Tên đăng nhập / Email: ');
            const passwordTho = await askHiddenQuestion('Nhập Mật khẩu của tài khoản này: ');
            console.log('');
            const url = await askQuestion('Nhập URL đường dẫn (bỏ qua nếu không có): ');
            const notes = await askQuestion('Nhập Ghi chú thêm (bỏ qua nếu không có): ');

            if (!title.trim() || !username.trim() || !passwordTho.trim()) {
                console.error(' Lỗi: Tiêu đề, Tên đăng nhập và Mật khẩu không được để trống.');
                process.exit(1);
            }
            addRecord(masterPassword, { title, username, passwordTho, url, notes });
        } catch (error: any) {
            console.error(` Thất bại: ${error.message}`);
            process.exit(1);
        }
    });

// Lệnh CLI: anti-pass list
program
    .command('list')
    .description('Hiển thị danh sách tóm tắt tất cả các tài khoản đang lưu trữ')
    .action(async () => {
        try {
            const masterPassword = await askHiddenQuestion('Nhập Master Password để xem danh sách: ');
            console.log('');
            listRecords(masterPassword);
        } catch (error: any) {
            console.error(` Thất bại: ${error.message}`);
            process.exit(1);
        }
    });

// Lệnh CLI: anti-pass get <title>
program
    .command('get')
    .argument('<title>', 'Tiêu đề của dịch vụ cần truy vấn dữ liệu mật khẩu')
    .description('Xem thông tin chi tiết và mật khẩu thô của một tài khoản')
    .action(async (title) => {
        try {
            const masterPassword = await askHiddenQuestion('Nhập Master Password để xác thực quyền truy cập: ');
            console.log('');
            getRecord(masterPassword, title);
        } catch (error: any) {
            console.error(` Thất bại: ${error.message}`);
            process.exit(1);
        }
    });

// Lệnh CLI: anti-pass delete <title>
program
    .command('delete')
    .argument('<title>', 'Tiêu đề của dịch vụ cần xóa khỏi hệ thống')
    .description('Xóa hoàn toàn một tài khoản mật khẩu khỏi kho lưu trữ')
    .action(async (title) => {
        try {
            const masterPassword = await askHiddenQuestion(`Nhập Master Password để xác nhận xóa [${title}]: `);
            console.log('');
            
            // Hỏi xác nhận thêm một lần nữa để tránh việc vô tình xóa nhầm
            const confirm = await askQuestion(`Bạn có chắc chắn muốn xóa vĩnh viễn [${title}]? (y/N): `);
            if (confirm.toLowerCase() !== 'y') {
                console.log(' Đã hủy thao tác xóa.');
                process.exit(0);
            }

            deleteRecord(masterPassword, title);
        } catch (error: any) {
            console.error(` Thất bại: ${error.message}`);
            process.exit(1);
        }
    });

// Lệnh CLI: anti-pass gen [length]
program
    .command('gen')
    .argument('[length]', 'Độ dài của mật khẩu muốn tạo (Mặc định: 16)', '16')
    .description('Sinh một mật khẩu ngẫu nhiên có độ an toàn cao')
    .action((length) => {
        try {
            const pwdLength = parseInt(length, 10);
            if (isNaN(pwdLength)) {
                console.error(' Lỗi: Độ dài mật khẩu phải là một chữ số.');
                process.exit(1);
            }
            generatePassword(pwdLength);
        } catch (error: any) {
            console.error(` Thất bại: ${error.message}`);
            process.exit(1);
        }
    });

program.parse(process.argv);
