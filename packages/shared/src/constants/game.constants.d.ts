export declare const SALARY_CAP_OFFICIAL = 50000;
export declare const COST_MIN = 3000;
export declare const COST_MAX = 9000;
export declare const CURRENT_SEASON = "2024-25";
export declare const SCORE_WEIGHTS_DEFAULT: {
    readonly pts: 1;
    readonly reb: 1.2;
    readonly ast: 1.5;
    readonly stl: 3;
    readonly blk: 3;
    readonly to: -1;
};
export declare const POSITIONS: readonly ["PG", "SG", "SF", "PF", "C"];
export type Position = (typeof POSITIONS)[number];
export declare const LINEUP_POSITIONS: Position[];
