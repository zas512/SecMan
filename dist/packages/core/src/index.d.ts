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
    encryptedData?: any;
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
export declare class Core {
    private crypto;
    private github;
    private project;
    private environments;
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Initialize a new SecMan project
     */
    init(projectName: string, environmentName: string): Promise<void>;
    /**
     * Find existing project by name
     */
    private findProject;
    /**
     * Find or create GitHub repository
     */
    private findOrCreateRepository;
    /**
     * Create a new environment
     */
    createEnvironment(projectName: string, environmentName: string): Promise<void>;
    /**
     * Save environment metadata
     */
    private saveEnvironmentMetadata;
    /**
     * Setup project structure
     */
    private setupProjectStructure;
    /**
     * Setup encryption credentials
     */
    private setupEncryptionCredentials;
    /**
     * Protect .env file with .gitignore
     */
    private protectEnvFile;
    /**
     * Discover and load .env files
     */
    loadEnvFiles(): Promise<Record<string, string>>;
    /**
     * Get current environment
     */
    getCurrentEnvironment(): EnvironmentConfig | null;
    /**
     * Get encryption passphrase and derive AES key
     */
    getEncryptionKey(projectId: string, envelope?: any): Promise<Buffer>;
    /**
     * Rollback to previous version via GitHub history (policy A)
     */
    rollback(envName: string, commit?: string): Promise<void>;
    /**
     * Conflict check: names-only comparison
     */
    checkConflict(envName: string): Promise<{
        status: 'ok' | 'conflict';
        keys: string[];
    }>;
    /**
     * Import .env file, encrypt, and save
     */
    importEnvFile(filePath: string): Promise<void>;
    /**
     * Export encrypted env file to output path
     */
    exportEnvFile(envName: string, outputPath: string): Promise<void>;
    /**
     * Push environment secrets to GitHub
     */
    push(envName: string): Promise<void>;
    /**
     * Pull environment secrets from GitHub
     */
    pull(envName: string): Promise<void>;
    /**
     * Show difference between local and remote secret names only
     */
    diff(envName: string): Promise<{
        added: string[];
        removed: string[];
        changed: string[];
    }>;
    private getPassphrase;
    private updateManifest;
    /**
     * Sync with GitHub
     */
    sync(offline?: boolean): Promise<SyncStatus>;
}
export default Core;
//# sourceMappingURL=index.d.ts.map