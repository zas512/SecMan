# SecMan

Secure, GitHub-backed environment and secret synchronization CLI for developers.

## Overview

SecMan is a local-first CLI tool that allows developers to securely synchronize project environment variables and secrets across multiple machines using a private GitHub repository as the storage and synchronization layer.

**Core Security Principle**: GitHub must never have access to plaintext SecMan secrets.

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
# Initialize a new project
secman init

# Import existing .env file
secman import .env

# Push encrypted secrets to GitHub
secman pull

# Run a command with injected environment
secman run -- npm run dev
```

## Development

This project uses a monorepo structure with TypeScript packages:

- `@secman/core` - Core logic
- `@secman/crypto` - Encryption and key derivation
- `@secman/github` - GitHub API integration
- `@secman/dotenv` - .env file handling
- `@secman/keychain` - OS credential storage
- `@secman/process` - Process management
- `@secman/config` - Configuration handling
- `apps/cli` - Command-line interface

## Security

See [SECURITY.md](SECURITY.md) for details on our security model and threat analysis.

## License

MIT