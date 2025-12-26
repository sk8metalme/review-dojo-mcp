import { describe, it, expect } from 'vitest';
import { MarkdownSerializer } from '../../src/infrastructure/serializers/MarkdownSerializer.js';
import { KnowledgeItem } from '../../src/domain/entities/KnowledgeItem.js';
import { Category } from '../../src/domain/value-objects/Category.js';
import { Language } from '../../src/domain/value-objects/Language.js';

describe('MarkdownSerializer', () => {
  const serializer = new MarkdownSerializer();

  describe('serialize', () => {
    it('should generate valid markdown for complete knowledge item', () => {
      const item = KnowledgeItem.create({
        title: 'SQLインジェクション対策',
        severity: 'critical',
        summary: 'PreparedStatementを使用していない',
        recommendation: 'PreparedStatementを使用する',
        code_example: {
          bad: 'String sql = "SELECT * FROM users WHERE id = " + userId;',
          good: 'PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = ?");'
        },
        file_path: 'src/main/java/UserDao.java',
        pr_url: 'https://github.com/org/repo/pull/123'
      });

      // Add more occurrences
      item.merge({ pr_url: 'https://github.com/org/repo/pull/456' });
      item.merge({});

      const category = Category.fromString('security');
      const language = Language.fromString('java');
      const md = serializer.serialize(category, language, [item]);

      expect(md).toContain('# Security - Java');
      expect(md).toContain('## SQLインジェクション対策');
      expect(md).toContain('**重要度**: critical');
      expect(md).toContain('**発生回数**: 3');
      expect(md).toContain('**概要**: PreparedStatementを使用していない');
      expect(md).toContain('**推奨対応**: PreparedStatementを使用する');
      expect(md).toContain('// NG');
      expect(md).toContain('// OK');
      expect(md).toContain('src/main/java/UserDao.java');
      expect(md).toContain('https://github.com/org/repo/pull/123');
      expect(md).toContain('https://github.com/org/repo/pull/456');
      expect(md).toContain('---');
    });

    it('should handle item without code examples', () => {
      const item = KnowledgeItem.create({
        title: 'テスト対象',
        severity: 'info',
        summary: '概要',
        recommendation: '推奨対応'
      });

      const category = Category.fromString('testing');
      const language = Language.fromString('general');
      const md = serializer.serialize(category, language, [item]);

      expect(md).toContain('# Testing - General');
      expect(md).toContain('## テスト対象');
      expect(md).not.toContain('```');
    });

    it('should handle item with only bad code example', () => {
      const item = KnowledgeItem.create({
        title: 'テスト対象',
        severity: 'warning',
        summary: '概要',
        recommendation: '推奨対応',
        code_example: {
          bad: 'bad code here'
        }
      });

      // Merge to increment occurrence
      item.merge({});

      const category = Category.fromString('testing');
      const language = Language.fromString('general');
      const md = serializer.serialize(category, language, [item]);

      expect(md).toContain('## テスト対象');
      expect(md).toContain('**発生回数**: 2');
      expect(md).toContain('// NG');
      expect(md).toContain('bad code here');
      expect(md).not.toContain('// OK');
    });

    it('should handle multiple items', () => {
      const items = [
        KnowledgeItem.create({
          title: 'Item 1',
          severity: 'critical',
          summary: 'Summary 1',
          recommendation: 'Rec 1'
        }),
        KnowledgeItem.create({
          title: 'Item 2',
          severity: 'warning',
          summary: 'Summary 2',
          recommendation: 'Rec 2'
        })
      ];

      const category = Category.fromString('security');
      const language = Language.fromString('nodejs');
      const md = serializer.serialize(category, language, items);

      expect(md).toContain('# Security - Nodejs');
      expect(md).toContain('## Item 1');
      expect(md).toContain('## Item 2');
      expect(md.split('---').length).toBe(3); // Header + 2 items
    });
  });

  describe('deserialize', () => {
    it('should parse markdown back to knowledge items', () => {
      const markdown = `# Security - Java

## SQLインジェクション対策

- **重要度**: critical
- **発生回数**: 2
- **概要**: PreparedStatementを使用していない
- **推奨対応**: PreparedStatementを使用する
- **対象ファイル例**: \`src/main/java/UserDao.java\`
- **参照PR**:
  - https://github.com/org/repo/pull/123
  - https://github.com/org/repo/pull/456

---
`;

      const items = serializer.deserialize(markdown);

      expect(items).toHaveLength(1);
      expect(items[0].getTitle()).toBe('SQLインジェクション対策');
      expect(items[0].toPlainObject().severity).toBe('critical');
      expect(items[0].toPlainObject().occurrences).toBe(2);
    });

    it('should handle empty markdown', () => {
      const items = serializer.deserialize('# Test - General\n\n');
      expect(items).toHaveLength(0);
    });
  });
});
