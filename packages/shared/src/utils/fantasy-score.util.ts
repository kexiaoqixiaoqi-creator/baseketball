import { LINEUP_SLOTS, SALARY_CAP_OFFICIAL, SCORE_WEIGHTS_DEFAULT } from '../constants/game.constants';

export interface StatLine {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
}

/** 赛季场均数据（ppg/rpg 等）格式，用于转换为 StatLine 计算范特西积分 */
export interface SeasonStatsLike {
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  topg: number;
}

export interface ScoreWeights {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
}

/**
 * 将赛季场均数据转换为 StatLine 格式
 */
export function seasonStatsToStatLine(
  stats: SeasonStatsLike | null | undefined,
): StatLine | null {
  if (!stats) return null;
  return {
    pts: Number(stats.ppg),
    reb: Number(stats.rpg),
    ast: Number(stats.apg),
    stl: Number(stats.spg),
    blk: Number(stats.bpg),
    to: Number(stats.topg),
  };
}

/**
 * 根据赛季场均数据和权重计算范特西积分（公共方法）
 */
export function computeFantasyScoreFromSeasonStats(
  stats: SeasonStatsLike | null | undefined,
  weights: ScoreWeights = SCORE_WEIGHTS_DEFAULT,
): number {
  const statLine = seasonStatsToStatLine(stats);
  if (!statLine) return 0;
  return computeFantasyScore(statLine, weights);
}

/**
 * Compute the fantasy score for a single player's stat line.
 * The weights parameter allows custom room overrides.
 */
export function computeFantasyScore(
  stats: StatLine,
  weights: ScoreWeights = SCORE_WEIGHTS_DEFAULT,
): number {
  return (
    stats.pts * weights.pts +
    stats.reb * weights.reb +
    stats.ast * weights.ast +
    stats.stl * weights.stl +
    stats.blk * weights.blk +
    stats.to * weights.to
  );
}

/**
 * 用 fantasy_score 公式计算球员 cost（赛季场均数据 × 房间权重，保留与薪资帽一致的千位量级）
 */
export function computeCostFromSeasonStats(
  stats: StatLine,
  weights: ScoreWeights = SCORE_WEIGHTS_DEFAULT,
): number {
  const raw = computeFantasyScore(stats, weights);
  return Math.round(raw * 1000);
}

/**
 * 根据赛季场均数据和权重直接计算 cost（封装 seasonStatsToStatLine + computeCostFromSeasonStats）
 */
export function computeCostFromSeasonStatsRaw(
  stats: SeasonStatsLike | null | undefined,
  weights: ScoreWeights = SCORE_WEIGHTS_DEFAULT,
): number {
  const statLine = seasonStatsToStatLine(stats);
  if (!statLine) return 0;
  return computeCostFromSeasonStats(statLine, weights);
}

/**
 * 根据当日可选球员的平均 cost 和房间系数计算 salaryCap
 * 公式: salaryCap = avgCost × LINEUP_SLOTS × coefficient
 * 若无有效球员，返回 fallback
 */
export function computeSalaryCapFromEligiblePlayers(
  costs: number[],
  coefficient: number,
  fallback?: number,
): number {
  const validCosts = costs.filter((c) => c > 0);
  if (validCosts.length === 0) return fallback ?? SALARY_CAP_OFFICIAL;
  const avgCost = validCosts.reduce((a, b) => a + b, 0) / validCosts.length;
  return Math.round(avgCost * LINEUP_SLOTS * coefficient);
}
