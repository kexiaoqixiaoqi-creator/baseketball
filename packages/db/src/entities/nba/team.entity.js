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
exports.Team = void 0;
const typeorm_1 = require("typeorm");
const player_entity_1 = require("./player.entity");
let Team = class Team {
};
exports.Team = Team;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Team.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Team.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name_cn', length: 50 }),
    __metadata("design:type", String)
], Team.prototype, "nameCn", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Team.prototype, "market", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'market_cn', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Team.prototype, "marketCn", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => player_entity_1.Player, (p) => p.teamEntity),
    __metadata("design:type", Array)
], Team.prototype, "players", void 0);
exports.Team = Team = __decorate([
    (0, typeorm_1.Entity)('nba_teams')
], Team);
//# sourceMappingURL=team.entity.js.map