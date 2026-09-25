"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("@secman/github");
class MockOctokit {
    constructor() {
        this.rest = {
            users: {
                getAuthenticated: jest.fn().mockResolvedValue({ data: { login: 'testuser' } })
            },
            repos: {
                get: jest.fn(),
                createForAuthenticatedUser: jest.fn().mockResolvedValue({
                    data: { owner: { login: 'testuser' }, name: 'test-repo', private: true, html_url: 'https://github.com/testuser/test-repo' }
                }),
                getContent: jest.fn(),
                createOrUpdateFileContents: jest.fn().mockResolvedValue({
                    data: { content: { sha: 'sha123', html_url: 'https://github.com/testuser/test-repo/file' } }
                }),
                listCommits: jest.fn().mockResolvedValue({
                    data: [
                        { sha: 'abc', commit: { message: 'init', author: { name: 'Dev', date: '2024-01-01' } } }
                    ]
                }),
                deleteFile: jest.fn().mockResolvedValue({})
            }
        };
    }
}
describe('GitHubClient', () => {
    let client;
    let mockOctokit;
    beforeEach(() => {
        mockOctokit = new MockOctokit();
        // Override internal octokit by constructing with config that uses mock
        // Since Octokit is instantiated inside constructor, we mock via jest spy on module level
        github_1.GitHubClient.prototype.constructor = function (config) {
            this.octokit = mockOctokit;
            this.config = config || {};
        };
        client = new github_1.GitHubClient({ token: 'fake' });
    });
    it('getAuthStatus should return authenticated user', async () => {
        mockOctokit.rest.users.getAuthenticated.mockResolvedValue({ data: { login: 'alice' } });
        const status = await client.getAuthStatus();
        expect(status.authenticated).toBe(true);
        expect(status.user).toBe('alice');
    });
    it('repositoryExists should return true when repo exists', async () => {
        mockOctokit.rest.repos.get.mockResolvedValue({ data: {} });
        expect(await client.repositoryExists('o', 'r')).toBe(true);
    });
    it('repositoryExists should return false on 404', async () => {
        const err = new Error('not found');
        err.status = 404;
        mockOctokit.rest.repos.get.mockRejectedValue(err);
        expect(await client.repositoryExists('o', 'r')).toBe(false);
    });
    it('createPrivateRepository should return info', async () => {
        const info = await client.createPrivateRepository('new-repo');
        expect(info.repo).toBe('new-repo');
    });
    it('getFile should return content', async () => {
        mockOctokit.rest.repos.getContent.mockResolvedValue({
            data: { content: Buffer.from('hello').toString('base64'), sha: 'sha1' }
        });
        const file = await client.getFile('o', 'r', 'path');
        expect(file.content).toBe('hello');
    });
    it('createOrUpdateFile should return sha/url', async () => {
        const result = await client.createOrUpdateFile('o', 'r', 'f', 'msg', 'hello');
        expect(result.sha).toBe('sha123');
    });
    it('listCommits should return commit list', async () => {
        const commits = await client.listCommits('o', 'r', 5);
        expect(commits.length).toBe(1);
        expect(commits[0].sha).toBe('abc');
    });
    it('deleteFile should call delete', async () => {
        await client.deleteFile('o', 'r', 'f', 'msg', 'sha1');
        expect(mockOctokit.rest.repos.deleteFile).toHaveBeenCalled();
    });
});
//# sourceMappingURL=github.test.js.map