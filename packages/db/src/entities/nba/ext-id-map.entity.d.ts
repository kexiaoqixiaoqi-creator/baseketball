export type ExtEntityType = 'team' | 'player' | 'game';
export declare class ExtIdMap {
    id: number;
    source: string;
    entityType: ExtEntityType;
    extId: string;
    internalId: number;
    createdAt: Date;
}
