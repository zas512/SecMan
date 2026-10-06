import { Core } from '@secman/core';
import * as fs from 'fs';
import * as path from 'path';

describe('Core', () => {
  const tmpDir = path.join(__dirname, 'tmp_core');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
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

  it('loadEnvFiles should scope named environments and apply environment-specific overrides', async () => {
    const envDir = path.join(tmpDir, 'env_scope');
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(path.join(envDir, '.env'), 'SHARED=base\nOVERRIDE=base\n');
    fs.writeFileSync(path.join(envDir, '.env.development'), 'OVERRIDE=development\nDEV_ONLY=yes\n');
    fs.writeFileSync(path.join(envDir, '.env.production'), 'PROD_ONLY=yes\n');
    fs.writeFileSync(path.join(envDir, '.env.example'), 'EXAMPLE_ONLY=yes\n');

    const core = new Core(envDir);
    await expect(core.loadEnvFiles('development')).resolves.toEqual({
      SHARED: 'base',
      OVERRIDE: 'development',
      DEV_ONLY: 'yes'
    });
  });

  it('should restore project state from the manifest for subsequent CLI runs', () => {
    const projectDir = path.join(tmpDir, 'restored_project');
    fs.mkdirSync(path.join(projectDir, '.secman'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.secman', 'manifest.json'), JSON.stringify({
      formatVersion: 1,
      projectId: 'project-123',
      projectName: 'restored',
      repository: { owner: 'owner', repo: 'restored-secrets' },
      defaultEnvironment: 'staging',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      environments: ['staging']
    }));

    const core = new Core(projectDir);
    expect(core.getCurrentEnvironment()?.name).toBe('staging');
  });

  it('getCurrentEnvironment should return null when not initialized', () => {
    const core = new Core(tmpDir);
    expect(core.getCurrentEnvironment()).toBeNull();
  });

  it('sync should throw when project not initialized', async () => {
    const core = new Core(tmpDir);
    await expect(core.sync()).rejects.toThrow('Project not initialized');
  });
});
