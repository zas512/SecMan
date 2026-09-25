// Crypto module for SecMan
// Handles key derivation, encryption, decryption, and integrity validation

import * as crypto from 'crypto';
import argon2 from 'argon2';

export interface EncryptionResult {
  formatVersion: number;
  encryptionVersion: number;
  algorithm: string;
  salt: string; // base64
  nonce: string; // base64
  ciphertext: string; // base64
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface CryptoOptions {
  // Argon2id parameters
  argon2MemoryCost?: number;
  argon2TimeCost?: number;
  argon2Parallelism?: number;
  argon2HashLength?: number;
}

export const DEFAULT_CRYPTO_OPTIONS: CryptoOptions = {
  argon2MemoryCost: 2 ** 16, // 64 MB
  argon2TimeCost: 3,
  argon2Parallelism: 1,
  argon2HashLength: 32
};

export class Crypto {
  private options: CryptoOptions;

  constructor(options: CryptoOptions = DEFAULT_CRYPTO_OPTIONS) {
    this.options = options;
  }

  /**
   * Derive encryption key from passphrase using Argon2id
   */
  async deriveKey(passphrase: string, salt: Buffer): Promise<Buffer> {
    return argon2.hash(passphrase, {
      salt: salt,
      memoryCost: this.options.argon2MemoryCost,
      timeCost: this.options.argon2TimeCost,
      parallelism: this.options.argon2Parallelism,
      hashLength: this.options.argon2HashLength,
      type: argon2.argon2id
    }) as Promise<Buffer>;
  }

  /**
   * Generate a random salt
   */
  generateSalt(size: number = 16): Buffer {
    return crypto.randomBytes(size);
  }

  /**
   * Generate a random nonce for encryption
   */
  generateNonce(size: number = 12): Buffer {
    // 12 bytes is standard for AES-GCM and XChaCha20-Poly1305
    return crypto.randomBytes(size);
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(plaintext: Buffer, key: Buffer): EncryptionResult {
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
  decrypt(encrypted: EncryptionResult, key: Buffer): Buffer {
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
  async createEnvelope(plaintext: Buffer, passphrase: string): Promise<EncryptionResult> {
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
  async openEnvelope(envelope: EncryptionResult, passphrase: string): Promise<Buffer> {
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
  validateIntegrity(envelope: EncryptionResult): boolean {
    // Basic validation - check required fields exist
    return !!(
      envelope.formatVersion &&
      envelope.encryptionVersion &&
      envelope.algorithm &&
      envelope.salt &&
      envelope.nonce &&
      envelope.ciphertext
    );
  }
}

// Export singleton instance for convenience
export const cryptoInstance = new Crypto();

export default Crypto;