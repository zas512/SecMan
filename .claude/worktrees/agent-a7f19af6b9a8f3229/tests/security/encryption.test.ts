import { Crypto } from '@secman/crypto';

describe('Security: Encryption', () => {
  it('should fail decryption with wrong passphrase', async () => {
    const crypto = new Crypto();
    const envelope = await crypto.createEnvelope(Buffer.from('secret'), 'correct-pw');
    await expect(crypto.openEnvelope(envelope, 'wrong-pw')).rejects.toThrow();
  });

  it('should fail with modified ciphertext (auth tag mismatch)', async () => {
    const crypto = new Crypto();
    const envelope = await crypto.createEnvelope(Buffer.from('secret'), 'pw');
    const badCipher = Buffer.from(envelope.ciphertext, 'base64');
    badCipher[badCipher.length - 1] = (badCipher[badCipher.length - 1] + 1) % 256;
    envelope.ciphertext = badCipher.toString('base64');
    await expect(crypto.openEnvelope(envelope, 'pw')).rejects.toThrow();
  });

  it('should fail with version mismatch', async () => {
    const crypto = new Crypto();
    const envelope = await crypto.createEnvelope(Buffer.from('secret'), 'pw');
    envelope.encryptionVersion = 99;
    // validateIntegrity should reject
    expect(crypto.validateIntegrity(envelope)).toBe(false);
  });

  it('should not expose plaintext secrets in errors', async () => {
    const crypto = new Crypto();
    try {
      await crypto.openEnvelope({} as any, 'pw');
    } catch (e: any) {
      const msg = e.message || '';
      expect(msg.toLowerCase()).not.toContain('secret');
      expect(msg.toLowerCase()).not.toContain('hello');
    }
  });
});
