import { loadProjectConfig, saveProjectConfig, loadManifest, saveManifest, validateManifest } from '@secman/config';
import * as fs from 'fs';
import * as path from 'path';

describe('Config', () => {
  const tmpDir = path.join(__dirname, 'tmp_config');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('loadProjectConfig / saveProjectConfig', () => {
    it('should save and load project config', () => {
      const config = {
        version: 1,
        project: 'test',
        repository: { owner: 'me', name: 'repo' },
        defaultEnvironment: 'dev',
        environments: ['dev', 'prod']
      };
      saveProjectConfig(tmpDir, config as any);
      const loaded = loadProjectConfig(tmpDir);
      expect(loaded).not.toBeNull();
      expect(loaded!.project).toBe('test');
    });
  });

  describe('loadManifest / saveManifest', () => {
    it('should save and load manifest', () => {
      const manifest = {
        formatVersion: 1,
        projectId: '123',
        projectName: 'proj',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        environments: ['dev']
      };
      saveManifest(tmpDir, manifest as any);
      const loaded = loadManifest(tmpDir);
      expect(loaded).not.toBeNull();
      expect(loaded!.projectName).toBe('proj');
    });
  });

  describe('validateManifest', () => {
    it('should return true for valid manifest', () => {
      const m = { formatVersion: 1, projectId: '1', projectName: 'p', createdAt: '', updatedAt: '', environments: [] };
      expect(validateManifest(m)).toBe(true);
    });

    it('should return false for missing fields', () => {
      expect(validateManifest({})).toBe(false);
    });

    it('should return false for invalid types', () => {
      expect(validateManifest({ formatVersion: 'one', projectId: 1, projectName: 'p', createdAt: '', updatedAt: '', environments: [] })).toBe(false);
    });
  });
});
