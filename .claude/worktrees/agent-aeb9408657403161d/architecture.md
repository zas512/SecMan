# SecMan Project Architecture

**Project**: SecMan - Secure, GitHub-backed environment and secret synchronization CLI  
**Current Status**: Initial setup in progress  
**Last Updated**: 2026-09-24

## Project Overview
SecMan is a local-first CLI tool that allows developers to securely synchronize project environment variables and secrets across multiple machines using a private GitHub repository as the storage and synchronization layer.

### Core Philosophy
- GitHub must never have access to plaintext SecMan secrets
- GitHub = untrusted storage
- SecMan = trusted encryption/decryption client
- Developer = owner of encryption credentials

## Current Implementation Status

**Session date:** 2026-09-24  
**Status:** Development scaffold created. Source files and documentation have been added, but the project has not yet been installed, compiled, tested, or exercised end to end.

### ✅ Done Today

#### Project foundation
- Reviewed the complete requirements in `text.txt` and extracted the architecture and implementation phases.
- Initialized a TypeScript monorepo with npm workspaces in `package.json`.
- Added strict TypeScript configuration in `tsconfig.json`.
- Created the planned package and application directories.
- Added workspace package manifests for all core packages and the CLI application.
- Added root development scripts for build, development, start, and tests.

#### Security and encryption foundation
- Added `@secman/crypto` with:
  - AES-256-GCM authenticated encryption.
  - Argon2id key derivation.
  - Random salt and nonce generation.
  - Encrypted envelope creation and opening.
  - Encryption format/version fields.
- Documented the security boundary, prohibited practices, threat model, and credential-handling rules in `SECURITY.md`.

#### Supporting modules
- Added `@secman/dotenv` with dotenv parsing, serialization, loading, writing, merging, diffing, and environment-file discovery.
- Added `@secman/config` with `.secman.yaml` and manifest loading, saving, and structural validation.
- Added `@secman/github` with Octokit-based authentication status, repository lookup/creation, file operations, deletion, and commit-history helpers.
- Added `@secman/keychain` interfaces for GitHub tokens, encryption credentials, and generic OS credential storage.
- Added `@secman/process` as an initial process-spawning and environment-injection skeleton.
- Added `@secman/core` as the initial project/environment orchestration skeleton.

#### CLI and documentation
- Added the initial CLI command structure in `apps/cli/src/index.ts`, including placeholders for init, connect, auth, environment, secret, import/export, sync, status, run, history, and doctor.
- Added the initial `init` flow to create project metadata and protected environment directories.
- Added `README.md` with installation, usage, package layout, and security links.
- Added `SECURITY.md` with the documented threat model and security rules.
- Updated `.gitignore` to protect `.env` and `.env.*` files while preserving `.env.example`.
- Created `architecture.md` as the continuing development record.

### ⏳ Remaining Work

#### Immediate build and correctness work
- Run `npm install` and `npm run build` to establish a known-good baseline.
- Fix current TypeScript and package-resolution issues found during that verification.
- Run Jest and add the required unit, integration, and security tests.
- Verify the CLI in a real terminal rather than treating the command scaffolding as completed behavior.

#### CLI behavior still missing
- Complete interactive prompts for login, initialization, repository selection, passphrase creation/confirmation, and environment selection.
- Complete `connect`, environment commands, secret commands, import, export, push, pull, diff, status, history, and doctor.
- Implement non-interactive options and secure stdin input for secret values.
- Add clear, actionable, secret-safe errors and consistent output formatting.

#### Authentication and repository workflows still missing
- Implement browser/device OAuth and token fallback without exposing tokens.
- Resolve the authenticated GitHub owner instead of using a placeholder owner.
- Save GitHub credentials only in the OS credential store.
- Implement repository detection, private repository creation, branch handling, commits, and conflict detection.
- Add repository integrity checks before accepting or writing SecMan data.

#### Local state, encryption, and synchronization still missing
- Implement user-controlled encryption passphrase flows and OS keychain integration.
- Implement actual import/export of encrypted environment snapshots.
- Implement push/pull/status/diff/history orchestration.
- Implement multi-environment isolation and production confirmation.
- Implement conflict resolution without displaying secret values.
- Implement local encrypted cache and limited offline runtime behavior.
- Preserve existing `.gitignore` content while adding missing `.env` protection rules.

#### Runtime and hardening still missing
- Implement `secman run` with transparent stdin/stdout/stderr forwarding, signal forwarding, exit-code propagation, and safe environment construction.
- Implement path validation and prevent accidental export outside the project.
- Add restrictive file permissions where supported.
- Add secret redaction to every logger, error, and debug path.
- Add tamper, malformed-manifest, unsupported-version, and wrong-project checks.
- Complete the threat-model review and security test suite.

#### Documentation still missing
- Add `CONTRIBUTING.md`, `LICENSE`, and `CHANGELOG.md`.
- Expand `README.md` with the complete quick-start, command reference, GitHub architecture, limitations, and roadmap.
- Update this architecture file after each completed phase.

