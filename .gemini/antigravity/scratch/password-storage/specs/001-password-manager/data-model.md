# Data Model: password-manager

## Vault Storage Structure (Decrypted payload)
The `vault.enc` file will store AES-256-GCM encrypted data. When decrypted, it yields the following JSON structure:

### Vault Metadata
- **salt** (string, hex): 16-byte random salt used for key derivation.
- **iterations** (number): Number of iterations for PBKDF2 (e.g., 100000).

### Record Entity
- **id** (string): UUID or unique identifier for the record.
- **title** (string): Name of the service/website.
- **username** (string): Account username.
- **password** (string): The plaintext password (ONLY in RAM, encrypted at rest).
- **url** (string): Optional link to the service.
- **updated_at** (string): ISO 8601 timestamp.

## Security Constraints
- All attributes must be strictly validated before encryption.
- No `Record` data may ever be dumped to logs or stdout unless explicitly requested via `get`.
