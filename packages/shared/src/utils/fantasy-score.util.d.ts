export interface StatLine {
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    to: number;
}
export interface ScoreWeights {
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    to: number;
}
export declare function computeFantasyScore(stats: StatLine, weights?: ScoreWeights): number;
export declare function normalizeToCost(rawScore: number, globalMin: number, globalMax: number): number;
export declare function computePlayerCosts(players: Array<{
    id: number;
    stats: StatLine;
}>, weights?: ScoreWeights): Map<number, number>;
