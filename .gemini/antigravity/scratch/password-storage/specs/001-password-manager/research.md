# Research: password-manager

## Cryptography in Node.js
- **Decision**: Use Node.js built-in `crypto` module (`crypto.pbkdf2Sync` and `aes-256-gcm`).
- **Rationale**: Strict compliance with Constitution principle "Tối Giản Để Kiểm Toán". Using built-in modules avoids 3rd-party supply chain risks. `pbkdf2Sync` is sufficient for MVP and avoids needing native compiling for `argon2`.
- **Alternatives considered**: `argon2` npm package (rejected due to 3rd party dependency risk).

## Secure Password Prompting
- **Decision**: Use `readline` to mask terminal input.
- **Rationale**: Minimal, no external dependency required. 
- **Alternatives considered**: `inquirer` (rejected to reduce external dependencies).
