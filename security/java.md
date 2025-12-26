# Security - Java

## SQLインジェクション対策

- **重要度**: critical
- **発生回数**: 3
- **概要**: PreparedStatementを使用せず文字列結合でSQLを組み立てている
- **推奨対応**: 必ずPreparedStatementまたはORMのパラメータバインディングを使用する
- **対象ファイル例**: `src/main/java/com/example/UserDao.java`
- **参照PR**:
  - https://github.com/sk8metalme/review-dojo/pull/11
  - https://github.com/org/repo/pull/123
  - https://github.com/test/repo/pull/999

---
