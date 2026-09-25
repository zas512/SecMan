"use strict";
// Core module for SecMan
// Handles project, environment, secret management, and sync orchestration
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Core = void 0;
const crypto_1 = require("@secman/crypto");
const github_1 = require("@secman/github");
const dotenv_1 = require("@secman/dotenv");
const fs = __importStar(require("fs"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class Core {
    constructor(projectRoot) {
        this.project = null;
        this.environments = new Map();
        this.projectRoot = projectRoot;
        this.crypto = crypto_1.cryptoInstance;
        this.github = new github_1.GitHubClient();
    }
    /**
     * Initialize a new SecMan project
     */
    async init(projectName, environmentName) {
        // Check if project already exists
        const existingProject = this.findProject(projectName);
        if (existingProject) {
            throw new Error(`Project "${projectName}" already exists`);
        }
        // Find GitHub repository
        const repoConfig = await this.findOrCreateRepository(projectName);
        // Initialize project config
        this.project = {
            id: crypto_1.cryptoInstance.generateSalt().toString('hex'), // Use crypto's salt generator for ID
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
    findProject(projectName) {
        // In MVP, project ID is stored in manifest.json
        // For now, we'll implement basic detection
        return null;
    }
    /**
     * Find or create GitHub repository
     */
    async findOrCreateRepository(projectName) {
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
    async createEnvironment(projectName, environmentName) {
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
    async saveEnvironmentMetadata(projectName, environmentName) {
        if (!this.project)
            return;
        // Create .secman directory
        const secmanDir = path_1.default.join(this.projectRoot, '.secman');
        await fs_1.promises.mkdir(secmanDir, { recursive: true });
        // Create environments directory
        const envDir = path_1.default.join(secmanDir, 'environments');
        await fs_1.promises.mkdir(envDir, { recursive: true });
        // Create environment file (encrypted)
        const envFilePath = path_1.default.join(envDir, `${environmentName}.enc`);
        await fs_1.promises.writeFile(envFilePath, '', { mode: 0o600 });
        // Save metadata
        const manifestPath = path_1.default.join(secmanDir, 'manifest.json');
        const manifest = {
            formatVersion: 1,
            projectId: this.project.id,
            projectName: this.project.name,
            repository: this.project.repository,
            createdAt: this.project.createdAt,
            updatedAt: this.project.updatedAt,
            environments: Array.from(this.environments.keys())
        };
        await fs_1.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    }
    /**
     * Setup project structure
     */
    async setupProjectStructure() {
        if (!this.project)
            return;
        const secmanDir = path_1.default.join(this.projectRoot, '.secman');
        const envDir = path_1.default.join(secmanDir, 'environments');
        const versionsDir = path_1.default.join(secmanDir, 'versions');
        await fs_1.promises.mkdir(secmanDir, { recursive: true });
        await fs_1.promises.mkdir(envDir, { recursive: true });
        await fs_1.promises.mkdir(path_1.default.join(secmanDir, 'keychain'), { recursive: true });
        await fs_1.promises.mkdir(versionsDir, { recursive: true });
        // Create .gitignore file
        await this.protectEnvFile();
    }
    /**
     * Setup encryption credentials
     */
    async setupEncryptionCredentials() {
        // In MVP, we'll use a passphrase stored in keychain
        // For now, we'll just log the requirement
    }
    /**
     * Protect .env file with .gitignore
     */
    async protectEnvFile() {
        const gitignorePath = path_1.default.join(this.projectRoot, '.gitignore');
        const gitignoreContent = `.env
.env.*
!.env.example
`;
        await fs_1.promises.writeFile(gitignorePath, gitignoreContent, { mode: 0o600 });
    }
    /**
     * Discover and load .env files
     */
    async loadEnvFiles() {
        const envFiles = (0, dotenv_1.discoverEnvFiles)(this.projectRoot);
        if (envFiles.length === 0) {
            return {};
        }
        let result = {};
        for (const file of envFiles) {
            const fileContent = fs.readFileSync(file, 'utf8');
            const parsed = (0, dotenv_1.parse)(fileContent);
            result = (0, dotenv_1.merge)(result, parsed);
        }
        return result;
    }
    /**
     * Get current environment
     */
    getCurrentEnvironment() {
        // In MVP, we need to determine current environment
        // For now, return first environment or default
        if (this.environments.size === 0)
            return null;
        if (!this.project)
            return null;
        const defaultEnv = this.project.defaultEnvironment;
        return this.environments.get(defaultEnv) || this.environments.get(this.environments.keys().next().value || '') || null;
    }
    /**
     * Sync with GitHub
     */
    async sync() {
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
exports.Core = Core;
exports.default = Core;
//# sourceMappingURL=index.js.map