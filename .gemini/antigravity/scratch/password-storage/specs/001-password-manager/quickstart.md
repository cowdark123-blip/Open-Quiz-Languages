# Quickstart Validation Guide: password-manager

## Prerequisites
- Node.js (v18+)
- Built project (`npm run build`)

## Scenario 1: Init and Add
1. Run `node dist/index.js init`.
2. Enter a secure Master Password (e.g. `test1234`).
3. Run `node dist/index.js add`.
4. Provide the Master Password, and fill out details for "Github".
5. Verify `vault.enc` is created in the working directory and contains binary/encrypted data.

## Scenario 2: List and Get
1. Run `node dist/index.js list`. Provide Master Password. Verify "Github" is listed.
2. Run `node dist/index.js get Github`. Provide Master Password. Verify the password you entered is displayed on screen.

## Scenario 3: Memory Cleanup and Security
1. Provide an INCORRECT Master Password for `anti-pass list`. Verify it gracefully exits with "Giải mã thất bại" without a stack trace containing sensitive keys.
2. Verify `vault.enc` modifications (e.g. flipping a bit in the file) result in an integrity check failure (Auth Tag mismatch) and not exposing partial data.
