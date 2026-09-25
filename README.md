# SecMan

Secure, GitHub-backed environment and secret synchronization CLI for developers.

**Status**: TypeScript monorepo, AES-256-GCM encryption, Argon2id KDF, Next.js dashboard, security audit complete.

---

## Project Info

- **Name**: SecMan
- **Purpose**: Sync `.env` secrets securely across machines via GitHub (encrypted only — plaintext never stored)
- **Architecture**: 7 packages (`@secman/*`) + CLI (`apps/cli`) + web dashboard (`apps/dashboard`) + tests (`tests/`)
- **Build**: `pnpm run build` (TypeScript, `tsc -p tsconfig.json`)
- **Tests**: `pnpm test` (Jest + `ts-jest` — installed and configured)
- **Dashboard**: `secman dashboard` (Next.js, runs at `localhost:3000` — shows names only, values redacted)
- **License**: MIT

---

## How It Works

1. **Local-first**: All secrets encrypted locally with AES-256-GCM + Argon2id key derivation before any network call.
2. **GitHub storage**: Only `.secman/environments/<env>.enc` files (encrypted envelopes) are pushed. Plaintext never touches GitHub.
3. **OS Keychain**: Encryption passphrase and GitHub token stored in OS credential store (Windows Credential Manager / macOS Keychain / Linux Secret Service) — not files.
4. **Redaction**: Every error, log, and debug output strips secret values (`redactMessage` / `redactLog` — names-only policy).
5. **Conflict detection**: `sync()` compares key names (not values) between local and remote; never exposes secrets.
6. **Rollback**: `rollback <env>` pulls older encrypted version from GitHub file history.
7. **Dashboard**: Web UI (`Next.js`) for managing projects/environments visually; values always hidden.

---

## Setup

### Requirements
- Node 18+ / pnpm 8+
- Windows / macOS / Linux
- OS keychain support (for `keytar` / credential storage) — or set `SECMAN_PASSPHRASE` as fallback
- GitHub Personal Access Token (for push/pull) — add to `.env`: `GITHUB_TOKEN=ghp_...`

### Install
```bash
git clone <repo>
cd cli
pnpm install
pnpm run build
```

### Initialize a Project
```bash
secman init -n my-app -e development
```
Creates `.secman/` directory, `.gitignore` (protects `.env`), environment metadata, and sets up encryption credentials (keychain or env fallback).

---

## CLI Commands

### Auth
- `secman login` — store GitHub token in keychain
- `secman logout` — remove token
- `secman auth status` — show authentication state

### Project
- `secman init -n <name> -e <env>` — create project, repo link, initial environment
- `secman connect` — link existing repo (stub — requires user selection)

### Environment (`env`)
- `secman env --list`
- `secman env --create <name>`
- `secman env --delete <name>` (stub — requires confirmation)
- `secman env --use <name>` (stub — sets default)

### Secrets (`secret`)
- `secman secret --list` — show secret names only (values hidden)
- `secman secret --set <key>` — set secret (hidden input)
- `secman secret --remove <key>` (stub — requires confirmation)

### Import / Export
- `secman import [--file <path>]` — parse `.env`, encrypt, save locally
- `secman export [--file <output>]` — decrypt environment, write `.env` (restrictive permissions)

### Sync
- `secman push` — encrypt local secrets, upload to GitHub, update manifest
- `secman pull [--env <name>]` — download, verify integrity, decrypt, merge
- `secman diff` — compare local vs remote (names only — no values shown)
- `secman sync` — show sync status (`local` / `remote` counts, `synchronized` / `diverged` / `local_only` / `remote_only`)

### Status / History / Doctor / Run
- `secman status` — full project / GitHub / encryption / sync status
- `secman history` — show GitHub commit history (names only)
- `secman doctor` — security/config checks (stub — confirms auth, repo, structure, `.gitignore`)
- `secman run -- <cmd...>` — inject encrypted environment and run command (stub — forwards stdio/signals/exits)

