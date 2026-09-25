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
export declare function parse(content: string): DotenvParseResult;
/**
 * Serialize key-value pairs to .env format
 */
export declare function serialize(env: DotenvParseResult): string;
/**
 * Load .env file from path
 */
export declare function load(filePath: string): DotenvParseResult;
/**
 * Write .env file to path
 */
export declare function write(filePath: string, env: DotenvParseResult): void;
/**
 * Merge two env objects, later values override earlier
 */
export declare function merge(base: DotenvParseResult, override: DotenvParseResult): DotenvParseResult;
/**
 * Get difference between two env objects
 * Returns: { added: [], removed: [], changed: [], unchanged: [] }
 */
export declare function diff(local: DotenvParseResult, remote: DotenvParseResult): {
    added: string[];
    removed: string[];
    changed: string[];
    unchanged: string[];
};
/**
 * Get all known env file paths for a project
 */
export declare function discoverEnvFiles(projectRoot: string): string[];
declare const _default: {
    parse: typeof parse;
    serialize: typeof serialize;
    load: typeof load;
    write: typeof write;
    merge: typeof merge;
    diff: typeof diff;
    discoverEnvFiles: typeof discoverEnvFiles;
};
export default _default;
//# sourceMappingURL=index.d.ts.map