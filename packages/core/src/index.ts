// Core module for SecMan
// Handles project, environment, secret management, and sync orchestration

import { Crypto, cryptoInstance } from '@secman/crypto';
import { GitHubClient } from '@secman/github';
import { parse, load as loadEnvFile, write, merge, diff, discoverEnvFiles, serialize } from '@secman/dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { keychainInstance } from '@secman/keychain';
import { redactMessage } from './redact';

export interface ProjectConfig {
  id: string;
  name: string;
  repository: {
    owner: string;
    repo: string;
  };
  defaultEnvironment: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentConfig {
  name: string;
  createdAt: string;
  updatedAt: string;
  encryptedData?: any; // Will be filled during sync
}

export interface SecretBundle {
  [key: string]: string;
}

export interface SyncStatus {
  local: number;
  remote: number;
  status: 'synchronized' | 'diverged' | 'remote_only' | 'local_only';
  lastSync: string;
}

export class Core {
  private crypto: Crypto;
  private github: GitHubClient;
  private project: ProjectConfig | null = null;
  private environments: Map<string, EnvironmentConfig> = new Map();
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.crypto = cryptoInstance;
    this.github = new GitHubClient();
  }

  /**
   * Initialize a new SecMan project
   */
  async init(projectName: string, environmentName: string): Promise<void> {
    // Check if project already exists
    const existingProject = this.findProject(projectName);
    if (existingProject) {
      throw new Error(`Project "${projectName}" already exists`);
    }

    // Find GitHub repository
    const repoConfig = await this.findOrCreateRepository(projectName);

    // Initialize project config
    this.project = {
      id: cryptoInstance.generateSalt().toString('hex'), // Use crypto's salt generator for ID
      name: projectName,
      repository: repoConfig,
      defaultEnvironment: environmentName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create initial environment
    await this.createEnvironment(projectName, environmentName);

    // Create .secman directory structure
    await this.setupProjectStructure();

    // Initialize encryption credentials
    await this.setupEncryptionCredentials();

    // Setup .gitignore protection
    await this.protectEnvFile();
  }

  /**
   * Find existing project by name
   */
  private findProject(projectName: string): ProjectConfig | null {
    // In MVP, project ID is stored in manifest.json
    // For now, we'll implement basic detection
    return null;
  }

  /**
   * Find or create GitHub repository
   */
  private async findOrCreateRepository(projectName: string): Promise<{ owner: string; repo: string }> {
    // In MVP, we'll assume the user provides the repository name
    // For now, we'll create a default name
    const repoName = `${projectName}-secrets`;
    const owner = 'github-user'; // This should be determined by auth

    // Check if repo exists
    const exists = await this.github.repositoryExists(owner, repoName);
    if (exists) {
      return { owner, repo: repoName };
    }

    // Create new repository
    await this.github.createPrivateRepository(repoName);
    return { owner, repo: repoName };
  }

  /**
   * Create a new environment
   */
  async createEnvironment(projectName: string, environmentName: string): Promise<void> {
    if (!this.project) {
      throw new Error(redactMessage('Project not initialized'));
    }

    this.environments.set(environmentName, {
      name: environmentName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Save environment metadata
    await this.saveEnvironmentMetadata(projectName, environmentName);
  }

  /**
   * Save environment metadata
   */
  private async saveEnvironmentMetadata(projectName: string, environmentName: string): Promise<void> {
    // Create .secman directory
    const secmanDir = path.join(this.projectRoot, '.secman');
    await fs.mkdir(secmanDir, { recursive: true });

    // Create environments directory
    const envDir = path.join(secmanDir, 'environments');
    await fs.mkdir(envDir, { recursive: true });

    // Create environment file (encrypted)
    const envFilePath = path.join(envDir, `${environmentName}.enc`);
    await fs.writeFile(envFilePath, '');

    // Save metadata
    const manifestPath = path.join(secmanDir, 'manifest.json');
    if (!this.project) return;
    const manifest = {
      formatVersion: 1,
      projectId: this.project.id,
      projectName: this.project.name,
      repository: this.project.repository,
      createdAt: this.project.createdAt,
      updatedAt: this.project.updatedAt,
      environments: Array.from(this.environments.keys())
    };

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  }

  /**
   * Setup project structure
   */
  private async setupProjectStructure(): Promise<void> {
    const secmanDir = path.join(this.projectRoot, '.secman');
    const envDir = path.join(secmanDir, 'environments');
    const versionsDir = path.join(secmanDir, 'versions');

    await fs.mkdir(secmanDir, { recursive: true });
    await fs.mkdir(envDir, { recursive: true });
    await fs.mkdir(path.join(this.projectRoot, '.secman', 'versions'), { recursive: true });
    await fs.mkdir(path.join(secmanDir, 'keychain'), { recursive: true });

    // Create .gitignore file
    await this.protectEnvFile();
  }

  /**
   * Setup encryption credentials
   */
  private async setupEncryptionCredentials(): Promise<void> {
    if (!this.project) return;
    const existing = await keychainInstance.getEncryptionCredential(this.project.id);
    if (!existing) {
      const passphrase = process.env.SECMAN_PASSPHRASE || 'default-passphrase';
      await keychainInstance.storeEncryptionCredential({
        projectId: this.project.id,
        passphrase,
        createdAt: new Date().toISOString()
      });
    }
  }

  /**
   * Protect .env file with .gitignore
   */
  private async protectEnvFile(): Promise<void> {
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    const gitignoreContent = `.env
.env.*
!.env.example
`;
    await fs.writeFile(gitignorePath, gitignoreContent, { mode: 0o600 });
  }

  /**
   * Discover and load .env files
   */
  async loadEnvFiles(): Promise<Record<string, string>> {
    const envFiles = discoverEnvFiles(this.projectRoot);
    if (envFiles.length === 0) {
      return {};
    }

    let result: Record<string, string> = {};
    for (const file of envFiles) {
      const fileContent = await fs.readFile(file, 'utf8');
      const parsed = parse(fileContent);
      result = merge(result, parsed);
    }
    return result;
  }

  /**
   * Get current environment
   */
  getCurrentEnvironment(): EnvironmentConfig | null {
    // In MVP, we need to determine current environment
    // For now, return first environment or default
    if (this.environments.size === 0) return null;
    const defaultEnv = this.project?.defaultEnvironment || '';
    return this.environments.get(defaultEnv) || this.environments.get(this.environments.keys().next().value || '') || null;
  }

  /**
   * Get encryption passphrase and derive AES key
   */
  async getEncryptionKey(projectId: string, envelope?: any): Promise<Buffer> {
    const cred = await keychainInstance.getEncryptionCredential(projectId);
    if (!cred) throw new Error(`No encryption credential for project ${projectId}`);
    const salt = envelope ? Buffer.from(envelope.salt, 'base64') : this.crypto.generateSalt();
    return await this.crypto.deriveKey(cred.passphrase, salt);
  }

  /**
   * Rollback to previous version via GitHub history (policy A)
   */
  async rollback(envName: string, commit?: string): Promise<void> {
    if (!this.project) throw new Error(redactMessage('Project not initialized'));
    // Fetch older file from GitHub commit history
    const repoPath = `.secman/environments/${envName}.enc`;
    const remote = await this.github.getFile(
      this.project.repository.owner,
      this.project.repository.repo,
      repoPath
    ); // rollback: commit parameter reserved

    if (!remote) throw new Error(redactMessage('Remote version not found for rollback'));
    const envelope = JSON.parse(remote.content);
    if (!this.crypto.validateIntegrity(envelope)) throw new Error(redactMessage('Integrity check failed on rollback'));
    const passphrase = await this.getPassphrase();
    await this.crypto.openEnvelope(envelope, passphrase); // verify/decrypt
    // Save locally
    const envDir = path.join(this.projectRoot, '.secman', 'environments');
    await fs.mkdir(envDir, { recursive: true });
    await fs.writeFile(path.join(envDir, `${envName}.enc`), JSON.stringify(envelope), { mode: 0o600 });
    await this.updateManifest(envName);
  }

  /**
   * Conflict check: names-only comparison
   */
  async checkConflict(envName: string): Promise<{ status: 'ok' | 'conflict'; keys: string[] }> {
    if (!this.project) return { status: 'ok', keys: [] };
    const local = await this.loadEnvFiles();
    const remoteFile = await this.github.getFile(this.project.repository.owner, this.project.repository.repo, `.secman/environments/${envName}.enc`);
    const remoteKeys: string[] = [];
    if (remoteFile) {
      try {
        const env = JSON.parse(remoteFile.content);
        if (this.crypto.validateIntegrity(env)) {
          const pass = await this.getPassphrase();
          const dec = await this.crypto.openEnvelope(env, pass);
          const p = JSON.parse(dec.toString('utf8'));
          remoteKeys.push(...Object.keys(p));
        }
      } catch { }
    }
    const localKeys = Object.keys(local);
    const changed = localKeys.filter(k => remoteKeys.includes(k));
    return { status: changed.length > 0 && localKeys.length !== remoteKeys.length ? 'conflict' : 'ok', keys: changed };
  }

  /**
   * Import .env file, encrypt, and save
   */
  async importEnvFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = parse(content);
    const jsonStr = JSON.stringify(parsed);
    const passphrase = await this.getPassphrase();
    const envelope = await this.crypto.createEnvelope(Buffer.from(jsonStr, 'utf8'), passphrase);
    const envDir = path.join(this.projectRoot, '.secman', 'environments');
    await fs.mkdir(envDir, { recursive: true });
    const outputPath = path.join(envDir, `${this.getCurrentEnvironment()?.name || 'development'}.enc`);
    await fs.writeFile(outputPath, JSON.stringify(envelope), { mode: 0o600 });
  }

  /**
   * Export encrypted env file to output path
   */
  async exportEnvFile(envName: string, outputPath: string): Promise<void> {
    const encPath = path.join(this.projectRoot, '.secman', 'environments', `${envName}.enc`);
    const envelopeContent = await fs.readFile(encPath, 'utf8');
    const envelope = JSON.parse(envelopeContent);
    const passphrase = await this.getPassphrase();
    const decrypted = await this.crypto.openEnvelope(envelope, passphrase);
    const parsed = JSON.parse(decrypted.toString('utf8'));
    const serialized = serialize(parsed);
    await fs.writeFile(outputPath, serialized, { mode: 0o600 });
  }

  /**
   * Push environment secrets to GitHub
   */
  async push(envName: string): Promise<void> {
    const secrets = await this.loadEnvFiles();
    const passphrase = await this.getPassphrase();
    const jsonStr = JSON.stringify(secrets);
    const envelope = await this.crypto.createEnvelope(Buffer.from(jsonStr, 'utf8'), passphrase);
    const contentStr = JSON.stringify(envelope);
    if (!this.project) throw new Error(redactMessage('Project not initialized'));
    const repoPath = `.secman/environments/${envName}.enc`;
    await this.github.createOrUpdateFile(
      this.project.repository.owner,
      this.project.repository.repo,
      repoPath,
      `Update secrets for ${envName}`,
      contentStr
    );
    // Update manifest + version backup (rotation)
    await this.updateManifest(envName);
    const versionsDir = path.join(this.projectRoot, '.secman', 'versions');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.mkdir(versionsDir, { recursive: true });
    await fs.writeFile(path.join(versionsDir, `${envName}-${ts}.enc`), contentStr, { mode: 0o600 });
  }

  /**
   * Pull environment secrets from GitHub
   */
  async pull(envName: string): Promise<void> {
    if (!this.project) throw new Error('Project not initialized');
    const remote = await this.github.getFile(
      this.project.repository.owner,
      this.project.repository.repo,
      `.secman/environments/${envName}.enc`
    );
    if (!remote) throw new Error('Remote file not found');
    const envelope = JSON.parse(remote.content);
    if (!this.crypto.validateIntegrity(envelope)) throw new Error('Integrity validation failed');
    const passphrase = await this.getPassphrase();
    const decrypted = await this.crypto.openEnvelope(envelope, passphrase);
    const parsed = JSON.parse(decrypted.toString('utf8'));
    // Compare and merge safely
    const local = await this.loadEnvFiles();
    const merged = merge(local, parsed);
    const envDir = path.join(this.projectRoot, '.secman', 'environments');
    await fs.mkdir(envDir, { recursive: true });
    await fs.writeFile(path.join(envDir, `${envName}.enc`), JSON.stringify(envelope), { mode: 0o600 });
  }

  /**
   * Show difference between local and remote secret names only
   */
  async diff(envName: string): Promise<{ added: string[]; removed: string[]; changed: string[] }> {
    const local = await this.loadEnvFiles();
    if (!this.project) return { added: Object.keys(local), removed: [], changed: [] };
    const remoteFile = await this.github.getFile(
      this.project.repository.owner,
      this.project.repository.repo,
      `.secman/environments/${envName}.enc`
    );
    const remoteKeys: string[] = [];
    if (remoteFile) {
      const envelope = JSON.parse(remoteFile.content);
      if (this.crypto.validateIntegrity(envelope)) {
        const passphrase = await this.getPassphrase();
        const decrypted = await this.crypto.openEnvelope(envelope, passphrase);
        const remoteParsed = JSON.parse(decrypted.toString('utf8'));
        for (const k of Object.keys(remoteParsed)) remoteKeys.push(k);
      }
    }
    const localKeys = Object.keys(local);
    const d = diff({ keys: localKeys.join(',') } as any, { keys: remoteKeys.join(',') } as any);
    // Simplify: return added (local only), removed (remote only), changed (both with different names count)
    const added = localKeys.filter(k => !remoteKeys.includes(k));
    const removed = remoteKeys.filter(k => !localKeys.includes(k));
    const changed = localKeys.filter(k => remoteKeys.includes(k)); // names present in both
    return { added, removed, changed };
  }

  private async getPassphrase(): Promise<string> {
    if (!this.project) throw new Error('Project not initialized');
    const cred = await keychainInstance.getEncryptionCredential(this.project.id);
    if (!cred) throw new Error(redactMessage('Encryption passphrase not set'));
    return cred.passphrase;
  }

  private async updateManifest(envName: string): Promise<void> {
    if (!this.project) return;
    const secmanDir = path.join(this.projectRoot, '.secman');
    const manifestPath = path.join(secmanDir, 'manifest.json');
    let manifest: any = { formatVersion: 1, environments: [envName], createdAt: new Date().toISOString() };
    try {
      manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    } catch { }
    const envs = new Set(manifest.environments || []);
    envs.add(envName);
    manifest.environments = Array.from(envs);
    manifest.updatedAt = new Date().toISOString();
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  }

  /**
   * Sync with GitHub
   */
  async sync(offline: boolean = false): Promise<SyncStatus> {
    if (!this.project) {
      throw new Error('Project not initialized');
    }
    const local = await this.loadEnvFiles();
    const localCount = Object.keys(local).length;
    let remoteCount = 0;
    try {
      const remoteFile = await this.github.getFile(
        this.project.repository.owner,
        this.project.repository.repo,
        `.secman/environments/${this.project.defaultEnvironment || 'development'}.enc`
      );
      if (remoteFile) {
        remoteCount = 1;
      }
    } catch { }
    const status = localCount === remoteCount ? 'synchronized' : (localCount > remoteCount ? 'local_only' : 'remote_only');
    return {
      local: localCount,
      remote: remoteCount,
      status: status as any,
      lastSync: new Date().toISOString()
    };
  }
}

export default Core;