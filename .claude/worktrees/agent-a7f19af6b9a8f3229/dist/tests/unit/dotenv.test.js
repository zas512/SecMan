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
const dotenv_1 = require("@secman/dotenv");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('Dotenv parse', () => {
    it('should parse basic key-value pairs', () => {
        expect((0, dotenv_1.parse)('FOO=bar\nBAZ=qux').FOO).toBe('bar');
    });
    it('should handle quoted values (double quotes)', () => {
        expect((0, dotenv_1.parse)('FOO="bar"').FOO).toBe('bar');
    });
    it('should handle quoted values (single quotes)', () => {
        expect((0, dotenv_1.parse)("FOO='bar'").FOO).toBe('bar');
    });
    it('should skip empty lines', () => {
        expect((0, dotenv_1.parse)('FOO=bar\n\nBAZ=qux')).toEqual({ FOO: 'bar', BAZ: 'qux' });
    });
    it('should skip comments', () => {
        expect((0, dotenv_1.parse)('# comment\nFOO=bar')).toEqual({ FOO: 'bar' });
    });
    it('should handle duplicates (last wins)', () => {
        expect((0, dotenv_1.parse)('FOO=first\nFOO=second').FOO).toBe('second');
    });
});
describe('Dotenv serialize', () => {
    it('should serialize to .env format', () => {
        expect((0, dotenv_1.serialize)({ FOO: 'bar' })).toContain('FOO=bar');
    });
    it('should quote values with spaces', () => {
        const result = (0, dotenv_1.serialize)({ FOO: 'hello world' });
        expect(result).toContain('FOO="hello world"');
    });
});
describe('Dotenv load / write', () => {
    const tmpDir = path.join(__dirname, 'tmp_dotenv_test');
    beforeAll(() => {
        if (!fs.existsSync(tmpDir))
            fs.mkdirSync(tmpDir, { recursive: true });
    });
    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });
    it('should load .env file', () => {
        const file = path.join(tmpDir, '.env');
        fs.writeFileSync(file, 'FOO=bar');
        expect((0, dotenv_1.load)(file).FOO).toBe('bar');
    });
    it('should write .env file', () => {
        const file = path.join(tmpDir, '.env.write');
        (0, dotenv_1.write)(file, { KEY: 'value' });
        expect(fs.readFileSync(file, 'utf8')).toContain('KEY=value');
    });
});
describe('Dotenv merge', () => {
    it('should override with later values', () => {
        const result = (0, dotenv_1.merge)({ A: '1' }, { A: '2', B: '3' });
        expect(result).toEqual({ A: '2', B: '3' });
    });
});
describe('Dotenv diff', () => {
    it('should detect added, removed, changed, unchanged', () => {
        const d = (0, dotenv_1.diff)({ A: '1', B: '2' }, { B: '2', C: '3', A: '1' });
        expect(d.added).toContain('C');
        expect(d.removed).toContain(''); // no removal here
        expect(d.changed).toEqual([]);
        expect(d.unchanged).toContain('A');
        expect(d.unchanged).toContain('B');
    });
    it('should detect changed values', () => {
        const d = (0, dotenv_1.diff)({ A: '1' }, { A: '2' });
        expect(d.changed).toContain('A');
    });
});
describe('Dotenv discoverEnvFiles', () => {
    it('should find existing env files', () => {
        const found = (0, dotenv_1.discoverEnvFiles)('/f/Projects/cli');
        expect(Array.isArray(found)).toBe(true);
    });
});
//# sourceMappingURL=dotenv.test.js.map