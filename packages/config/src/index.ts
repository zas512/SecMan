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
  repository?: {
    owner: string;
    repo: string;
  };
  defaultEnvironment?: string;
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

  let manifest: unknown;
  try {
    const content = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse manifest.json: ${(e as Error).message}`);
  }
  if (!validateManifest(manifest)) {
    throw new Error('Invalid manifest.json structure');
  }
  return manifest;
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
export function validateManifest(manifest: unknown): manifest is ManifestConfig {
  if (!manifest || typeof manifest !== 'object') return false;
  const candidate = manifest as Record<string, unknown>;
  return (
    typeof candidate.formatVersion === 'number' &&
    typeof candidate.projectId === 'string' &&
    candidate.projectId.length > 0 &&
    typeof candidate.projectName === 'string' &&
    candidate.projectName.length > 0 &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    Array.isArray(candidate.environments) &&
    candidate.environments.every(environment => typeof environment === 'string') &&
    (candidate.repository === undefined ||
      (typeof candidate.repository === 'object' &&
        candidate.repository !== null &&
        typeof (candidate.repository as Record<string, unknown>).owner === 'string' &&
        typeof ((candidate.repository as Record<string, unknown>).repo ??
          (candidate.repository as Record<string, unknown>).name) === 'string')) &&
    (candidate.defaultEnvironment === undefined || typeof candidate.defaultEnvironment === 'string')
  );
}

export default { loadProjectConfig, saveProjectConfig, loadManifest, saveManifest, validateManifest };