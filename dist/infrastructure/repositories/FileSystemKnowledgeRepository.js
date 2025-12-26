import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
/**
 * ファイルシステムベースのKnowledge Repository実装
 * scripts/apply-knowledge.js の parseKnowledgeFile() とファイルI/O部分から移行
 */
export class FileSystemKnowledgeRepository {
    baseDir;
    serializer;
    static ARCHIVE_SIZE_LIMIT = 10000;
    constructor(baseDir, serializer) {
        this.baseDir = baseDir;
        this.serializer = serializer;
    }
    /**
     * カテゴリ・言語から既存の知見を読み込む
     */
    async findByPath(category, language) {
        const filePath = this.getFilePath(category, language);
        if (!existsSync(filePath)) {
            return [];
        }
        const content = await readFile(filePath, 'utf-8');
        return this.serializer.deserialize(content);
    }
    /**
     * 知見をファイルに保存
     */
    async save(category, language, items) {
        const filePath = this.getFilePath(category, language);
        // ディレクトリが存在しない場合は作成
        await mkdir(dirname(filePath), { recursive: true });
        // Markdownに変換
        const content = this.serializer.serialize(category, language, items);
        // ファイルに書き出し
        await writeFile(filePath, content, 'utf-8');
    }
    /**
     * ファイルが存在するか確認
     */
    async exists(category, language) {
        const filePath = this.getFilePath(category, language);
        return existsSync(filePath);
    }
    /**
     * アーカイブファイルに保存
     */
    async archive(category, language, items) {
        const archivePath = this.getArchivePath(category, language);
        // アーカイブディレクトリを作成
        await mkdir(dirname(archivePath), { recursive: true });
        let archiveContent = '';
        // 既存のアーカイブファイルがあれば読み込み
        if (existsSync(archivePath)) {
            archiveContent = await readFile(archivePath, 'utf-8');
            // アーカイブファイルのサイズ制限チェック
            const existingItems = this.serializer.deserialize(archiveContent);
            if (existingItems.length + items.length > FileSystemKnowledgeRepository.ARCHIVE_SIZE_LIMIT) {
                console.warn(`Archive file too large: ${archivePath}. Rotating...`);
                // 古いアーカイブをローテーション
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const rotatedPath = archivePath.replace('.md', `-${timestamp}.md`);
                await writeFile(rotatedPath, archiveContent, 'utf-8');
                // 新しいアーカイブファイルを開始
                const categoryName = this.capitalize(category.getValue());
                const languageName = this.capitalize(language.getValue().replace('.md', ''));
                archiveContent = `# Archive: ${categoryName} - ${languageName}\n\n`;
            }
        }
        else {
            const categoryName = this.capitalize(category.getValue());
            const languageName = this.capitalize(language.getValue().replace('.md', ''));
            archiveContent = `# Archive: ${categoryName} - ${languageName}\n\n`;
        }
        // 新しいアイテムを追加
        for (const item of items) {
            archiveContent += this.itemToMarkdown(item);
        }
        await writeFile(archivePath, archiveContent, 'utf-8');
    }
    /**
     * ファイルパスを取得
     */
    getFilePath(category, language) {
        return join(this.baseDir, category.getValue(), `${language.getValue()}.md`);
    }
    /**
     * アーカイブパスを取得
     */
    getArchivePath(category, language) {
        return join(this.baseDir, 'archive', category.getValue(), `${language.getValue()}.md`);
    }
    /**
     * 個別アイテムをMarkdownに変換（アーカイブ用）
     */
    itemToMarkdown(item) {
        const plain = item.toPlainObject();
        let md = `## ${plain.title}\n\n`;
        md += `- **重要度**: ${plain.severity}\n`;
        md += `- **発生回数**: ${plain.occurrences}\n`;
        md += `- **概要**: ${plain.summary}\n`;
        md += `- **推奨対応**: ${plain.recommendation}\n`;
        if (plain.codeExample && (plain.codeExample.bad || plain.codeExample.good)) {
            md += `- **コード例**:\n`;
            if (plain.codeExample.bad) {
                md += `  \`\`\`\n  // NG\n  ${plain.codeExample.bad}\n  \`\`\`\n`;
            }
            if (plain.codeExample.good) {
                md += `  \`\`\`\n  // OK\n  ${plain.codeExample.good}\n  \`\`\`\n`;
            }
        }
        if (plain.targetFile) {
            md += `- **対象ファイル例**: \`${plain.targetFile}\`\n`;
        }
        if (plain.references && plain.references.length > 0) {
            md += `- **参照PR**:\n`;
            plain.references.forEach(ref => {
                md += `  - ${ref}\n`;
            });
        }
        md += `\n---\n`;
        return md;
    }
    /**
     * 文字列の先頭を大文字に
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
//# sourceMappingURL=FileSystemKnowledgeRepository.js.map