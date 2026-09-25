"use strict";
// GitHub module for SecMan
// Handles authentication, repository creation, file operations, commits
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubClient = void 0;
const rest_1 = require("@octokit/rest");
class GitHubClient {
    constructor(config = {}) {
        this.config = config;
        this.octokit = new rest_1.Octokit({ auth: config.token || undefined });
    }
    /**
     * Check authentication status
     */
    async getAuthStatus() {
        try {
            const { data } = await this.octokit.rest.users.getAuthenticated();
            return { authenticated: true, user: data.login };
        }
        catch (e) {
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
    async repositoryExists(owner, repo) {
        try {
            await this.octokit.rest.repos.get({ owner, repo });
            return true;
        }
        catch (e) {
            if (e.status === 404)
                return false;
            throw e;
        }
    }
    /**
     * Create a new private repository
     */
    async createPrivateRepository(name, description) {
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
    async getRepository(owner, repo) {
        try {
            const { data } = await this.octokit.rest.repos.get({ owner, repo });
            return {
                owner: data.owner.login,
                repo: data.name,
                private: data.private,
                url: data.html_url
            };
        }
        catch (e) {
            if (e.status === 404)
                return null;
            throw e;
        }
    }
    /**
     * Get file content from repository
     */
    async getFile(owner, repo, path) {
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner,
                repo,
                path,
                ref: 'main'
            });
            if (Array.isArray(data) || !('content' in data))
                return null;
            return {
                content: Buffer.from(data.content, 'base64').toString('utf8'),
                sha: data.sha
            };
        }
        catch (e) {
            if (e.status === 404)
                return null;
            throw e;
        }
    }
    /**
     * Create or update file in repository
     */
    async createOrUpdateFile(owner, repo, path, message, content, sha) {
        const params = {
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
            sha: data.content?.sha || '',
            url: data.content?.html_url || ''
        };
    }
    /**
     * List commits in repo
     */
    async listCommits(owner, repo, limit = 10) {
        const { data } = await this.octokit.rest.repos.listCommits({
            owner,
            repo,
            per_page: limit,
            sha: 'main'
        });
        return data.map((c) => ({
            sha: c.sha,
            message: c.commit.message,
            author: c.commit.author?.name,
            date: c.commit.author?.date
        }));
    }
    /**
     * Delete file in repository
     */
    async deleteFile(owner, repo, path, message, sha) {
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
exports.GitHubClient = GitHubClient;
exports.default = GitHubClient;
//# sourceMappingURL=index.js.map