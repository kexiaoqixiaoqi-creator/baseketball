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
exports.Game = void 0;
const typeorm_1 = require("typeorm");
const game_day_entity_1 = require("./game-day.entity");
const game_player_stats_entity_1 = require("./game-player-stats.entity");
let Game = class Game {
};
exports.Game = Game;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Game.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => game_day_entity_1.GameDay, (gd) => gd.games),
    (0, typeorm_1.JoinColumn)({ name: 'game_day_id' }),
    __metadata("design:type", game_day_entity_1.GameDay)
], Game.prototype, "gameDay", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'game_day_id' }),
    __metadata("design:type", Number)
], Game.prototype, "gameDayId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'home_team', length: 50 }),
    __metadata("design:type", String)
], Game.prototype, "homeTeam", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'away_team', length: 50 }),
    __metadata("design:type", String)
], Game.prototype, "awayTeam", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['scheduled', 'in_progress', 'completed'],
        default: 'scheduled',
    }),
    __metadata("design:type", String)
], Game.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => game_player_stats_entity_1.GamePlayerStats, (gps) => gps.game),
    __metadata("design:type", Array)
], Game.prototype, "playerStats", void 0);
exports.Game = Game = __decorate([
    (0, typeorm_1.Entity)('games')
], Game);
//# sourceMappingURL=game.entity.js.map