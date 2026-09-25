// GitHub module for SecMan
// Handles authentication, repository creation, file operations, commits

import { Octokit } from '@octokit/rest';

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

export class GitHubClient {
  private octokit: Octokit;
  private config: GitHubConfig;

  constructor(config: GitHubConfig = {}) {
    this.config = config;
    this.octokit = new Octokit({ auth: config.token || undefined });
  }

  /**
   * Check authentication status
   */
  async getAuthStatus(): Promise<{ authenticated: boolean; user?: string; error?: string }> {
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated();
      return { authenticated: true, user: data.login };
    } catch (e: any) {
      const status = e?.status || e?.response?.status;
      if (status === 401 || status === 403) {
        return { authenticated: false, error: 'Authentication failed (401/403)' };
      }
      // Network errors, rate limits, or authorization errors
      return { authenticated: false, error: `GitHub error (${status || 'unknown'}): ${e?.message || e}` };
    }
  }

  /**
   * Check if a repository exists
   */
  async repositoryExists(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.get({ owner, repo });
      return true;
    } catch (e: any) {
      if (e.status === 404) return false;
      throw e;
    }
  }

  /**
   * Create a new private repository
   */
  async createPrivateRepository(name: string, description?: string): Promise<RepositoryInfo> {
    const response = await this.octokit.rest.repos.createForAuthenticatedUser({
      name,
      private: true,
      description: description || `SecMan secrets repository`,
      auto_init: true // Initialize with a README
    });

    return {
      owner: response.data.owner.login,
      repo: response.data.name,
      private: true,
      url: response.data.html_url
    };
  }

  /**
   * Get repository info
   */
  async getRepository(owner: string, repo: string): Promise<RepositoryInfo | null> {
    try {
      const { data } = await this.octokit.rest.repos.get({ owner, repo });
      return {
        owner: data.owner.login,
        repo: data.name,
        private: data.private,
        url: data.html_url
      };
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  /**
   * Get file content from repository
   */
  async getFile(owner: string, repo: string, path: string): Promise<{ content: string; sha: string } | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: 'main'
      });

      if (Array.isArray(data) || !('content' in data)) return null;
      return {
        content: Buffer.from(data.content, 'base64').toString('utf8'),
        sha: data.sha
      };
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  /**
   * Create or update file in repository
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    message: string,
    content: string,
    sha?: string
  ): Promise<{ sha: string; url: string }> {
    const params: any = {
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch: 'main'
    };

    if (sha) {
      params.sha = sha;
    }

    const { data } = await this.octokit.rest.repos.createOrUpdateFileContents(params);
    return {
      sha: (data as any).content?.sha || '',
      url: (data as any).content?.html_url || ''
    };
  }

  /**
   * List commits in repo
   */
  async listCommits(owner: string, repo: string, limit: number = 10) {
    const { data } = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: limit,
      sha: 'main'
    });
    return data.map((c: any) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author?.name,
      date: c.commit.author?.date
    }));
  }

  /**
   * Delete file in repository
   */
  async deleteFile(owner: string, repo: string, path: string, message: string, sha: string) {
    await this.octokit.rest.repos.deleteFile({
      owner,
      repo,
      path,
      message,
      sha,
      branch: 'main'
    });
  }
}

export default GitHubClient;