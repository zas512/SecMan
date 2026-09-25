# Required from user's side to complete missing SecMan features

Based on architecture.md (9 issues + continuation) and text.txt (3554 lines, items #40 Rollback, #41 Conflict, #53 Secret Redaction, #65 GitHub API Conflict):

## 1. GitHub Authentication (REQUIRED for end-to-end)
- GitHub Personal Access Token (classic or fine-grained) with scopes: repo, workflow (optional)
- OR OAuth device-flow authorization completed (secman login stores in OS keychain via @secman/keychain / keytar)
- Repository must exist (private) OR user must have create-repo permission
- Without this: push/pull/end-to-end impossible to verify live

## 2. OS Keychain / Credential Storage (REQUIRED for encryption)
- Windows: Windows Credential Manager (keytar relies on it)
- macOS: Keychain Access
- Linux: libsecret / Secret Service API
- If unavailable: encryption passphrase will fall back to env SECMAN_PASSPHRASE (insecure for production)

## 3. Node / pnpm Environment
- pnpm (workspaces) already installed; verify all packages installed: pnpm install
- ts-jest + @types/jest installed (done this session)
- For tests to fully pass: needs real crypto test adjustments (some source logic differences remain, not setup)

## 4. Secret Redaction (text.txt #53) — MISSING IN SOURCE
- Every error message, log line, debug output must filter SECRET patterns (KEY=val, TOKEN=..., PASSWORD=...)
- Currently crypto errors expose some details; needs regex redaction layer in packages/core/src/index.ts + CLI
- User must confirm: should secrets be masked with [REDACTED]? Should error messages include variable names only (never values)?

## 5. Rollback / Version History (text.txt #40) — MISSING IN SOURCE
- Requires manifest version tracking (manifest.json: environments[].versions[])
- Needs UI/confirmation: secman rollback <commit> pulls encrypted version from GitHub file history
- User must confirm: keep all versions in GitHub repo (via commit history) or separate versions/ directory?
- Currently Core.saveEnvironmentMetadata writes single .enc file; no versioned backups

## 6. Conflict Handling (text.txt #41 + #65) — MISSING IN SOURCE
- When both Machine A and B modify same secret and push: detect via remote commit comparison or diff
- User must confirm conflict resolution policy: 1=keep local, 2=keep remote, 3=manual, 4=abort
- Must never display secret values during resolution (only keys/names)
- Currently sync() returns static 'synchronized' — no real comparison logic

## 7. Multi-Environment Isolation (text.txt requirements)
- Confirm: one encrypted file per environment (.secman/environments/<env>.enc) — already implemented structurally
- Confirm: separate encryption keys per env or shared with env-specific salt? Currently deriveKey uses same passphrase + salt per envelope
- Confirm: production environment requires extra confirmation prompt?

## 8. .env Instructions for User
- Before running secman import: create .env with real secrets (never commit this to repo — .gitignore handles it)
- Example .env format: KEY=value (quoted values supported by @secman/dotenv parse)

## 9. End-to-End Verification Steps (user must run)
- [ ] Create GitHub repo (private) named <project>-secrets
- [ ] secman init -n test -e dev
- [ ] echo 'API_KEY=123' > .env && secman import
- [ ] secman push
- [ ] On second machine / after clone: secman pull
- [ ] secman run -- npm run dev
- [ ] secman doctor (security checks)

## 10. Security / Redaction Confirmation
- Confirm: error messages should NEVER contain 'secret', 'password', 'token', 'key' followed by value
- Confirm: debug mode (if added) must keep redaction active (text.txt #53: "Debug mode must never disable secret redaction")
=== ENV TOKEN ===
Add to .env or shell (NOT committed — .gitignore protects):
GITHUB_TOKEN=ghp_xxxxxxxx
SECMAN_PASSPHRASE=your-income-passphrase-only-if-keychain-fails

=== REDACTION POLICY ===
From architecture.md line 90 + text.txt #53:
- ALL errors, logs, debug output must filter secret patterns
- Never output KEY=value, TOKEN=..., PASSWORD=..., SECRET=...
- Even in debug mode (debug must NEVER disable redaction)
- Suggest: regex replace /([A-Z_]{3,20})=([^\s]{4,})/g with "$1=[REDACTED]"
- User choice needed: mask value ONLY, or also hide key name?
- Provide your policy: [REDACTED]-value / names-only / custom regex?
=== ROLLBACK POLICY ===
From text.txt #40:
- secman rollback -> restore previous encrypted .enc version
- Source needs: manifest.json version history OR .secman/versions/ directory
- User choice needed:
  A) Use GitHub commit history (pull older file version) — requires repo history
  B) Keep local versions/ backups per push — more control, more disk
  C) Both (recommended): local versions/ + remote commit fallback
- Provide: which method? Confirm confirmation prompt (always ask before overwrite)?
=== CONFLICT POLICY ===
From text.txt #41 + #65:
- When local and remote change same secret: detect before push
- User choice needed for resolution UI:
  1 = Keep local
  2 = Keep remote  
  3 = Resolve manually (show names only, never values)
  4 = Abort
- Must never display secret values during resolution
- Provide: do you want automatic detection or manual check only?