### ⚠️ Known Issues to Resolve Before Continuing

1. The CLI currently uses Commander APIs that need correction (`createCommandBuilder()` is not available, and several nested-command declarations are not valid Commander patterns).
2. `Core.init()` currently uses the placeholder owner `github-user`; authenticated owner resolution must replace it.
3. `Core.loadEnvFiles()` still contains a placeholder `Record<string, string>.parse()` call that must be replaced with the imported `parse()` function.
4. `GitHubClient.getAuthStatus()` currently treats every GitHub failure as unauthenticated; it must distinguish authentication failures from network and authorization failures.
5. `Crypto.validateIntegrity()` only checks field presence; authenticated decryption must remain the authoritative integrity check.
6. `@secman/keychain` needs dependency/type verification on the target platform.
7. `ProcessManager` needs signal-listener cleanup, timeout handling, and removal of shell-based execution unless specifically required.
8. The initial `protectEnvFile()` implementation overwrites an existing `.gitignore`; future initialization must merge safely.
9. The initial README contains a command typo (`pull` where `push` is intended in the quick start).

### 🔗 Continuation Plan for Tomorrow

1. Install dependencies and compile the project to capture the exact baseline failures.
2. Fix build and TypeScript errors before adding more features.
3. Add focused tests for crypto, dotenv, config, GitHub abstractions, and process handling.
4. Correct and complete the Commander command tree.
5. Implement authentication, initialization, and keychain workflows.
6. Implement encrypted import/export and push/pull synchronization.
7. Implement runtime injection and conflict handling.
8. Run the complete documented end-to-end scenario.
9. Update `architecture.md` with verified completion status and any architectural changes.

## Project Structure (Planned)

```
secman/
├── packages/
│   ├── core/
│   ├── crypto/
│   ├── github/
│   ├── dotenv/
│   ├── keychain/
│   ├── process/
│   └── config/
├── apps/
│   └── cli/
├── tests/
├── docs/
├── package.json
├── README.md
├── SECURITY.md
└── ARCHITECTURE.md
```

## Package Architecture (Planned)

### `@secman/core`
- Project logic
- Environment logic
- Secret management
- Sync orchestration
- Validation

### `@secman/crypto`
- Key derivation (Argon2id)
- Encryption (AES-256-GCM or XChaCha20-Poly1305)
- Decryption
- Integrity validation
- Encryption format

### `@secman/github`
- GitHub authentication
- Repository creation
- Repository lookup
- File read/write
- Commit handling
- Conflict detection

### `@secman/dotenv`
- `.env` parsing
- `.env` generation
- Environment normalization

### `@secman/keychain`
- OS credential storage (macOS Keychain, Windows DPAPI, Linux Secret Service)
- GitHub token storage
- Local SecMan credential storage

### `@secman/process`
- Process spawning
- Environment injection
- Signal forwarding
- Exit code propagation

### `@secman/config`
- `.secman.yaml` handling
- Manifest validation

## CLI Command Structure (Planned)

```
secman
├── login / logout / auth status
├── init / connect
├── env list / create / delete / use / current
├── secret list / set / remove / rename
├── import / export
├── push / pull / diff
├── status / doctor / history
└── run -- <command>
```

## Security Requirements
- Never plaintext secrets in GitHub
- Never plaintext secrets in commits
- Never plaintext secrets in logs
- Never plaintext secrets in error messages
- Use AES-256-GCM or XChaCha20-Poly1305
- Use Argon2id for KDF
- Never hardcode encryption keys or GitHub tokens
- Use OS credential stores where available

## Development Phases (Per Documentation)

### Phase 1 — Foundation
- TypeScript project ✅
- CLI framework
- Command routing
- Config system
- Project detection
- Logging
- Error handling

### Phase 2 — Crypto
- KDF
- Encryption/decryption
- Encryption envelope
- Integrity validation
- Versioning
- Tests

### Phase 3 — Local `.env`
- Parse `.env`
- Import/export
- Validation
- `.gitignore`
- Secret diff

### Phase 4 — GitHub
- Authentication
- Repository detection/creation
- File read/write
- Commit handling
- Conflict detection

### Phase 5 — Sync
- Push/Pull
- Status/Diff/History

### Phase 6 — Runtime
- `secman run`
- Environment injection
- Signal forwarding
- Exit code forwarding

### Phase 7 — Security Hardening
- Keychain integration
- Permissions
- Security tests
- Path validation
- Tamper detection
- Threat-model review

### Phase 8 — UX
- Better prompts
- Progress indicators
- Clear errors
- Non-interactive mode
- Shell compatibility

## Notes
- This project is initialized based on the comprehensive SecMan documentation found in `text.txt`
- Architecture will be updated as development progresses
- Security is the top priority - no custom cryptography, use proven libraries
- GitHub is treated as untrusted storage - all secrets must be encrypted locally