/**
 * 知見がアーカイブされたイベント
 * 100件超過時に発火
 */
export class KnowledgeArchivedEvent {
    archivedCount;
    category;
    language;
    eventType = 'KnowledgeArchived';
    occurredOn;
    constructor(archivedCount, category, language) {
        this.archivedCount = archivedCount;
        this.category = category;
        this.language = language;
        this.occurredOn = new Date();
    }
}
//# sourceMappingURL=KnowledgeArchivedEvent.js.map