export interface Credential {
    account: string;
    password: string;
}
export interface GitHubToken {
    token: string;
    scope?: string;
    createdAt: string;
    expiresAt?: string;
}
export interface EncryptionCredential {
    projectId: string;
    passphrase: string;
    createdAt: string;
}
export declare class Keychain {
    /**
     * Store GitHub authentication token
     */
    storeGitHubToken(token: GitHubToken): Promise<void>;
    /**
     * Retrieve GitHub authentication token
     */
    getGitHubToken(): Promise<GitHubToken | null>;
    /**
     * Delete GitHub authentication token
     */
    deleteGitHubToken(): Promise<boolean>;
    /**
     * Store encryption passphrase for a project
     */
    storeEncryptionCredential(credential: EncryptionCredential): Promise<void>;
    /**
     * Retrieve encryption passphrase for a project
     */
    getEncryptionCredential(projectId: string): Promise<EncryptionCredential | null>;
    /**
     * Delete encryption credential for a project
     */
    deleteEncryptionCredential(projectId: string): Promise<boolean>;
    /**
     * Store generic credential
     */
    storeCredential(credential: Credential): Promise<void>;
    /**
     * Retrieve generic credential
     */
    getCredential(account: string): Promise<string | null>;
    /**
     * Delete generic credential
     */
    deleteCredential(account: string): Promise<boolean>;
    /**
     * Check if keychain is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * List all credentials for this service
     */
    listCredentials(): Promise<any[]>;
}
export declare const keychainInstance: Keychain;
export default Keychain;
//# sourceMappingURL=index.d.ts.map