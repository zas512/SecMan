export interface EncryptionResult {
    formatVersion: number;
    encryptionVersion: number;
    algorithm: string;
    salt: string;
    nonce: string;
    ciphertext: string;
    createdAt: string;
    updatedAt: string;
}
export interface CryptoOptions {
    argon2MemoryCost?: number;
    argon2TimeCost?: number;
    argon2Parallelism?: number;
    argon2HashLength?: number;
}
export declare const DEFAULT_CRYPTO_OPTIONS: CryptoOptions;
export declare class Crypto {
    private options;
    constructor(options?: CryptoOptions);
    /**
     * Derive encryption key from passphrase using Argon2id
     */
    deriveKey(passphrase: string, salt: Buffer): Promise<Buffer>;
    /**
     * Generate a random salt
     */
    generateSalt(size?: number): Buffer;
    /**
     * Generate a random nonce for encryption
     */
    generateNonce(size?: number): Buffer;
    /**
     * Encrypt data using AES-256-GCM
     */
    encrypt(plaintext: Buffer, key: Buffer): EncryptionResult;
    /**
     * Decrypt data using AES-256-GCM
     */
    decrypt(encrypted: EncryptionResult, key: Buffer): Buffer;
    /**
     * Create encrypted envelope with metadata
     */
    createEnvelope(plaintext: Buffer, passphrase: string): Promise<EncryptionResult>;
    /**
     * Decrypt data from envelope
     */
    openEnvelope(envelope: EncryptionResult, passphrase: string): Promise<Buffer>;
    /**
     * Validate integrity of encrypted data
     * (This is inherently done during decryption with GCM)
     */
    validateIntegrity(envelope: EncryptionResult): boolean;
}
export declare const cryptoInstance: Crypto;
export default Crypto;
//# sourceMappingURL=index.d.ts.map