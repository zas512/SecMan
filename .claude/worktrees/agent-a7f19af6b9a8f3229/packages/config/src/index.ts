// Config module for SecMan
// Handles .secman.yaml and manifest validation

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface ProjectConfig {
  version: number;
  project: string;
  repository: {
    owner: string;
    name: string;
  };
  defaultEnvironment: string;
  environments: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ManifestConfig {
  formatVersion: number;
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  environments: string[];
  encryption?: {
    version: number;
    algorithm: string;
  };
}

/**
 * Load project configuration from .secman.yaml
 */
export function loadProjectConfig(projectRoot: string): ProjectConfig | null {
  const configPath = path.join(projectRoot, '.secman.yaml');
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(content) as ProjectConfig;
    return config;
  } catch (e) {
    throw new Error(`Failed to parse .secman.yaml: ${(e as Error).message}`);
  }
}

/**
 * Save project configuration to .secman.yaml
 */
export function saveProjectConfig(projectRoot: string, config: ProjectConfig): void {
  const configPath = path.join(projectRoot, '.secman.yaml');
  const content = yaml.dump(config, { quotingType: '"' });
  fs.writeFileSync(configPath, content, { mode: 0o600 });
}

/**
 * Load manifest from .secman/manifest.json
 */
export function loadManifest(projectRoot: string): ManifestConfig | null {
  const manifestPath = path.join(projectRoot, '.secman', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(content) as ManifestConfig;
    return manifest;
  } catch (e) {
    throw new Error(`Failed to parse manifest.json: ${(e as Error).message}`);
  }
}

/**
 * Save manifest to .secman/manifest.json
 */
export function saveManifest(projectRoot: string, manifest: ManifestConfig): void {
  const manifestPath = path.join(projectRoot, '.secman', 'manifest.json');
  const dir = path.dirname(manifestPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), { mode: 0o600 });
}

/**
 * Validate manifest structure
 */
export function validateManifest(manifest: any): manifest is ManifestConfig {
  return (
    typeof manifest === 'object' &&
    typeof manifest.formatVersion === 'number' &&
    typeof manifest.projectId === 'string' &&
    typeof manifest.projectName === 'string' &&
    typeof manifest.createdAt === 'string' &&
    typeof manifest.updatedAt === 'string' &&
    Array.isArray(manifest.environments)
  );
}

export default { loadProjectConfig, saveProjectConfig, loadManifest, saveManifest, validateManifest };