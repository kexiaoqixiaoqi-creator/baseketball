export const SALARY_CAP_OFFICIAL = 50_000;
export const COST_MIN = 3_000;
export const COST_MAX = 9_000;
export const CURRENT_SEASON = '2024-25';

export const SCORE_WEIGHTS_DEFAULT = {
  pts: 1.0,
  reb: 1.2,
  ast: 1.5,
  stl: 3.0,
  blk: 3.0,
  to: -1.0,
} as const;

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
export type Position = (typeof POSITIONS)[number];
