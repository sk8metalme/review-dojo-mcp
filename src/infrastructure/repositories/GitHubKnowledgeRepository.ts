import { Octokit } from '@octokit/rest';
import { KnowledgeItem } from '../../domain/entities/KnowledgeItem.js';
import { Category } from '../../domain/value-objects/Category.js';
import { Language } from '../../domain/value-objects/Language.js';
import { IKnowledgeRepository } from '../../application/ports/IKnowledgeRepository.js';
import { IMarkdownSerializer } from '../../application/ports/IMarkdownSerializer.js';

/**
 * GitHub API ベースの Knowledge Repository 実装（読み取り専用）
 * MCPサーバーのリモートモードで使用
 */
export class GitHubKnowledgeRepository implements IKnowledgeRepository {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private cache: Map<string, { data: KnowledgeItem[]; timestamp: number }>;
  private findAllCache: { data: Map<string, Map<string, KnowledgeItem[]>>; timestamp: number } | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分キャッシュ

  constructor(
    repoPath: string,
    private readonly serializer: IMarkdownSerializer,
    token?: string
  ) {
    const parts = repoPath.split('/');
    if (parts.length !== 2) {
      throw new Error(`Invalid repository path: ${repoPath}. Expected format: owner/repo`);
    }

    this.owner = parts[0];
    this.repo = parts[1];
    this.octokit = new Octokit({ auth: token });
    this.cache = new Map();
  }

  /**
   * カテゴリ・言語から既存の知見を読み込む
   */
  async findByPath(category: Category, language: Language): Promise<readonly KnowledgeItem[]> {
    const cacheKey = `${category.getValue()}/${language.getValue()}`;

    // キャッシュチェック
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const path = `${category.getValue()}/${language.getValue()}.md`;

      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      // ファイルでない場合（ディレクトリなど）はエラー
      if (Array.isArray(data) || data.type !== 'file') {
        return [];
      }

      // Base64デコード
      const content = Buffer.from(data.content, 'base64').toString('utf-8');

      // パース
      const items = this.serializer.deserialize(content);

      // キャッシュ更新
      this.cache.set(cacheKey, { data: [...items], timestamp: Date.now() });

      return items;
    } catch (error: unknown) {
      // 404の場合は空配列を返す
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * 知見をファイルに保存（リモートモードでは非対応）
   */
  async save(
    _category: Category,
    _language: Language,
    _items: readonly KnowledgeItem[]
  ): Promise<void> {
    throw new Error('save() is not supported in GitHub remote mode. Use local mode for writing.');
  }

  /**
   * ファイルが存在するか確認
   */
  async exists(category: Category, language: Language): Promise<boolean> {
    try {
      const path = `${category.getValue()}/${language.getValue()}.md`;

      await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * アーカイブファイルに保存（リモートモードでは非対応）
   */
  async archive(
    _category: Category,
    _language: Language,
    _items: readonly KnowledgeItem[]
  ): Promise<void> {
    throw new Error('archive() is not supported in GitHub remote mode. Use local mode for archiving.');
  }

  /**
   * すべての知見を読み込む（MCP検索用）
   */
  async findAll(): Promise<Map<string, Map<string, KnowledgeItem[]>>> {
    // 全体キャッシュチェック
    if (this.findAllCache && Date.now() - this.findAllCache.timestamp < this.CACHE_TTL) {
      return this.findAllCache.data;
    }

    const result = new Map<string, Map<string, KnowledgeItem[]>>();

    try {
      // ルートディレクトリのコンテンツを取得
      const { data: rootContents } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: '',
      });

      if (!Array.isArray(rootContents)) {
        return result;
      }

      // カテゴリディレクトリを処理
      for (const item of rootContents) {
        // ディレクトリでない、またはarchiveディレクトリはスキップ
        if (item.type !== 'dir' || item.name === 'archive' || item.name.startsWith('.')) {
          continue;
        }

        // カテゴリが有効かチェック
        try {
          const category = Category.fromString(item.name);
          const languageMap = new Map<string, KnowledgeItem[]>();

          // カテゴリディレクトリ内のファイルを取得
          const { data: categoryContents } = await this.octokit.repos.getContent({
            owner: this.owner,
            repo: this.repo,
            path: item.name,
          });

          if (!Array.isArray(categoryContents)) {
            continue;
          }

          // .mdファイルを処理
          for (const file of categoryContents) {
            if (file.type !== 'file' || !file.name.endsWith('.md')) {
              continue;
            }

            const languageName = file.name.replace(/\.md$/, '');

            // 言語が有効かチェック
            try {
              const language = Language.fromString(languageName);
              const items = await this.findByPath(category, language);
              languageMap.set(languageName, [...items]);
            } catch (error) {
              console.warn(`[review-dojo] Invalid language file: ${file.name}`, error);
            }
          }

          if (languageMap.size > 0) {
            result.set(item.name, languageMap);
          }
        } catch (error) {
          console.warn(`[review-dojo] Invalid category directory: ${item.name}`, error);
        }
      }

      // 全体キャッシュ更新
      this.findAllCache = { data: result, timestamp: Date.now() };

      return result;
    } catch (error) {
      console.error('[review-dojo] Error fetching knowledge from GitHub:', error);
      throw error;
    }
  }
}
