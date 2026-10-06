import { Core } from '@secman/core';
import { cryptoInstance } from '@secman/crypto';
import { GitHubClient } from '@secman/github';
import { keychainInstance } from '@secman/keychain';
import * as fs from 'fs';
import * as path from 'path';

describe('Core', () => {
  const tmpDir = path.join(__dirname, 'tmp_core');
  let originalGitHubToken: string | undefined;
  let originalPassphrase: string | undefined;

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  beforeEach(() => {
    originalGitHubToken = process.env.GITHUB_TOKEN;
    originalPassphrase = process.env.SECMAN_PASSPHRASE;
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalGitHubToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = originalGitHubToken;
    if (originalPassphrase === undefined) delete process.env.SECMAN_PASSPHRASE;
    else process.env.SECMAN_PASSPHRASE = originalPassphrase;
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should initialize with new Core', () => {
    const core = new Core(tmpDir);
    expect(core).toBeDefined();
  });

  it('loadEnvFiles should return empty when no .env exists', async () => {
    const core = new Core(tmpDir);
    const result = await core.loadEnvFiles();
    expect(result).toEqual({});
  });

  it('loadEnvFiles should discover arbitrary environment names without loading examples or other environments', async () => {
    const envDir = path.join(tmpDir, 'env_scope');
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(path.join(envDir, '.env'), 'SHARED=base\nOVERRIDE=base\n');
    fs.writeFileSync(path.join(envDir, '.env.qa'), 'OVERRIDE=qa\nQA_ONLY=yes\n');
    fs.writeFileSync(path.join(envDir, '.env.production'), 'PROD_ONLY=yes\n');
    fs.writeFileSync(path.join(envDir, '.env.example'), 'EXAMPLE_ONLY=yes\n');

    const core = new Core(envDir);
    await expect(core.loadEnvFiles('qa')).resolves.toEqual({
      SHARED: 'base',
      OVERRIDE: 'qa',
      QA_ONLY: 'yes'
    });
  });

  it('should restore project state from the manifest for subsequent CLI runs', () => {
    const projectDir = createProjectDir('restored_project');
    writeProjectManifest(projectDir, 'staging');

    const core = new Core(projectDir);
    expect(core.getCurrentEnvironment()?.name).toBe('staging');
  });

  it('should reject malformed persisted manifests', () => {
    const projectDir = createProjectDir('malformed_manifest');
    fs.writeFileSync(path.join(projectDir, '.secman', 'manifest.json'), '{"environments":[]}');

    expect(() => new Core(projectDir)).toThrow('Invalid manifest.json structure');
  });

  it('init should persist project metadata and create a private repository', async () => {
    const projectDir = createProjectDir('init_project');
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.SECMAN_PASSPHRASE = 'test-passphrase';
    jest.spyOn(GitHubClient.prototype, 'getAuthStatus').mockResolvedValue({
      authenticated: true,
      user: 'test-user'
    });
    jest.spyOn(GitHubClient.prototype, 'getRepository').mockResolvedValue(null);
    jest.spyOn(GitHubClient.prototype, 'createPrivateRepository').mockResolvedValue({
      owner: 'test-user',
      repo: 'demo-secrets',
      private: true,
      url: 'https://github.com/test-user/demo-secrets'
    });
    jest.spyOn(keychainInstance, 'getEncryptionCredential').mockResolvedValue(null);
    const storeCredential = jest.spyOn(keychainInstance, 'storeEncryptionCredential').mockResolvedValue();

    const core = new Core(projectDir);
    await core.init('demo', 'qa');

    const manifest = JSON.parse(fs.readFileSync(path.join(projectDir, '.secman', 'manifest.json'), 'utf8'));
    const projectConfig = fs.readFileSync(path.join(projectDir, '.secman.yaml'), 'utf8');
    expect(manifest.repository).toEqual({ owner: 'test-user', repo: 'demo-secrets' });
    expect(projectConfig).toContain('name: demo-secrets');
    expect(storeCredential).toHaveBeenCalledWith(expect.objectContaining({
      projectId: manifest.projectId,
      passphrase: 'test-passphrase'
    }));
    expect(GitHubClient.prototype.createPrivateRepository).toHaveBeenCalledWith('demo-secrets');
  });

  it('push should encrypt the selected custom environment and upload its envelope', async () => {
    const projectDir = createProjectDir('push_project');
    writeProjectManifest(projectDir, 'qa');
    fs.writeFileSync(path.join(projectDir, '.env'), 'SHARED=base\n');
    fs.writeFileSync(path.join(projectDir, '.env.qa'), 'QA_ONLY=yes\n');
    process.env.GITHUB_TOKEN = 'test-token';
    jest.spyOn(keychainInstance, 'getEncryptionCredential').mockResolvedValue({
      projectId: 'project-123',
      passphrase: 'test-passphrase',
      createdAt: '2025-01-01T00:00:00.000Z'
    });
    jest.spyOn(cryptoInstance, 'createEnvelope').mockResolvedValue({
      formatVersion: 1,
      encryptionVersion: 1,
      algorithm: 'test',
      salt: '',
      nonce: '',
      ciphertext: 'encrypted',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    });
    const upload = jest.spyOn(GitHubClient.prototype, 'createOrUpdateFile').mockResolvedValue({
      sha: 'sha123',
      url: 'https://github.com/owner/project-secrets'
    });

    await new Core(projectDir).push('qa');

    const uploaded = JSON.parse(upload.mock.calls[0][4]);
    expect(upload).toHaveBeenCalledWith('owner', 'project-secrets', '.secman/environments/qa.enc',
      'Update secrets for qa', expect.any(String));
    expect(uploaded.ciphertext).toBe('encrypted');
    expect(cryptoInstance.createEnvelope).toHaveBeenCalledWith(
      Buffer.from(JSON.stringify({ SHARED: 'base', QA_ONLY: 'yes' }), 'utf8'),
      'test-passphrase'
    );
  });

  it('pull should replace the selected environment file with verified remote values', async () => {
    const projectDir = createProjectDir('pull_project');
    writeProjectManifest(projectDir, 'qa');
    fs.writeFileSync(path.join(projectDir, '.env'), 'SHARED=keep-common\n');
    fs.writeFileSync(path.join(projectDir, '.env.qa'), 'LOCAL_ONLY=remove\nREMOTE=old\n');
    process.env.GITHUB_TOKEN = 'test-token';
    jest.spyOn(keychainInstance, 'getEncryptionCredential').mockResolvedValue({
      projectId: 'project-123',
      passphrase: 'test-passphrase',
      createdAt: '2025-01-01T00:00:00.000Z'
    });
    jest.spyOn(GitHubClient.prototype, 'getFile').mockResolvedValue({
      content: JSON.stringify({ formatVersion: 1, ciphertext: 'encrypted' }),
      sha: 'sha123'
    });
    jest.spyOn(cryptoInstance, 'validateIntegrity').mockReturnValue(true);
    jest.spyOn(cryptoInstance, 'openEnvelope').mockResolvedValue(Buffer.from('{"REMOTE":"new","REMOTE_ONLY":"yes"}'));

    await new Core(projectDir).pull('qa');

    expect(fs.readFileSync(path.join(projectDir, '.env.qa'), 'utf8')).toBe('REMOTE=new\nREMOTE_ONLY=yes\n');
    expect(fs.readFileSync(path.join(projectDir, '.env'), 'utf8')).toBe('SHARED=keep-common\n');
  });

  it('getCurrentEnvironment should return null when not initialized', () => {
    const core = new Core(tmpDir);
    expect(core.getCurrentEnvironment()).toBeNull();
  });

  it('sync should throw when project not initialized', async () => {
    const core = new Core(tmpDir);
    await expect(core.sync()).rejects.toThrow('Project not initialized');
  });

  function createProjectDir(name: string): string {
    const projectDir = path.join(tmpDir, name);
    fs.rmSync(projectDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(projectDir, '.secman'), { recursive: true });
    return projectDir;
  }

  function writeProjectManifest(projectDir: string, environmentName: string): void {
    fs.writeFileSync(path.join(projectDir, '.secman', 'manifest.json'), JSON.stringify({
      formatVersion: 1,
      projectId: 'project-123',
      projectName: 'project',
      repository: { owner: 'owner', repo: 'project-secrets' },
      defaultEnvironment: environmentName,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      environments: [environmentName]
    }));
  }
});
