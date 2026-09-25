"use strict";
// Crypto module for SecMan
// Handles key derivation, encryption, decryption, and integrity validation
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cryptoInstance = exports.Crypto = exports.DEFAULT_CRYPTO_OPTIONS = void 0;
const crypto = __importStar(require("crypto"));
const argon2_1 = __importDefault(require("argon2"));
exports.DEFAULT_CRYPTO_OPTIONS = {
    argon2MemoryCost: 2 ** 16, // 64 MB
    argon2TimeCost: 3,
    argon2Parallelism: 1,
    argon2HashLength: 32
};
class Crypto {
    constructor(options = exports.DEFAULT_CRYPTO_OPTIONS) {
        this.options = options;
    }
    /**
     * Derive encryption key from passphrase using Argon2id
     */
    async deriveKey(passphrase, salt) {
        const result = await argon2_1.default.hash(passphrase, {
            salt: salt,
            memoryCost: this.options.argon2MemoryCost,
            timeCost: this.options.argon2TimeCost,
            parallelism: this.options.argon2Parallelism,
            hashLength: this.options.argon2HashLength,
            type: argon2_1.default.argon2id
        });
        return Buffer.from(result);
    }
    /**
     * Generate a random salt
     */
    generateSalt(size = 16) {
        return crypto.randomBytes(size);
    }
    /**
     * Generate a random nonce for encryption
     */
    generateNonce(size = 12) {
        // 12 bytes is standard for AES-GCM and XChaCha20-Poly1305
        return crypto.randomBytes(size);
    }
    /**
     * Encrypt data using AES-256-GCM
     */
    encrypt(plaintext, key) {
        const iv = this.generateNonce();
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        // Update cipher with plaintext
        let ciphertext = cipher.update(plaintext);
        ciphertext = Buffer.concat([ciphertext, cipher.final()]);
        // Get the authentication tag
        const authTag = cipher.getAuthTag();
        // Combine ciphertext and auth tag (GCM stores tag at the end)
        const encryptedData = Buffer.concat([ciphertext, authTag]);
        const now = new Date().toISOString();
        return {
            formatVersion: 1,
            encryptionVersion: 1,
            algorithm: 'aes-256-gcm',
            salt: '', // Will be filled by caller (stored separately)
            nonce: iv.toString('base64'),
            ciphertext: encryptedData.toString('base64'),
            createdAt: now,
            updatedAt: now
        };
    }
    /**
     * Decrypt data using AES-256-GCM
     */
    decrypt(encrypted, key) {
        if (encrypted.algorithm !== 'aes-256-gcm') {
            throw new Error(`Unsupported algorithm: ${encrypted.algorithm}`);
        }
        const iv = Buffer.from(encrypted.nonce, 'base64');
        const encryptedData = Buffer.from(encrypted.ciphertext, 'base64');
        // Extract ciphertext and auth tag (last 16 bytes are the tag for AES-GCM)
        const authTag = encryptedData.slice(encryptedData.length - 16);
        const ciphertext = encryptedData.slice(0, encryptedData.length - 16);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted;
    }
    /**
     * Create encrypted envelope with metadata
     */
    async createEnvelope(plaintext, passphrase) {
        // Generate salt for key derivation
        const salt = this.generateSalt();
        // Derive key from passphrase
        const key = await this.deriveKey(passphrase, salt);
        // Encrypt the data
        const result = this.encrypt(plaintext, key);
        // Store the salt in the result
        result.salt = salt.toString('base64');
        return result;
    }
    /**
     * Decrypt data from envelope
     */
    async openEnvelope(envelope, passphrase) {
        // Extract salt
        const salt = Buffer.from(envelope.salt, 'base64');
        // Derive key from passphrase
        const key = await this.deriveKey(passphrase, salt);
        // Decrypt the data
        return this.decrypt(envelope, key);
    }
    /**
     * Validate integrity of encrypted data
     * (This is inherently done during decryption with GCM)
     */
    validateIntegrity(envelope) {
        // Basic validation - check required fields exist
        return !!(envelope.formatVersion &&
            envelope.encryptionVersion &&
            envelope.algorithm &&
            envelope.salt &&
            envelope.nonce &&
            envelope.ciphertext);
    }
}
exports.Crypto = Crypto;
// Export singleton instance for convenience
exports.cryptoInstance = new Crypto();
exports.default = Crypto;
//# sourceMappingURL=index.js.map