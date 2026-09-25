"use strict";
// Keychain module for SecMan
// Handles OS credential storage integration
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
exports.keychainInstance = exports.Keychain = void 0;
const keytar = __importStar(require("keytar"));
const SERVICE_NAME = 'secman';
class Keychain {
    /**
     * Store GitHub authentication token
     */
    async storeGitHubToken(token) {
        const account = 'github-token';
        await keytar.setPassword(SERVICE_NAME, account, JSON.stringify(token));
    }
    /**
     * Retrieve GitHub authentication token
     */
    async getGitHubToken() {
        const account = 'github-token';
        const stored = await keytar.getPassword(SERVICE_NAME, account);
        if (!stored)
            return null;
        try {
            return JSON.parse(stored);
        }
        catch {
            return null;
        }
    }
    /**
     * Delete GitHub authentication token
     */
    async deleteGitHubToken() {
        const account = 'github-token';
        return keytar.deletePassword(SERVICE_NAME, account);
    }
    /**
     * Store encryption passphrase for a project
     */
    async storeEncryptionCredential(credential) {
        const account = `encryption-${credential.projectId}`;
        await keytar.setPassword(SERVICE_NAME, account, JSON.stringify(credential));
    }
    /**
     * Retrieve encryption passphrase for a project
     */
    async getEncryptionCredential(projectId) {
        const account = `encryption-${projectId}`;
        const stored = await keytar.getPassword(SERVICE_NAME, account);
        if (!stored)
            return null;
        try {
            return JSON.parse(stored);
        }
        catch {
            return null;
        }
    }
    /**
     * Delete encryption credential for a project
     */
    async deleteEncryptionCredential(projectId) {
        const account = `encryption-${projectId}`;
        return keytar.deletePassword(SERVICE_NAME, account);
    }
    /**
     * Store generic credential
     */
    async storeCredential(credential) {
        await keytar.setPassword(SERVICE_NAME, credential.account, credential.password);
    }
    /**
     * Retrieve generic credential
     */
    async getCredential(account) {
        return keytar.getPassword(SERVICE_NAME, account);
    }
    /**
     * Delete generic credential
     */
    async deleteCredential(account) {
        return keytar.deletePassword(SERVICE_NAME, account);
    }
    /**
     * Check if keychain is available
     */
    async isAvailable() {
        try {
            await keytar.findCredentials(SERVICE_NAME);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * List all credentials for this service
     */
    async listCredentials() {
        return keytar.findCredentials(SERVICE_NAME);
    }
}
exports.Keychain = Keychain;
exports.keychainInstance = new Keychain();
exports.default = Keychain;
//# sourceMappingURL=index.js.map