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
exports.Player = void 0;
const typeorm_1 = require("typeorm");
const player_season_stats_entity_1 = require("./player-season-stats.entity");
const game_player_stats_entity_1 = require("./game-player-stats.entity");
let Player = class Player {
};
exports.Player = Player;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Player.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Player.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['PG', 'SG', 'SF', 'PF', 'C'] }),
    __metadata("design:type", String)
], Player.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Player.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'jersey_number', length: 10 }),
    __metadata("design:type", String)
], Player.prototype, "jerseyNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Player.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => player_season_stats_entity_1.PlayerSeasonStats, (s) => s.player),
    __metadata("design:type", Array)
], Player.prototype, "seasonStats", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => game_player_stats_entity_1.GamePlayerStats, (gs) => gs.player),
    __metadata("design:type", Array)
], Player.prototype, "gameStats", void 0);
exports.Player = Player = __decorate([
    (0, typeorm_1.Entity)('players')
], Player);
//# sourceMappingURL=player.entity.js.map