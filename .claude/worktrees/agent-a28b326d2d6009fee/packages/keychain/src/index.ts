// Keychain module for SecMan
// Handles OS credential storage integration

import * as keytar from 'keytar';

const SERVICE_NAME = 'secman';

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

export class Keychain {
  /**
   * Store GitHub authentication token
   */
  async storeGitHubToken(token: GitHubToken): Promise<void> {
    const account = 'github-token';
    await keytar.setPassword(SERVICE_NAME, account, JSON.stringify(token));
  }

  /**
   * Retrieve GitHub authentication token
   */
  async getGitHubToken(): Promise<GitHubToken | null> {
    const account = 'github-token';
    const stored = await keytar.getPassword(SERVICE_NAME, account);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as GitHubToken;
    } catch {
      return null;
    }
  }

  /**
   * Delete GitHub authentication token
   */
  async deleteGitHubToken(): Promise<boolean> {
    const account = 'github-token';
    return keytar.deletePassword(SERVICE_NAME, account);
  }

  /**
   * Store encryption passphrase for a project
   */
  async storeEncryptionCredential(credential: EncryptionCredential): Promise<void> {
    const account = `encryption-${credential.projectId}`;
    await keytar.setPassword(SERVICE_NAME, account, JSON.stringify(credential));
  }

  /**
   * Retrieve encryption passphrase for a project
   */
  async getEncryptionCredential(projectId: string): Promise<EncryptionCredential | null> {
    const account = `encryption-${projectId}`;
    const stored = await keytar.getPassword(SERVICE_NAME, account);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as EncryptionCredential;
    } catch {
      return null;
    }
  }

  /**
   * Delete encryption credential for a project
   */
  async deleteEncryptionCredential(projectId: string): Promise<boolean> {
    const account = `encryption-${projectId}`;
    return keytar.deletePassword(SERVICE_NAME, account);
  }

  /**
   * Store generic credential
   */
  async storeCredential(credential: Credential): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, credential.account, credential.password);
  }

  /**
   * Retrieve generic credential
   */
  async getCredential(account: string): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, account);
  }

  /**
   * Delete generic credential
   */
  async deleteCredential(account: string): Promise<boolean> {
    return keytar.deletePassword(SERVICE_NAME, account);
  }

  /**
   * Check if keychain is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await keytar.findCredentials(SERVICE_NAME);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all credentials for this service
   */
  async listCredentials(): Promise<keytar.Credential[]> {
    return keytar.findCredentials(SERVICE_NAME);
  }
}

export const keychainInstance = new Keychain();
export default Keychain;