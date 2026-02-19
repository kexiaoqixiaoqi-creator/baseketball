import { SCORE_WEIGHTS_DEFAULT, COST_MIN, COST_MAX } from '../constants/game.constants';

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
 * Normalize a raw fantasy score to the cost range [COST_MIN, COST_MAX].
 * Requires the global min and max across ALL players for that snapshot.
 */
export function normalizeToCost(
  rawScore: number,
  globalMin: number,
  globalMax: number,
): number {
  if (globalMax === globalMin) {
    return Math.round(((COST_MIN + COST_MAX) / 2) / 100) * 100;
  }
  const ratio = (rawScore - globalMin) / (globalMax - globalMin);
  const cost = COST_MIN + ratio * (COST_MAX - COST_MIN);
  return Math.round(cost / 100) * 100;
}

/**
 * Compute costs for an entire player pool in one pass.
 * Returns a map of player_id -> cost.
 */
export function computePlayerCosts(
  players: Array<{ id: number; stats: StatLine }>,
  weights: ScoreWeights = SCORE_WEIGHTS_DEFAULT,
): Map<number, number> {
  const scores = players.map((p) => ({
    id: p.id,
    score: computeFantasyScore(p.stats, weights),
  }));

  const rawScores = scores.map((s) => s.score);
  const globalMin = Math.min(...rawScores);
  const globalMax = Math.max(...rawScores);

  const result = new Map<number, number>();
  for (const { id, score } of scores) {
    result.set(id, normalizeToCost(score, globalMin, globalMax));
  }
  return result;
}
