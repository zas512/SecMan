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
const core_1 = require("@secman/core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('Core', () => {
    const tmpDir = path.join(__dirname, 'tmp_core');
    beforeAll(() => {
        if (!fs.existsSync(tmpDir))
            fs.mkdirSync(tmpDir, { recursive: true });
    });
    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });
    it('should initialize with new Core', () => {
        const core = new core_1.Core(tmpDir);
        expect(core).toBeDefined();
    });
    it('loadEnvFiles should return empty when no .env exists', async () => {
        const core = new core_1.Core(tmpDir);
        const result = await core.loadEnvFiles();
        expect(result).toEqual({});
    });
    it('getCurrentEnvironment should return null when not initialized', () => {
        const core = new core_1.Core(tmpDir);
        expect(core.getCurrentEnvironment()).toBeNull();
    });
    it('sync should throw when project not initialized', async () => {
        const core = new core_1.Core(tmpDir);
        await expect(core.sync()).rejects.toThrow('Project not initialized');
    });
});
//# sourceMappingURL=core.test.js.map