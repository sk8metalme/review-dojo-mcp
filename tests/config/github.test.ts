import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getGitHubConfig } from '../../src/config/github.js';

describe('getGitHubConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 環境変数を隔離
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // 環境変数を復元
    process.env = originalEnv;
  });

  describe('デフォルト値（環境変数未設定時）', () => {
    it('github.comをデフォルトとして返すこと', () => {
      delete process.env.GITHUB_HOST;
      delete process.env.GITHUB_API_URL;
      delete process.env.GITHUB_ORG_NAME;

      const config = getGitHubConfig();

      expect(config.host).toBe('github.com');
      expect(config.apiUrl).toBe('https://api.github.com');
      expect(config.orgName).toBe('sk8metalme');
      expect(config.webUrl).toBe('https://github.com');
    });
  });

  describe('GitHub Enterprise対応', () => {
    it('カスタムホストが設定された場合、API URLを自動導出すること', () => {
      process.env.GITHUB_HOST = 'github.example.com';

      const config = getGitHubConfig();

      expect(config.host).toBe('github.example.com');
      expect(config.apiUrl).toBe('https://github.example.com/api/v3');
      expect(config.webUrl).toBe('https://github.example.com');
    });

    it('カスタムAPI URLが設定された場合、それを優先すること', () => {
      process.env.GITHUB_HOST = 'github.example.com';
      process.env.GITHUB_API_URL = 'https://api.github.example.com';

      const config = getGitHubConfig();

      expect(config.apiUrl).toBe('https://api.github.example.com');
    });

    it('カスタム組織名が設定された場合、それを使用すること', () => {
      process.env.GITHUB_ORG_NAME = 'my-org';

      const config = getGitHubConfig();

      expect(config.orgName).toBe('my-org');
    });

    it('すべての環境変数が設定された場合、それらを使用すること', () => {
      process.env.GITHUB_HOST = 'github.example.com';
      process.env.GITHUB_API_URL = 'https://custom-api.example.com';
      process.env.GITHUB_ORG_NAME = 'my-company';

      const config = getGitHubConfig();

      expect(config.host).toBe('github.example.com');
      expect(config.apiUrl).toBe('https://custom-api.example.com');
      expect(config.orgName).toBe('my-company');
      expect(config.webUrl).toBe('https://github.example.com');
    });
  });

  describe('後方互換性', () => {
    it('GITHUB_HOSTのみ設定時、他はデフォルト値を使用すること', () => {
      process.env.GITHUB_HOST = 'github.example.com';
      delete process.env.GITHUB_API_URL;
      delete process.env.GITHUB_ORG_NAME;

      const config = getGitHubConfig();

      expect(config.host).toBe('github.example.com');
      expect(config.apiUrl).toBe('https://github.example.com/api/v3');
      expect(config.orgName).toBe('sk8metalme'); // デフォルト
      expect(config.webUrl).toBe('https://github.example.com');
    });

    it('GITHUB_ORG_NAMEのみ設定時、他はデフォルト値を使用すること', () => {
      delete process.env.GITHUB_HOST;
      delete process.env.GITHUB_API_URL;
      process.env.GITHUB_ORG_NAME = 'new-org';

      const config = getGitHubConfig();

      expect(config.host).toBe('github.com'); // デフォルト
      expect(config.apiUrl).toBe('https://api.github.com'); // デフォルト
      expect(config.orgName).toBe('new-org');
      expect(config.webUrl).toBe('https://github.com');
    });
  });
});
