# Interface Contract: CLI

## CLI Commands (`anti-pass`)

1. `anti-pass init`
   - Purpose: Initialize a new encrypted vault.
   - Prompts: Master Password (twice, masked).
   - Output: Success message or failure if vault already exists.

2. `anti-pass add`
   - Purpose: Add a new password record.
   - Prompts: Master Password (masked), Title, Username, Password (masked), URL, Notes.
   - Output: Success message.

3. `anti-pass list`
   - Purpose: Display all saved records.
   - Prompts: Master Password (masked).
   - Output: Tabular list of Title, Username, URL (NO passwords).

4. `anti-pass get <title>`
   - Purpose: Retrieve and decrypt a specific password.
   - Prompts: Master Password (masked).
   - Output: Details of the record, including the plaintext password.

5. `anti-pass delete <title>`
   - Purpose: Remove a record from the vault.
   - Prompts: Master Password (masked).
   - Output: Success message.
