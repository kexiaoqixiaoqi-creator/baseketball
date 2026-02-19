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
exports.GameDay = void 0;
const typeorm_1 = require("typeorm");
const game_entity_1 = require("./game.entity");
const lineup_entity_1 = require("./lineup.entity");
let GameDay = class GameDay {
};
exports.GameDay = GameDay;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GameDay.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], GameDay.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['pending', 'active', 'completed'],
        default: 'pending',
    }),
    __metadata("design:type", String)
], GameDay.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'salary_cap', type: 'int', default: 50000 }),
    __metadata("design:type", Number)
], GameDay.prototype, "salaryCap", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => game_entity_1.Game, (g) => g.gameDay),
    __metadata("design:type", Array)
], GameDay.prototype, "games", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lineup_entity_1.Lineup, (l) => l.gameDay),
    __metadata("design:type", Array)
], GameDay.prototype, "lineups", void 0);
exports.GameDay = GameDay = __decorate([
    (0, typeorm_1.Entity)('game_days')
], GameDay);
//# sourceMappingURL=game-day.entity.js.map