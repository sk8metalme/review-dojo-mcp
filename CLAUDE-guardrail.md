# Guardrail - 学習済みルール

このファイルは、会話履歴から自動的に学習した内容を蓄積します。

## プロジェクト仕様
<!-- リポジトリ独自の仕様、開発スタイル、設計方針 -->

- **2026-01-13** GitHub Enterprise対応では環境変数で設定を外部化する
  - GITHUB_HOST: GitHubホスト名（デフォルト: `github.com`）
  - GITHUB_API_URL: GitHub API URL（デフォルト: 自動検出）
  - GITHUB_ORG_NAME: 組織名（デフォルト: `sk8metalme`）
  - 設定は `src/config/github.ts` に中央集約し、各モジュールはこれを参照

- **2026-01-13** Value Objectパターンで動的設定に対応する
  - PRReference などの Value Object は静的パターンではなく、実行時に設定を読み込んで動的に検証
  - GitHub Enterprise のような環境依存の設定にも柔軟に対応できる設計

## エラー対応
<!-- 誤った作業、やり直した作業、ハマったポイント -->

- **2026-01-13** GitHub Actions の `workflow_call` input default には式を使用できない
  - 誤り: `default: ${{ vars.KNOWLEDGE_REPO || 'sk8metalme/review-dojo' }}`
  - 正しい: `default: 'sk8metalme/review-dojo'` （リテラル値のみ）
  - workflow_call の input default は静的な値のみ受け付ける

- **2026-01-13** GitHub Actions の `uses:` フィールドには動的式を使用できない
  - 誤り: `uses: ${{ vars.REVIEW_DOJO_ACTION || 'sk8metalme/review-dojo-action' }}@v1`
  - 正しい: `uses: sk8metalme/review-dojo-action@v1` （静的参照のみ）
  - actionlint で検出される問題。GitHub Actions の制約として uses は静的参照が必須

- **2026-01-13** 正規表現でホスト名をエスケープする際は全メタキャラクタをエスケープする
  - 不十分: `host.replace(/\./g, '\\.')` （ドットのみ）
  - 完全: `host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` （全メタキャラクタ）
  - ホスト名に `*`, `+`, `?` などが含まれる可能性があるため、完全なエスケープが必要

## コーディング規約
<!-- 指摘されたコーディングルール、スタイルガイド -->

- **2026-01-13** 重複コードは private static helper メソッドに抽出する
  - 同じロジック（例: `host.replace(/\./g, '\\.')`）が3回以上登場する場合は必ずメソッド化
  - 保守性とテストの容易さが向上

- **2026-01-13** セマンティックバージョニングを遵守する
  - 後方互換性のある新機能追加: MINOR バージョンを上げる（例: 2.5.0 → 2.6.0）
  - 後方互換性のない変更: MAJOR バージョンを上げる
  - バグ修正のみ: PATCH バージョンを上げる

## Tips
<!-- 調査して得られた知見、覚えておくべき情報 -->

- **2026-01-13** GitHub Enterprise の API URL パターン
  - GitHub.com: `https://api.github.com`
  - GitHub Enterprise: `https://${host}/api/v3`
  - Octokit の `baseUrl` オプションで指定可能

- **2026-01-13** JavaScript 正規表現の全メタキャラクタエスケープパターン
  - パターン: `/[.*+?^${}()|[\]\\]/g`
  - 置換: `'\\$&'` （マッチした文字列全体をバックスラッシュでエスケープ）
  - ユーザー入力を正規表現に使う際の標準的なエスケープ方法

- **2026-01-13** GitHub Actions の Repository Variables を使った設定管理
  - `${{ vars.VARIABLE_NAME }}` で Repository Variables を参照可能
  - フォールバック: `${{ vars.VAR || 'default-value' }}` パターン
  - ただし、workflow_call input default や uses: では式を使用できない制約に注意

---

最終更新: 2026-01-13
このファイルは `/guardrail-builder` スキルにより自動更新されます。
