# PR Review Knowledge System

GitHub PRのレビューコメントから有益な指摘を自動収集・蓄積し、実装時に活用できる仕組み。

## ドキュメント

| ドキュメント | 内容 | 対象者 |
|-------------|------|--------|
| [統合ガイド](docs/integration-guide.md) | 本番導入・CI/CD連携・MCPサーバー設定 | 導入担当者 |
| [MCP技術仕様](docs/mcp-server-spec.md) | MCPサーバーの詳細仕様・API | 開発者 |
| [トラブルシューティング](docs/troubleshooting.md) | よくある問題と解決方法 | 全ユーザー |

## 概要

- **目的**: PRレビューで得られた知見をチームで共有し、同じミスの再発を防止
- **対象**: GitHub Organization内のpublicリポジトリ

### 実装状況

| Phase | 機能 | ステータス |
|-------|------|----------|
| Phase 1 | PRマージ時の自動収集・Markdown蓄積 | 完了 |
| Phase 2 | MCPサーバー（Claude Code連携） | 完了 |
| Phase 3 | CI/CD連携（PR自動コメント） | 完了 |

## クイックスタート

### ローカルで試す（2分）

```bash
git clone https://github.com/yourorg/review-dojo-mcp.git
cd review-dojo-mcp
npm install
npm run build
npm test
```

### MCPサーバーを試す（3分）

```bash
# Claude Code の設定に追加
claude mcp add review-dojo node $(pwd)/dist/interfaces/mcp/McpServer.js
```

Claude Code で「Javaのセキュリティに関する知見を検索して」と質問して動作確認。

### 本番導入

自組織への完全な導入手順は **[統合ガイド](docs/integration-guide.md)** を参照してください：
- Phase 1: 知見収集システム（30-45分）
- Phase 2: MCPサーバー導入（10-15分）
- Phase 3: CI/CD連携（15-20分）

## GitHub Enterprise対応

GitHub Enterprise (GHE) 環境で使用する場合は、以下の環境変数を設定してください。

### 環境変数

| 環境変数 | 説明 | デフォルト値 | 例 |
|---------|------|------------|-----|
| `GITHUB_HOST` | GitHubホスト名 | `github.com` | `github.example.com` |
| `GITHUB_API_URL` | GitHub API URL | `https://api.github.com` | `https://github.example.com/api/v3` |
| `GITHUB_ORG_NAME` | 組織名 | `yourorg` | `my-org` |

### 設定例

#### MCP設定（claude_desktop_config.json）

```json
{
  "mcpServers": {
    "review-dojo": {
      "command": "node",
      "args": ["/path/to/review-dojo-mcp/dist/interfaces/mcp/McpServer.js"],
      "env": {
        "GITHUB_HOST": "github.example.com",
        "GITHUB_API_URL": "https://github.example.com/api/v3",
        "GITHUB_ORG_NAME": "my-org",
        "GITHUB_TOKEN": "ghp_xxx",
        "REVIEW_DOJO_GITHUB_REPO": "my-org/review-dojo-knowledge"
      }
    }
  }
}
```

#### GitHub Actions

GitHub Actionsでは、Repository Variables を使用してカスタマイズできます：

| Variable | 用途 | 例 |
|---------|------|-----|
| `KNOWLEDGE_REPO` | 知見リポジトリ | `my-org/review-dojo-knowledge` |
| `REVIEW_DOJO_ACTION` | review-dojo-action の参照 | `my-org/review-dojo-action` |
| `REVIEW_DOJO_ACTION_VERSION` | action のバージョン | `v1` |

詳細は **[統合ガイド](docs/integration-guide.md)** を参照してください。

## Phase機能一覧

### Phase 1: 知見収集（MVP）

PRマージ時に自動的にレビューコメントを収集・分析し、カテゴリ別にMarkdownファイルへ蓄積。

- Claude Codeによる AI分析・抽出
- 類似知見のマージ・発生回数カウント
- 機密情報の自動マスク
- 100件/ファイル上限でアーカイブ

### Phase 2: MCPサーバー

Claude Code から蓄積された知見を検索・参照。

