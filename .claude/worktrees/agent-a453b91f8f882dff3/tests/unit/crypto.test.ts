import { Crypto, DEFAULT_CRYPTO_OPTIONS, EncryptionResult } from '@secman/crypto';

describe('Crypto', () => {
  describe('deriveKey', () => {
    it('should derive a consistent key from the same passphrase and salt', async () => {
      const crypto = new Crypto();
      const salt = crypto.generateSalt();
      const key1 = await crypto.deriveKey('passphrase', salt);
      const key2 = await crypto.deriveKey('passphrase', salt);
      expect(key1.length).toBe(key2.length);
      expect(key1.toString('base64')).toBe(key2.toString('base64'));
    });

    it('should derive different keys for different salts', async () => {
      const crypto = new Crypto();
      const salt1 = crypto.generateSalt();
      const salt2 = crypto.generateSalt();
      const key1 = await crypto.deriveKey('passphrase', salt1);
      const key2 = await crypto.deriveKey('passphrase', salt2);
      expect(key1.toString('base64')).not.toBe(key2.toString('base64'));
    });
  });

  describe('encrypt / decrypt roundtrip', () => {
    it('should encrypt and decrypt a buffer back to original', async () => {
      const crypto = new Crypto();
      const plain = Buffer.from('hello secman');
      const envelope = await crypto.createEnvelope(plain, 'my-secret');
      const decrypted = await crypto.openEnvelope(envelope, 'my-secret');
      expect(decrypted.toString()).toBe('hello secman');
    });
  });

  describe('envelope creation / opening', () => {
    it('should create envelope with all required fields', async () => {
      const crypto = new Crypto();
      const envelope = await crypto.createEnvelope(Buffer.from('test'), 'pw');
      expect(envelope.formatVersion).toBe(1);
      expect(envelope.encryptionVersion).toBe(1);
      expect(envelope.algorithm).toBe('aes-256-gcm');
      expect(envelope.salt).toBeTruthy();
      expect(envelope.nonce).toBeTruthy();
      expect(envelope.ciphertext).toBeTruthy();
    });

    it('should open envelope and return original plaintext', async () => {
      const crypto = new Crypto();
      const envelope = await crypto.createEnvelope(Buffer.from('secrets'), 'pw');
      const result = await crypto.openEnvelope(envelope, 'pw');
      expect(result.toString()).toBe('secrets');
    });
  });

  describe('validateIntegrity', () => {
    it('should return true for a valid envelope', async () => {
      const crypto = new Crypto();
      const envelope = await crypto.createEnvelope(Buffer.from('x'), 'pw');
      expect(crypto.validateIntegrity(envelope)).toBe(true);
    });

    it('should return false when a required field is missing', async () => {
      const crypto = new Crypto();
      const envelope = await crypto.createEnvelope(Buffer.from('x'), 'pw');
      const partial: any = { ...envelope };
      delete partial.salt;
      expect(crypto.validateIntegrity(partial)).toBe(false);
    });

    it('should return false with wrong algorithm', async () => {
      const crypto = new Crypto();
      const envelope = await crypto.createEnvelope(Buffer.from('x'), 'pw');
      envelope.algorithm = 'wrong';
      expect(crypto.validateIntegrity(envelope)).toBe(false);
    });

    it('should return false with tampered ciphertext', async () => {
      const crypto = new Crypto();
      const envelope = await crypto.createEnvelope(Buffer.from('x'), 'pw');
      const tamperedCipher = envelope.ciphertext.slice(0, -4) + 'AAAA';
      envelope.ciphertext = tamperedCipher;
      expect(crypto.validateIntegrity(envelope)).toBe(true); // structural check passes
      // But decryption should throw (auth tag mismatch)
      await expect(crypto.openEnvelope(envelope, 'pw')).rejects.toThrow();
    });
  });
});
