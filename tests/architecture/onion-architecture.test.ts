import { describe, it } from 'vitest';
import { filesOfProject } from 'tsarch';
import path from 'path';

/**
 * Onion Architecture Tests
 *
 * レイヤー間の依存関係を検証：
 * - Domain: 他のレイヤーに依存しない
 * - Application: Domainのみに依存
 * - Infrastructure: Interfacesに依存しない
 * - すべてのレイヤー: 循環依存を持たない
 */

const srcPath = path.resolve(__dirname, '../../src');

describe('Onion Architecture Rules', () => {
  describe('Domain Layer Independence', () => {
    it('should not depend on Application layer', async () => {
      const rule = filesOfProject()
        .inFolder(path.join(srcPath, 'domain'))
        .shouldNot()
        .dependOnFiles()
        .inFolder(path.join(srcPath, 'application'));

      await rule.check();
    });

    it('should not depend on Infrastructure layer', async () => {
      const rule = filesOfProject()
        .inFolder(path.join(srcPath, 'domain'))
        .shouldNot()
        .dependOnFiles()
        .inFolder(path.join(srcPath, 'infrastructure'));

      await rule.check();
    });

    it('should not depend on Interfaces layer', async () => {
      const rule = filesOfProject()
        .inFolder(path.join(srcPath, 'domain'))
        .shouldNot()
        .dependOnFiles()
        .inFolder(path.join(srcPath, 'interfaces'));

      await rule.check();
    });
  });

  describe('Application Layer Dependencies', () => {
    it('should not depend on Infrastructure layer', async () => {
      const rule = filesOfProject()
        .inFolder(path.join(srcPath, 'application'))
        .shouldNot()
        .dependOnFiles()
        .inFolder(path.join(srcPath, 'infrastructure'));

      await rule.check();
    });

    it('should not depend on Interfaces layer', async () => {
      const rule = filesOfProject()
        .inFolder(path.join(srcPath, 'application'))
        .shouldNot()
        .dependOnFiles()
        .inFolder(path.join(srcPath, 'interfaces'));

      await rule.check();
    });
  });

  describe('Infrastructure Layer Dependencies', () => {
    it('should not depend on Interfaces layer', async () => {
      const rule = filesOfProject()
        .inFolder(path.join(srcPath, 'infrastructure'))
        .shouldNot()
        .dependOnFiles()
        .inFolder(path.join(srcPath, 'interfaces'));

      await rule.check();
    });
  });

  describe('Cycle Detection', () => {
    it('should not have circular dependencies', async () => {
      const rule = filesOfProject()
        .inFolder(srcPath)
        .should()
        .beFreeOfCycles();

      await rule.check();
    });
  });
});
