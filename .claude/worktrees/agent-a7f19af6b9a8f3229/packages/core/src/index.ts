// Core module for SecMan
// Handles project, environment, secret management, and sync orchestration

import { Crypto, cryptoInstance } from '@secman/crypto';
import { GitHubClient } from '@secman/github';
import { parse, load as loadEnvFile, write, merge, diff, discoverEnvFiles } from '@secman/dotenv';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

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
      throw new Error('Project not initialized');
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
    if (!this.project) return;
    // Create .secman directory
    const secmanDir = path.join(this.projectRoot, '.secman');
    await fsPromises.mkdir(secmanDir, { recursive: true });

    // Create environments directory
    const envDir = path.join(secmanDir, 'environments');
    await fsPromises.mkdir(envDir, { recursive: true });

    // Create environment file (encrypted)
    const envFilePath = path.join(envDir, `${environmentName}.enc`);
    await fsPromises.writeFile(envFilePath, '', { mode: 0o600 });

    // Save metadata
    const manifestPath = path.join(secmanDir, 'manifest.json');
    const manifest = {
      formatVersion: 1,
      projectId: this.project.id,
      projectName: this.project.name,
      repository: this.project.repository,
      createdAt: this.project.createdAt,
      updatedAt: this.project.updatedAt,
      environments: Array.from(this.environments.keys())
    };

    await fsPromises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  }

  /**
   * Setup project structure
   */
  private async setupProjectStructure(): Promise<void> {
    if (!this.project) return;
    const secmanDir = path.join(this.projectRoot, '.secman');
    const envDir = path.join(secmanDir, 'environments');
    const versionsDir = path.join(secmanDir, 'versions');

    await fsPromises.mkdir(secmanDir, { recursive: true });
    await fsPromises.mkdir(envDir, { recursive: true });
    await fsPromises.mkdir(path.join(secmanDir, 'keychain'), { recursive: true });
    await fsPromises.mkdir(versionsDir, { recursive: true });

    // Create .gitignore file
    await this.protectEnvFile();
  }

  /**
   * Setup encryption credentials
   */
  private async setupEncryptionCredentials(): Promise<void> {
    // In MVP, we'll use a passphrase stored in keychain
    // For now, we'll just log the requirement
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
    await fsPromises.writeFile(gitignorePath, gitignoreContent, { mode: 0o600 });
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
      const fileContent = fs.readFileSync(file, 'utf8');
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
    if (!this.project) return null;
    const defaultEnv = this.project.defaultEnvironment;
    return this.environments.get(defaultEnv) || this.environments.get(this.environments.keys().next().value || '') || null;
  }

  /**
   * Sync with GitHub
   */
  async sync(): Promise<SyncStatus> {
    if (!this.project) {
      throw new Error('Project not initialized');
    }

    // In MVP, we'll implement basic sync
    // This should:
    // 1. Load local environment data
    // 2. Compare with GitHub
    // 3. Push/pull as needed
    return {
      local: 0,
      remote: 0,
      status: 'synchronized',
      lastSync: new Date().toISOString()
    };
  }
}

export default Core;