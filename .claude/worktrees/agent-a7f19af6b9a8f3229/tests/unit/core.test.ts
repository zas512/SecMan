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

  it('getCurrentEnvironment should return null when not initialized', () => {
    const core = new Core(tmpDir);
    expect(core.getCurrentEnvironment()).toBeNull();
  });

  it('sync should throw when project not initialized', async () => {
    const core = new Core(tmpDir);
    await expect(core.sync()).rejects.toThrow('Project not initialized');
  });
});
