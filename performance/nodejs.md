# Performance - Nodejs

## N+1問題の回避

- **重要度**: warning
- **発生回数**: 2
- **概要**: ループ内でDB問い合わせを実行している
- **推奨対応**: 一括取得またはJOINを使用する
- **対象ファイル例**: `src/services/user-service.js`
- **参照PR**:
  - https://github.com/org/repo/pull/124

---
## N+1クエリ問題

- **重要度**: warning
- **発生回数**: 1
- **概要**: ループ内でデータベースクエリを実行している
- **推奨対応**: バッチクエリやJOINを使用してクエリ回数を削減する
- **参照PR**:
  - https://github.com/test/repo/pull/1000

---
