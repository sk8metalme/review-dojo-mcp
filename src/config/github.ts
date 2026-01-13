/**
 * GitHub設定を環境変数から解決
 * GitHub Enterprise移行対応
 */
export interface GitHubConfig {
  /** GitHubホスト名 (例: github.com or github.example.com) */
  host: string;
  /** GitHub API URL (例: https://api.github.com or https://github.example.com/api/v3) */
  apiUrl: string;
  /** 組織名 (例: sk8metalme or my-org) */
  orgName: string;
  /** GitHub Web URL (例: https://github.com or https://github.example.com) */
  webUrl: string;
}

/**
 * 環境変数からGitHub設定を取得
 *
 * @returns GitHub設定オブジェクト
 *
 * @example
 * // デフォルト（github.com）
 * const config = getGitHubConfig();
 * // => { host: 'github.com', apiUrl: 'https://api.github.com', orgName: 'sk8metalme', webUrl: 'https://github.com' }
 *
 * @example
 * // GitHub Enterprise
 * process.env.GITHUB_HOST = 'github.example.com';
 * process.env.GITHUB_ORG_NAME = 'my-org';
 * const config = getGitHubConfig();
 * // => { host: 'github.example.com', apiUrl: 'https://github.example.com/api/v3', orgName: 'my-org', webUrl: 'https://github.example.com' }
 */
export function getGitHubConfig(): GitHubConfig {
  const host = process.env.GITHUB_HOST || 'github.com';
  const isGHE = host !== 'github.com';

  return {
    host,
    apiUrl:
      process.env.GITHUB_API_URL || (isGHE ? `https://${host}/api/v3` : 'https://api.github.com'),
    orgName: process.env.GITHUB_ORG_NAME || 'sk8metalme',
    webUrl: `https://${host}`,
  };
}
