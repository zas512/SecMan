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
export declare function loadProjectConfig(projectRoot: string): ProjectConfig | null;
/**
 * Save project configuration to .secman.yaml
 */
export declare function saveProjectConfig(projectRoot: string, config: ProjectConfig): void;
/**
 * Load manifest from .secman/manifest.json
 */
export declare function loadManifest(projectRoot: string): ManifestConfig | null;
/**
 * Save manifest to .secman/manifest.json
 */
export declare function saveManifest(projectRoot: string, manifest: ManifestConfig): void;
/**
 * Validate manifest structure
 */
export declare function validateManifest(manifest: any): manifest is ManifestConfig;
declare const _default: {
    loadProjectConfig: typeof loadProjectConfig;
    saveProjectConfig: typeof saveProjectConfig;
    loadManifest: typeof loadManifest;
    saveManifest: typeof saveManifest;
    validateManifest: typeof validateManifest;
};
export default _default;
//# sourceMappingURL=index.d.ts.map