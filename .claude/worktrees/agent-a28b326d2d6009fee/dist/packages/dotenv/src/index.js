"use strict";
// Dotenv module for SecMan
// Handles .env parsing and generation
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
exports.serialize = serialize;
exports.load = load;
exports.write = write;
exports.merge = merge;
exports.diff = diff;
exports.discoverEnvFiles = discoverEnvFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Parse a .env file content into key-value pairs
 */
function parse(content) {
    const result = {};
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
function serialize(env) {
    const lines = [];
    for (const [key, value] of Object.entries(env)) {
        // Quote values that contain spaces, special chars, or are empty
        const needsQuotes = /[\s#]/.test(value) || value === '' ||
            value.includes('\n') || value.startsWith('"') ||
            value.startsWith("'");
        if (needsQuotes) {
            // Escape existing quotes
            const escaped = value.replace(/"/g, '\\"');
            lines.push(`${key}="${escaped}"`);
        }
        else {
            lines.push(`${key}=${value}`);
        }
    }
    return lines.join('\n') + '\n';
}
/**
 * Load .env file from path
 */
function load(filePath) {
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
function write(filePath, env) {
    const content = serialize(env);
    fs.writeFileSync(filePath, content, { mode: 0o600 });
}
/**
 * Merge two env objects, later values override earlier
 */
function merge(base, override) {
    return { ...base, ...override };
}
/**
 * Get difference between two env objects
 * Returns: { added: [], removed: [], changed: [], unchanged: [] }
 */
function diff(local, remote) {
    const localKeys = new Set(Object.keys(local));
    const remoteKeys = new Set(Object.keys(remote));
    const allKeys = new Set([...localKeys, ...remoteKeys]);
    const added = [];
    const removed = [];
    const changed = [];
    const unchanged = [];
    for (const key of allKeys) {
        const hasLocal = localKeys.has(key);
        const hasRemote = remoteKeys.has(key);
        if (hasLocal && !hasRemote) {
            added.push(key);
        }
        else if (!hasLocal && hasRemote) {
            removed.push(key);
        }
        else if (local[key] !== remote[key]) {
            changed.push(key);
        }
        else {
            unchanged.push(key);
        }
    }
    return { added, removed, changed, unchanged };
}
/**
 * Get all known env file paths for a project
 */
function discoverEnvFiles(projectRoot) {
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
exports.default = { parse, serialize, load, write, merge, diff, discoverEnvFiles };
//# sourceMappingURL=index.js.map