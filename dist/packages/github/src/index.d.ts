export interface GitHubConfig {
    token?: string;
    owner?: string;
    repo?: string;
}
export interface RepositoryInfo {
    owner: string;
    repo: string;
    private: boolean;
    url: string;
}
export declare class GitHubClient {
    private octokit;
    private config;
    constructor(config?: GitHubConfig);
    /**
     * Check authentication status
     */
    getAuthStatus(): Promise<{
        authenticated: boolean;
        user?: string;
        error?: string;
    }>;
    /**
     * Check if a repository exists
     */
    repositoryExists(owner: string, repo: string): Promise<boolean>;
    /**
     * Create a new private repository
     */
    createPrivateRepository(name: string, description?: string): Promise<RepositoryInfo>;
    /**
     * Get repository info
     */
    getRepository(owner: string, repo: string): Promise<RepositoryInfo | null>;
    /**
     * Get file content from repository
     */
    getFile(owner: string, repo: string, path: string): Promise<{
        content: string;
        sha: string;
    } | null>;
    /**
     * Create or update file in repository
     */
    createOrUpdateFile(owner: string, repo: string, path: string, message: string, content: string, sha?: string): Promise<{
        sha: string;
        url: string;
    }>;
    /**
     * List commits in repo
     */
    listCommits(owner: string, repo: string, limit?: number): Promise<{
        sha: any;
        message: any;
        author: any;
        date: any;
    }[]>;
    /**
     * Delete file in repository
     */
    deleteFile(owner: string, repo: string, path: string, message: string, sha: string): Promise<void>;
}
export default GitHubClient;
//# sourceMappingURL=index.d.ts.map