- `search_knowledge`: 知見検索（カテゴリ・言語・重要度でフィルタ）
- `get_knowledge_detail`: 知見詳細取得
- `generate_pr_checklist`: 変更ファイルから関連知見をチェックリスト化
- `list_categories` / `list_languages`: メタデータ取得

詳細: [MCP技術仕様](docs/mcp-server-spec.md)

### Phase 3: CI/CD連携

PR作成時に関連知見を自動コメント。GitHub Actions / Screwdriver CI対応。

詳細: [統合ガイド](docs/integration-guide.md#phase-3-cicd連携)

## システム構成

```
┌─────────────────────────────────────────┐
│         各リポジトリ                     │
│  ┌────────────────────────────────┐     │
│  │ PR マージ                       │     │
│  └────────┬───────────────────────┘     │
│           │ repository_dispatch          │
└───────────┼─────────────────────────────┘
            ▼
┌─────────────────────────────────────────┐
│      review-dojo (knowledge-repo)       │
│  1. PRコメント取得                       │
│  2. Claude Code で分析                   │
│  3. 知見抽出・Markdown更新               │
└─────────────────────────────────────────┘
```

### アーキテクチャ

オニオンアーキテクチャ（4層）を採用：

| 層 | 責務 | 主要コンポーネント |
|----|------|-------------------|
| Interfaces | エントリーポイント | McpServer, CheckKnowledgeCli |
| Application | ユースケース | SearchKnowledgeUseCase, GeneratePRChecklistUseCase |
| Domain | ビジネスロジック | KnowledgeFile, KnowledgeItem, SensitiveInfoMasker |
| Infrastructure | 外部連携 | FileSystemKnowledgeRepository, MarkdownSerializer |

依存関係ルールは `ts-arch` で自動検証: `npm test tests/architecture`

## ディレクトリ構造

```
review-dojo/
├── src/                # TypeScript ソースコード（オニオンアーキテクチャ）
│   ├── domain/         # ドメイン層（ビジネスロジック）
│   ├── application/    # アプリケーション層（ユースケース）
│   ├── infrastructure/ # インフラ層（ファイルI/O、シリアライズ）
│   └── interfaces/     # インターフェース層（CLI、MCP Server）
├── dist/               # ビルド出力（src/のコンパイル結果）
├── tests/              # テストコード
│   ├── domain/         # ドメイン層のテスト
│   ├── infrastructure/ # インフラ層のテスト
│   └── architecture/   # アーキテクチャテスト（ts-arch）
├── security/           # セキュリティ関連知見
├── performance/        # パフォーマンス関連知見
├── readability/        # 可読性・命名関連知見
├── design/             # 設計・アーキテクチャ関連知見
├── testing/            # テスト関連知見
├── error-handling/     # エラーハンドリング関連知見
├── other/              # その他
└── archive/            # アーカイブ（100件超過時）
```

## 知見のフォーマット

```markdown
## SQLインジェクション対策

- **重要度**: critical
- **発生回数**: 3
- **概要**: PreparedStatementを使用せず文字列結合でSQLを組み立てている
- **推奨対応**: 必ずPreparedStatementまたはORMのパラメータバインディングを使用する
- **コード例**:
  ```java
  // NG
  String sql = "SELECT * FROM users WHERE id = " + userId;
  ```
  ```java
  // OK
  PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
  ```
- **対象ファイル例**: `src/main/java/UserDao.java`
- **参照PR**:
  - https://github.com/org/repo/pull/123
  - https://github.com/org/repo/pull/456

---
```

## 開発

### ビルド

```bash
# TypeScriptをビルド
npm run build

# 開発時の自動ビルド（ウォッチモード）
npm run build -- --watch
```

### テスト

```bash
# 単体テスト実行
npm test

# カバレッジ確認
npm run test:coverage

# UI モード
npm run test:ui

# アーキテクチャテスト（ts-arch）
# オニオンアーキテクチャの依存関係ルールを検証
npm test tests/architecture
```

## ライセンス

MIT

## 参考資料

- [plan.md](./plan.md) - 詳細な設計書
- [統合ガイド](docs/integration-guide.md) - 導入手順書
