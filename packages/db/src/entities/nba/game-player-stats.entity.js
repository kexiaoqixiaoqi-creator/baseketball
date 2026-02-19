"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamePlayerStats = void 0;
const typeorm_1 = require("typeorm");
const game_entity_1 = require("./game.entity");
const player_entity_1 = require("./player.entity");
let GamePlayerStats = class GamePlayerStats {
};
exports.GamePlayerStats = GamePlayerStats;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => game_entity_1.Game, (g) => g.playerStats),
    (0, typeorm_1.JoinColumn)({ name: 'game_id' }),
    __metadata("design:type", game_entity_1.Game)
], GamePlayerStats.prototype, "game", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'game_id' }),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "gameId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => player_entity_1.Player, (p) => p.gameStats),
    (0, typeorm_1.JoinColumn)({ name: 'player_id' }),
    __metadata("design:type", player_entity_1.Player)
], GamePlayerStats.prototype, "player", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'player_id' }),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "pts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "reb", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "ast", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "stl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "blk", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'to_val', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "toVal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "min", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2, default: 0, name: 'fantasy_score' }),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "fantasyScore", void 0);
exports.GamePlayerStats = GamePlayerStats = __decorate([
    (0, typeorm_1.Entity)('nba_game_player_stats')
], GamePlayerStats);
//# sourceMappingURL=game-player-stats.entity.js.map