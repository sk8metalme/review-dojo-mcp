import { describe, it, expect } from 'vitest';
import { PathComponent } from '../../src/domain/value-objects/PathComponent.js';

describe('PathComponent (Security)', () => {
  describe('Valid path components', () => {
    it('should accept valid path components', () => {
      expect(PathComponent.create('security').getValue()).toBe('security');
      expect(PathComponent.create('nodejs').getValue()).toBe('nodejs');
      expect(PathComponent.create('test-123').getValue()).toBe('test-123');
      expect(PathComponent.create('test_file').getValue()).toBe('test_file');
    });

    it('should accept alphanumeric with dots', () => {
      expect(PathComponent.create('file.name').getValue()).toBe('file.name');
      expect(PathComponent.create('test.v1.2').getValue()).toBe('test.v1.2');
    });
  });

  describe('Path traversal prevention', () => {
    it('should reject path traversal attempts', () => {
      expect(() => PathComponent.create('../etc')).toThrow('Invalid path component');
      expect(() => PathComponent.create('../../passwd')).toThrow('Invalid path component');
      expect(() => PathComponent.create('../../../root')).toThrow('Invalid path component');
    });

    it('should reject absolute paths', () => {
      expect(() => PathComponent.create('/etc/passwd')).toThrow('Invalid path component');
      expect(() => PathComponent.create('/root/.ssh/id_rsa')).toThrow('Invalid path component');
    });

    it('should reject Windows absolute paths', () => {
      expect(() => PathComponent.create('C:\\Windows\\System32')).toThrow('Invalid path component');
      expect(() => PathComponent.create('D:\\sensitive')).toThrow('Invalid path component');
    });
  });

  describe('Special character validation', () => {
    it('should reject paths with command injection attempts', () => {
      expect(() => PathComponent.create('file;rm -rf /')).toThrow('Invalid path component');
      expect(() => PathComponent.create('file && whoami')).toThrow('Invalid path component');
      expect(() => PathComponent.create('file | cat /etc/passwd')).toThrow('Invalid path component');
    });

    it('should reject paths with spaces', () => {
      expect(() => PathComponent.create('file name')).toThrow('Invalid path component');
      expect(() => PathComponent.create('hello world')).toThrow('Invalid path component');
    });

    it('should reject paths with special characters', () => {
      expect(() => PathComponent.create('file@name')).toThrow('Invalid path component');
      expect(() => PathComponent.create('file#name')).toThrow('Invalid path component');
      expect(() => PathComponent.create('file$name')).toThrow('Invalid path component');
    });
  });

  describe('Empty and invalid inputs', () => {
    it('should reject empty strings', () => {
      expect(() => PathComponent.create('')).toThrow('Invalid path component');
      expect(() => PathComponent.create('   ')).toThrow('Invalid path component');
    });

    it('should reject null or undefined (type safety)', () => {
      // TypeScript would catch this at compile time, but testing runtime behavior
      expect(() => PathComponent.create(null as any)).toThrow('Invalid path component');
      expect(() => PathComponent.create(undefined as any)).toThrow('Invalid path component');
    });
  });

  describe('Length validation', () => {
    it('should reject paths that are too long', () => {
      const longPath = 'a'.repeat(101);
      expect(() => PathComponent.create(longPath)).toThrow('Path component too long');
    });

    it('should accept paths at maximum length', () => {
      const maxPath = 'a'.repeat(100);
      expect(PathComponent.create(maxPath).getValue()).toBe(maxPath);
    });
  });
});
