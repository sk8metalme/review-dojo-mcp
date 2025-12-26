import { describe, it, expect } from 'vitest';
import { SensitiveInfoMasker } from '../../src/domain/services/SensitiveInfoMasker.js';

describe('SensitiveInfoMasker', () => {
  const masker = new SensitiveInfoMasker();

  describe('Basic Patterns', () => {
    it('should mask API keys', () => {
      const text = 'API key: abc123def456ghi789jklmno';
      const masked = masker.mask(text);
      expect(masked).toContain('***REDACTED***');
      expect(masked).not.toContain('abc123def456ghi789jklmno');
    });

    it('should mask AWS keys', () => {
      const text = 'AWS Key: AKIAIOSFODNN7EXAMPLE';
      const masked = masker.mask(text);
      expect(masked).toContain('***AWS_KEY***');
      expect(masked).not.toContain('AKIAIOSFODNN7EXAMPLE');
    });

    it('should mask Bearer tokens', () => {
      const text = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const masked = masker.mask(text);
      expect(masked).toContain('Bearer ***TOKEN***');
      expect(masked).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should mask passwords', () => {
      const text = 'password: mySecretPassword123';
      const masked = masker.mask(text);
      expect(masked).toContain('password: ***');
      expect(masked).not.toContain('mySecretPassword123');
    });

    it('should not modify text without sensitive info', () => {
      const text = 'This is a normal comment about code quality';
      const masked = masker.mask(text);
      expect(masked).toBe(text);
    });
  });

  describe('Enhanced Security Patterns', () => {
    it('should mask GitHub tokens', () => {
      const text = 'GitHub token: ghp_1234567890abcdefghijklmnopqrstuvwxyz';
      const masked = masker.mask(text);
      expect(masked).toContain('***GITHUB_TOKEN***');
      expect(masked).not.toContain('ghp_1234567890abcdefghijklmnopqrstuvwxyz');
    });

    it('should mask JWT tokens', () => {
      const text = 'JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const masked = masker.mask(text);
      expect(masked).toContain('***JWT_TOKEN***');
      expect(masked).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should mask private keys', () => {
      const text = 'Private key: -----BEGIN RSA PRIVATE KEY-----\nMIIBogIBAAJBALRQ\n-----END RSA PRIVATE KEY-----';
      const masked = masker.mask(text);
      expect(masked).toContain('***PRIVATE_KEY***');
      expect(masked).not.toContain('-----BEGIN RSA PRIVATE KEY-----');
    });

    it('should handle multiple sensitive patterns in one text', () => {
      const text = 'API key: abc123def456ghi789jklmno, password: secret123, GitHub: ghp_1234567890123456789012345678901234567890';
      const masked = masker.mask(text);
      expect(masked).toContain('***REDACTED***');
      expect(masked).toContain('password: ***');
      expect(masked).toContain('***GITHUB_TOKEN***');
      expect(masked).not.toContain('abc123def456ghi789jklmno');
      expect(masked).not.toContain('secret123');
      expect(masked).not.toContain('ghp_1234567890123456789012345678901234567890');
    });
  });
});
