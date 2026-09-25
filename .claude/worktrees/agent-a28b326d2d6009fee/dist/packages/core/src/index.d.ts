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
     * Sync with GitHub
     */
    sync(): Promise<SyncStatus>;
}
export default Core;
//# sourceMappingURL=index.d.ts.map