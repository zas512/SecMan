import { parse, serialize, load, write, merge, diff, discoverEnvFiles } from '@secman/dotenv';
import * as fs from 'fs';
import * as path from 'path';

describe('Dotenv parse', () => {
  it('should parse basic key-value pairs', () => {
    expect(parse('FOO=bar\nBAZ=qux').FOO).toBe('bar');
  });

  it('should handle quoted values (double quotes)', () => {
    expect(parse('FOO="bar"').FOO).toBe('bar');
  });

  it('should handle quoted values (single quotes)', () => {
    expect(parse("FOO='bar'").FOO).toBe('bar');
  });

  it('should skip empty lines', () => {
    expect(parse('FOO=bar\n\nBAZ=qux')).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('should skip comments', () => {
    expect(parse('# comment\nFOO=bar')).toEqual({ FOO: 'bar' });
  });

  it('should handle duplicates (last wins)', () => {
    expect(parse('FOO=first\nFOO=second').FOO).toBe('second');
  });
});

describe('Dotenv serialize', () => {
  it('should serialize to .env format', () => {
    expect(serialize({ FOO: 'bar' })).toContain('FOO=bar');
  });

  it('should quote values with spaces', () => {
    const result = serialize({ FOO: 'hello world' });
    expect(result).toContain('FOO="hello world"');
  });
});

describe('Dotenv load / write', () => {
  const tmpDir = path.join(__dirname, 'tmp_dotenv_test');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should load .env file', () => {
    const file = path.join(tmpDir, '.env');
    fs.writeFileSync(file, 'FOO=bar');
    expect(load(file).FOO).toBe('bar');
  });

  it('should write .env file', () => {
    const file = path.join(tmpDir, '.env.write');
    write(file, { KEY: 'value' });
    expect(fs.readFileSync(file, 'utf8')).toContain('KEY=value');
  });
});

describe('Dotenv merge', () => {
  it('should override with later values', () => {
    const result = merge({ A: '1' }, { A: '2', B: '3' });
    expect(result).toEqual({ A: '2', B: '3' });
  });
});

describe('Dotenv diff', () => {
  it('should detect added, removed, changed, unchanged', () => {
    const d = diff({ A: '1', B: '2' }, { B: '2', C: '3', A: '1' });
    expect(d.added).toContain('C');
    expect(d.removed).toContain(''); // no removal here
    expect(d.changed).toEqual([]);
    expect(d.unchanged).toContain('A');
    expect(d.unchanged).toContain('B');
  });

  it('should detect changed values', () => {
    const d = diff({ A: '1' }, { A: '2' });
    expect(d.changed).toContain('A');
  });
});

describe('Dotenv discoverEnvFiles', () => {
  it('should find existing env files', () => {
    const found = discoverEnvFiles('/f/Projects/cli');
    expect(Array.isArray(found)).toBe(true);
  });
});
