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
exports.Lineup = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const room_entity_1 = require("./room.entity");
const game_day_entity_1 = require("../nba/game-day.entity");
let Lineup = class Lineup {
};
exports.Lineup = Lineup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Lineup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Lineup.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], Lineup.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => room_entity_1.Room, (r) => r.lineups),
    (0, typeorm_1.JoinColumn)({ name: 'room_id' }),
    __metadata("design:type", room_entity_1.Room)
], Lineup.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'room_id' }),
    __metadata("design:type", Number)
], Lineup.prototype, "roomId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => game_day_entity_1.GameDay),
    (0, typeorm_1.JoinColumn)({ name: 'game_day_id' }),
    __metadata("design:type", game_day_entity_1.GameDay)
], Lineup.prototype, "gameDay", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'game_day_id' }),
    __metadata("design:type", Number)
], Lineup.prototype, "gameDayId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pg_id' }),
    __metadata("design:type", Number)
], Lineup.prototype, "pgId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sg_id' }),
    __metadata("design:type", Number)
], Lineup.prototype, "sgId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sf_id' }),
    __metadata("design:type", Number)
], Lineup.prototype, "sfId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pf_id' }),
    __metadata("design:type", Number)
], Lineup.prototype, "pfId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'c_id' }),
    __metadata("design:type", Number)
], Lineup.prototype, "cId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_cost', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Lineup.prototype, "totalCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_score', type: 'decimal', precision: 8, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Lineup.prototype, "totalScore", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Lineup.prototype, "createdAt", void 0);
exports.Lineup = Lineup = __decorate([
    (0, typeorm_1.Entity)('app_lineups'),
    (0, typeorm_1.Index)(['userId', 'roomId', 'gameDayId'], { unique: true })
], Lineup);
//# sourceMappingURL=lineup.entity.js.map