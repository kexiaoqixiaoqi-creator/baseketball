"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeFantasyScore = computeFantasyScore;
exports.normalizeToCost = normalizeToCost;
exports.computePlayerCosts = computePlayerCosts;
const game_constants_1 = require("../constants/game.constants");
function computeFantasyScore(stats, weights = game_constants_1.SCORE_WEIGHTS_DEFAULT) {
    return (stats.pts * weights.pts +
        stats.reb * weights.reb +
        stats.ast * weights.ast +
        stats.stl * weights.stl +
        stats.blk * weights.blk +
        stats.to * weights.to);
}
function normalizeToCost(rawScore, globalMin, globalMax) {
    if (globalMax === globalMin) {
        return Math.round(((game_constants_1.COST_MIN + game_constants_1.COST_MAX) / 2) / 100) * 100;
    }
    const ratio = (rawScore - globalMin) / (globalMax - globalMin);
    const cost = game_constants_1.COST_MIN + ratio * (game_constants_1.COST_MAX - game_constants_1.COST_MIN);
    return Math.round(cost / 100) * 100;
}
function computePlayerCosts(players, weights = game_constants_1.SCORE_WEIGHTS_DEFAULT) {
    const scores = players.map((p) => ({
        id: p.id,
        score: computeFantasyScore(p.stats, weights),
    }));
    const rawScores = scores.map((s) => s.score);
    const globalMin = Math.min(...rawScores);
    const globalMax = Math.max(...rawScores);
    const result = new Map();
    for (const { id, score } of scores) {
        result.set(id, normalizeToCost(score, globalMin, globalMax));
    }
    return result;
}
//# sourceMappingURL=fantasy-score.util.js.map