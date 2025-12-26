import { describe, it, expect } from 'vitest';
import { ExactTitleMatcher } from '../../src/domain/services/matchers/ExactTitleMatcher.js';
import { KnowledgeItem } from '../../src/domain/entities/KnowledgeItem.js';

describe('ExactTitleMatcher', () => {
  const matcher = new ExactTitleMatcher();

  describe('findSimilar', () => {
    const existingItems = [
      KnowledgeItem.create({
        title: 'SQLインジェクション対策',
        severity: 'critical',
        summary: '概要1',
        recommendation: '推奨1'
      }),
      KnowledgeItem.create({
        title: 'N+1問題の回避',
        severity: 'warning',
        summary: '概要2',
        recommendation: '推奨2'
      }),
      KnowledgeItem.create({
        title: 'XSS対策',
        severity: 'critical',
        summary: '概要3',
        recommendation: '推奨3'
      })
    ];

    it('should find exact match (case insensitive)', () => {
      const newItem = { title: 'sqlインジェクション対策' };
      const similar = matcher.findSimilar(newItem, existingItems);
      expect(similar).toBeDefined();
      expect(similar?.getTitle()).toBe('SQLインジェクション対策');
    });

    it('should return null if no match', () => {
      const newItem = { title: 'CSRF対策' };
      const similar = matcher.findSimilar(newItem, existingItems);
      expect(similar).toBeNull();
    });

    it('should find exact match with different case', () => {
      const newItem = { title: 'xss対策' };
      const similar = matcher.findSimilar(newItem, existingItems);
      expect(similar).toBeDefined();
      expect(similar?.getTitle()).toBe('XSS対策');
    });

    it('should return null for empty array', () => {
      const newItem = { title: 'SQLインジェクション対策' };
      const similar = matcher.findSimilar(newItem, []);
      expect(similar).toBeNull();
    });
  });
});
