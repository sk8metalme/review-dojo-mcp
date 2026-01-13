import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PRReference } from '../../src/domain/value-objects/PRReference.js';

describe('PRReference', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('デフォルト（github.com）', () => {
    it('有効なgithub.com PR URLを受け入れること', () => {
      delete process.env.GITHUB_HOST;

      const ref = PRReference.create('https://github.com/owner/repo/pull/123');

      expect(ref.getUrl()).toBe('https://github.com/owner/repo/pull/123');
      expect(ref.getPRNumber()).toBe(123);
      expect(ref.getOwner()).toBe('owner');
      expect(ref.getRepository()).toBe('repo');
    });

    it('無効なURLを拒否すること', () => {
      delete process.env.GITHUB_HOST;

      expect(() => {
        PRReference.create('https://example.com/owner/repo/pull/123');
      }).toThrow('Invalid PR reference URL');
    });

    it('PR番号がないURLを拒否すること', () => {
      delete process.env.GITHUB_HOST;

      expect(() => {
        PRReference.create('https://github.com/owner/repo/pull/');
      }).toThrow('Invalid PR reference URL');
    });

    it('空文字列を拒否すること', () => {
      expect(() => {
        PRReference.create('');
      }).toThrow('PR reference URL must be a non-empty string');
    });
  });

  describe('GitHub Enterprise対応', () => {
    it('GHE URLを受け入れること（GITHUB_HOST設定時）', () => {
      process.env.GITHUB_HOST = 'github.example.com';

      const ref = PRReference.create('https://github.example.com/org/repo/pull/456');

      expect(ref.getUrl()).toBe('https://github.example.com/org/repo/pull/456');
      expect(ref.getPRNumber()).toBe(456);
      expect(ref.getOwner()).toBe('org');
      expect(ref.getRepository()).toBe('repo');
    });

    it('GITHUB_HOST設定時、github.com URLを拒否すること', () => {
      process.env.GITHUB_HOST = 'github.example.com';

      expect(() => {
        PRReference.create('https://github.com/owner/repo/pull/123');
      }).toThrow('Invalid PR reference URL');
    });

    it('特殊文字を含むホスト名でも正しく動作すること', () => {
      process.env.GITHUB_HOST = 'github.my-company.co.jp';

      const ref = PRReference.create('https://github.my-company.co.jp/team/project/pull/789');

      expect(ref.getOwner()).toBe('team');
      expect(ref.getRepository()).toBe('project');
      expect(ref.getPRNumber()).toBe(789);
    });

    it('エラーメッセージに正しいホスト名を含むこと', () => {
      process.env.GITHUB_HOST = 'github.example.com';

      expect(() => {
        PRReference.create('https://wrong.com/owner/repo/pull/123');
      }).toThrow('Must be a GitHub PR URL (e.g., https://github.example.com/owner/repo/pull/123)');
    });
  });

  describe('equals', () => {
    it('同じURLの場合trueを返すこと', () => {
      const ref1 = PRReference.create('https://github.com/owner/repo/pull/123');
      const ref2 = PRReference.create('https://github.com/owner/repo/pull/123');

      expect(ref1.equals(ref2)).toBe(true);
    });

    it('異なるURLの場合falseを返すこと', () => {
      const ref1 = PRReference.create('https://github.com/owner/repo/pull/123');
      const ref2 = PRReference.create('https://github.com/owner/repo/pull/456');

      expect(ref1.equals(ref2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('URLを文字列として返すこと', () => {
      const ref = PRReference.create('https://github.com/owner/repo/pull/123');

      expect(ref.toString()).toBe('https://github.com/owner/repo/pull/123');
    });
  });
});
