import { Octokit } from '@octokit/rest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import semver from 'semver';

export interface VersionCheckResult {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  updateCommand: string;
}

/**
 * review-dojoの更新チェック
 * @param installDir review-dojoがインストールされているディレクトリ（省略時は自動検出）
 * @returns 更新情報、またはエラー時はnull
 */
export async function checkForUpdates(installDir?: string): Promise<VersionCheckResult | null> {
  try {
    const octokit = new Octokit();

    // 最新リリースを取得
    const { data: release } = await octokit.repos.getLatestRelease({
      owner: 'sk8metalme',
      repo: 'review-dojo',
    });

    // インストールディレクトリの自動検出
    if (!installDir) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      // dist/interfaces/mcp から../../.. でルートへ
      installDir = join(__dirname, '../../..');
    }

    // ローカルバージョンを取得
    const packageJsonPath = join(installDir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const currentVersion = packageJson.version;

    // タグ名から "v" プレフィックスを除去
    const latestVersion = release.tag_name.replace(/^v/, '');

    // semverでバージョン比較
    const updateAvailable = semver.gt(latestVersion, currentVersion);

    return {
      currentVersion,
      latestVersion,
      updateAvailable,
      updateCommand: `cd ${installDir} && git pull && npm install && npm run build`,
    };
  } catch (error) {
    // ネットワークエラー、API制限などは無視（オフライン動作を妨げない）
    if (error && typeof error === 'object' && 'status' in error) {
      console.error(`[review-dojo] Version check failed (HTTP ${error.status})`);
    }
    return null;
  }
}
