# Security Documentation

## Threat Model

GitHub = untrusted storage  
SecMan = trusted encryption/decryption client  
Developer = owner of encryption credentials

### Threats

1. **Private GitHub repository contents** — Attacker gets encrypted ciphertext only
2. **GitHub authentication token** — Attacker may access repository but cannot decrypt secrets
3. **Encrypted repository + stolen laptop** — Security depends on local key protection
4. **Incorrect passphrase** — Decryption fails safely
5. **Tampered encrypted file** — Authenticated encryption detects tampering
6. **Malicious repository content** — SecMan validates metadata
7. **Secret accidentally printed by application** — SecMan cannot protect against deliberate exfiltration

## Security Rules

**Absolutely Prohibited:**
- Plaintext secrets in GitHub
- Plaintext secrets in commits
- Plaintext secrets in logs
- Plaintext secrets in error messages
- Plaintext secrets in `.secman.yaml`
- Plaintext secrets in manifest
- Hardcoded encryption keys
- Hardcoded GitHub tokens
- Hardcoded passwords
- Custom cryptographic algorithms
- Weak password hashing
- Secrets included in telemetry

## Encryption

- **Algorithm**: AES-256-GCM
- **KDF**: Argon2id
- **Nonce**: Random per encryption
- **Salt**: Unique random per encryption
- **Auth tag**: GCM authentication tag

## Key Handling

Never store the master encryption passphrase in:
- `.env`
- `package.json`
- `.secman.yaml`
- Git
- GitHub
- Plaintext config
- Logs

## Audit Trail

- All pushes create git commits in the secrets repository
- Commit messages never include secret values
- Access is logged locally