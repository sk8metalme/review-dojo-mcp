import { getGitHubConfig } from '../../config/github.js';

/**
 * Pull RequestのURL参照を表すValue Object
 */
export class PRReference {
  /**
   * ホスト名を正規表現用にエスケープ
   */
  private static escapeHostForRegex(host: string): string {
    return host.replace(/\./g, '\\.');
  }

  /**
   * GitHub PR URLパターンを動的に生成
   * GitHub Enterprise対応のため、ホスト名を環境変数から取得
   */
  private static getGitHubPRPattern(): RegExp {
    const { host } = getGitHubConfig();
    const escapedHost = PRReference.escapeHostForRegex(host);
    return new RegExp(`^https:\\/\\/${escapedHost}\\/[^/]+\\/[^/]+\\/pull\\/\\d+$`);
  }

  private constructor(private readonly url: string) {}

  static create(url: string): PRReference {
    if (!url || typeof url !== 'string') {
      throw new Error('PR reference URL must be a non-empty string');
    }

    // GitHub PR URLの形式をチェック
    if (!PRReference.getGitHubPRPattern().test(url)) {
      const { host } = getGitHubConfig();
      throw new Error(
        `Invalid PR reference URL: ${url}. Must be a GitHub PR URL (e.g., https://${host}/owner/repo/pull/123)`
      );
    }

    return new PRReference(url);
  }

  getUrl(): string {
    return this.url;
  }

  /**
   * PR番号を抽出
   */
  getPRNumber(): number {
    const match = this.url.match(/\/pull\/(\d+)$/);
    if (!match) {
      throw new Error(`Failed to extract PR number from URL: ${this.url}`);
    }
    return parseInt(match[1], 10);
  }

  /**
   * リポジトリオーナーを抽出
   */
  getOwner(): string {
    const { host } = getGitHubConfig();
    const escapedHost = PRReference.escapeHostForRegex(host);
    const match = this.url.match(new RegExp(`${escapedHost}\\/([^/]+)\\/`));
    if (!match) {
      throw new Error(`Failed to extract owner from URL: ${this.url}`);
    }
    return match[1];
  }

  /**
   * リポジトリ名を抽出
   */
  getRepository(): string {
    const { host } = getGitHubConfig();
    const escapedHost = PRReference.escapeHostForRegex(host);
    const match = this.url.match(new RegExp(`${escapedHost}\\/[^/]+\\/([^/]+)\\/`));
    if (!match) {
      throw new Error(`Failed to extract repository from URL: ${this.url}`);
    }
    return match[1];
  }

  equals(other: PRReference): boolean {
    return this.url === other.url;
  }

  toString(): string {
    return this.url;
  }
}
