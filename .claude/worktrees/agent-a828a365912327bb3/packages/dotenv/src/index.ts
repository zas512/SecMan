// Dotenv module for SecMan
// Handles .env parsing and generation

import * as fs from 'fs';
import * as path from 'path';

export interface DotenvParseResult {
  [key: string]: string;
}

export interface DotenvConfig {
  path?: string;
  encoding?: BufferEncoding;
}

/**
 * Parse a .env file content into key-value pairs
 */
export function parse(content: string): DotenvParseResult {
  const result: DotenvParseResult = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Find the first equals sign
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      // Malformed line - no equals sign
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Handle quoted values
    if (value.length >= 2) {
      const firstChar = value[0];
      const lastChar = value[value.length - 1];
      if ((firstChar === '"' && lastChar === '"') ||
          (firstChar === "'" && lastChar === "'")) {
        value = value.slice(1, -1);
      }
    }

    // Handle multiline values (not in MVP, but placeholder)
    // This is a simplified version

    if (key) {
      // Handle duplicate keys - last one wins (standard dotenv behavior)
      result[key] = value;
    }
  }

  return result;
}

/**
 * Serialize key-value pairs to .env format
 */
export function serialize(env: DotenvParseResult): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    // Quote values that contain spaces, special chars, or are empty
    const needsQuotes = /[\s#]/.test(value) || value === '' ||
                        value.includes('\n') || value.startsWith('"') ||
                        value.startsWith("'");

    if (needsQuotes) {
      // Escape existing quotes
      const escaped = value.replace(/"/g, '\\"');
      lines.push(`${key}="${escaped}"`);
    } else {
      lines.push(`${key}=${value}`);
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Load .env file from path
 */
export function load(filePath: string): DotenvParseResult {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    return {};
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  return parse(content);
}

/**
 * Write .env file to path
 */
export function write(filePath: string, env: DotenvParseResult): void {
  const content = serialize(env);
  fs.writeFileSync(filePath, content, { mode: 0o600 });
}

/**
 * Merge two env objects, later values override earlier
 */
export function merge(base: DotenvParseResult, override: DotenvParseResult): DotenvParseResult {
  return { ...base, ...override };
}

/**
 * Get difference between two env objects
 * Returns: { added: [], removed: [], changed: [], unchanged: [] }
 */
export function diff(
  local: DotenvParseResult,
  remote: DotenvParseResult
): {
  added: string[];
  removed: string[];
  changed: string[];
  unchanged: string[];
} {
  const localKeys = new Set(Object.keys(local));
  const remoteKeys = new Set(Object.keys(remote));
  const allKeys = new Set([...localKeys, ...remoteKeys]);

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];

  for (const key of allKeys) {
    const hasLocal = localKeys.has(key);
    const hasRemote = remoteKeys.has(key);

    if (hasLocal && !hasRemote) {
      added.push(key);
    } else if (!hasLocal && hasRemote) {
      removed.push(key);
    } else if (local[key] !== remote[key]) {
      changed.push(key);
    } else {
      unchanged.push(key);
    }
  }

  return { added, removed, changed, unchanged };
}

/**
 * Get all known env file paths for a project
 */
export function discoverEnvFiles(projectRoot: string): string[] {
  const knownFiles = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.development.local',
    '.env.test',
    '.env.test.local',
    '.env.production',
    '.env.production.local',
    '.env.staging',
    '.env.staging.local',
    '.env.example'
  ];

  return knownFiles
    .map(f => path.join(projectRoot, f))
    .filter(f => fs.existsSync(f));
}

export default { parse, serialize, load, write, merge, diff, discoverEnvFiles };