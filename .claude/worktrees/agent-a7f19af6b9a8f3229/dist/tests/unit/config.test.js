"use strict";
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
const config_1 = require("@secman/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('Config', () => {
    const tmpDir = path.join(__dirname, 'tmp_config');
    beforeAll(() => {
        if (!fs.existsSync(tmpDir))
            fs.mkdirSync(tmpDir, { recursive: true });
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
            (0, config_1.saveProjectConfig)(tmpDir, config);
            const loaded = (0, config_1.loadProjectConfig)(tmpDir);
            expect(loaded).not.toBeNull();
            expect(loaded.project).toBe('test');
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
            (0, config_1.saveManifest)(tmpDir, manifest);
            const loaded = (0, config_1.loadManifest)(tmpDir);
            expect(loaded).not.toBeNull();
            expect(loaded.projectName).toBe('proj');
        });
    });
    describe('validateManifest', () => {
        it('should return true for valid manifest', () => {
            const m = { formatVersion: 1, projectId: '1', projectName: 'p', createdAt: '', updatedAt: '', environments: [] };
            expect((0, config_1.validateManifest)(m)).toBe(true);
        });
        it('should return false for missing fields', () => {
            expect((0, config_1.validateManifest)({})).toBe(false);
        });
        it('should return false for invalid types', () => {
            expect((0, config_1.validateManifest)({ formatVersion: 'one', projectId: 1, projectName: 'p', createdAt: '', updatedAt: '', environments: [] })).toBe(false);
        });
    });
});
//# sourceMappingURL=config.test.js.map