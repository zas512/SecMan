"use strict";
// Config module for SecMan
// Handles .secman.yaml and manifest validation
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
exports.loadProjectConfig = loadProjectConfig;
exports.saveProjectConfig = saveProjectConfig;
exports.loadManifest = loadManifest;
exports.saveManifest = saveManifest;
exports.validateManifest = validateManifest;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
/**
 * Load project configuration from .secman.yaml
 */
function loadProjectConfig(projectRoot) {
    const configPath = path.join(projectRoot, '.secman.yaml');
    if (!fs.existsSync(configPath)) {
        return null;
    }
    try {
        const content = fs.readFileSync(configPath, 'utf8');
        const config = yaml.load(content);
        return config;
    }
    catch (e) {
        throw new Error(`Failed to parse .secman.yaml: ${e.message}`);
    }
}
/**
 * Save project configuration to .secman.yaml
 */
function saveProjectConfig(projectRoot, config) {
    const configPath = path.join(projectRoot, '.secman.yaml');
    const content = yaml.dump(config, { quotingType: '"' });
    fs.writeFileSync(configPath, content, { mode: 0o600 });
}
/**
 * Load manifest from .secman/manifest.json
 */
function loadManifest(projectRoot) {
    const manifestPath = path.join(projectRoot, '.secman', 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        return null;
    }
    try {
        const content = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(content);
        return manifest;
    }
    catch (e) {
        throw new Error(`Failed to parse manifest.json: ${e.message}`);
    }
}
/**
 * Save manifest to .secman/manifest.json
 */
function saveManifest(projectRoot, manifest) {
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
function validateManifest(manifest) {
    return (typeof manifest === 'object' &&
        typeof manifest.formatVersion === 'number' &&
        typeof manifest.projectId === 'string' &&
        typeof manifest.projectName === 'string' &&
        typeof manifest.createdAt === 'string' &&
        typeof manifest.updatedAt === 'string' &&
        Array.isArray(manifest.environments));
}
exports.default = { loadProjectConfig, saveProjectConfig, loadManifest, saveManifest, validateManifest };
//# sourceMappingURL=index.js.map