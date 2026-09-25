# Security Audit — Open Source

## Redaction Policy (names-only B)
- `redactMessage()` masks secret values in all errors
- `redactLog()` filters environment objects before logging
- Verified in: packages/core/src/redact.ts, core/index.ts errors

## Integrity
- AES-256-GCM with auth tag (packages/crypto/src/index.ts)
- `validateIntegrity()` checks algorithm/version; decryption is authoritative check

## Authentication
- GitHub token: OS keychain only (packages/keychain/src/index.ts)
- Encryption passphrase: OS keychain (`SECURITY.md` confirms)
- No hardcoded tokens in source

## Threat Model
- GitHub = untrusted storage; only encrypted envelopes (`.enc`) stored
- Local machine = trusted; keychain holds keys
- No plaintext secrets in logs, errors, commits, dashboard UI

## Audit Status 2026-09-25
- Source audit: no hardcoded secrets found (grep for token/key/pass patterns)
- Redaction layer implemented and applied
- Tests include tamper detection, wrong passphrase, version mismatch
- Dashboard (planned): displays names only, never values
