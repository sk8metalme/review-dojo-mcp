#!/usr/bin/env node

import { ApplyKnowledgeCli } from './interfaces/cli/ApplyKnowledgeCli.js';

/**
 * メインエントリーポイント
 */
async function main() {
  const cli = new ApplyKnowledgeCli();
  const args = process.argv.slice(2);
  await cli.run(args);
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