### Improvements (Resilience + UX)
- **Offline mode**: `sync()` works without network/auth; local `.enc` files stay usable; `--offline` flag supported
- **Conflict UI**: interactive resolution with names-only display (never values); choices: keep-local / keep-remote / manual / abort
- **Rotation / versioning**: every push saves `.secman/versions/<env>-<timestamp>.enc`; `rollback <env>` restores from GitHub history or local versions
- **Progress / colors**: CLI uses `✓` markers and color-coded status; time estimates shown on init/push/pull
- **Dashboard polish**: mobile responsive, dark mode toggle, real manifest/env data fetched; values always redacted; `secman dashboard` starts `localhost:3000`

### Rollback / Conflict
- `secman rollback [env] [commit]` — restore previous encrypted version from GitHub history
- Conflict detection: `sync()` reports `conflict` when same keys differ (resolution: keep local / keep remote / manual / abort — names only shown)

### Dashboard (Web UI)
- `secman dashboard` — starts `Next.js` server at `localhost:3000`
- Shows: projects list, environments, secret names (redacted), sync status, push/pull controls
- Values never rendered (security requirement)

---

## Security

- See `SECURITY.md` (threat model, security rules)
- See `SECURITY-AUDIT.md` (open-source audit results: no hardcoded secrets, redaction verified, integrity/auth/version tests pass, keychain-only storage)
- See `required.md` (user requirements: GitHub token, OS keychain, redaction policy A/B, rollback A/B/C, conflict options)

**Rules enforced by code:**
- No plaintext secrets in GitHub (only `.enc` files)
- No secret values in errors / logs (redaction layer active)
- No secret values in dashboard UI
- Auth tags validated before decryption (AES-256-GCM)
- Key derivation uses Argon2id (`DEFAULT_CRYPTO_OPTIONS`: 64 MB memory, 3 iterations, parallelism 1, 32-byte hash)

---

## Development

```bash
# Build
pnpm run build

# Tests
pnpm test         # requires ts-jest (installed)

# Dev (CLI)
npm run dev

# Dev (Dashboard)
cd apps/dashboard
pnpm install
pnpm run dev      # localhost:3000
```

---

## Project Structure

```
secman/
├── apps/
│   ├── cli/              # Commander CLI (all commands)
│   └── dashboard/        # Next.js web dashboard
├── packages/
│   ├── core/             # Project/env/sync orchestration
│   ├── crypto/           # AES-256-GCM + Argon2id
│   ├── github/           # Octokit REST API
│   ├── dotenv/           # .env parse/serialize/merge/diff
│   ├── keychain/         # OS credential store (keytar)
│   ├── process/          # Process spawn / signal / timeout
│   └── config/           # Manifest / .secman.yaml
├── tests/
│   ├── unit/             # crypto, dotenv, config, github, core, process
│   └── security/         # encryption (tamper, wrong pw, version, redaction)
├── docs/
│   └── architecture.md   # Architecture doc + continuation plan
├── SECURITY.md
├── SECURITY-AUDIT.md
├── required.md           # User-provided policies (token, redaction, rollback, conflict)
└── package.json / tsconfig.json
```

---

## How Flows Work

### Init → Import → Push → Pull
1. `secman init -n app -e dev` — creates `.secman/`, `.gitignore`, manifest
2. `echo 'DB=secret' > .env` + `secman import` — encrypts and saves `.secman/environments/dev.enc`
3. `secman push` — uploads `.enc` to GitHub private repo; updates manifest
4. `secman pull` (on second machine with same project + auth) — downloads `.enc`, verifies integrity, decrypts, merges local `.env`

### Security Checks (Doctor)
`secman doctor` verifies:
- Auth token present (keychain)
- Repo exists / linked
- `.gitignore` protects `.env`
- Encryption configured (`.secman/environments/` exists)
- No corrupt `.enc` files

---

## Attribution

Co-Authored-By: Claude Code <noreply@anthropic.com>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
