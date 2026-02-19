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
exports.Room = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const room_member_entity_1 = require("./room-member.entity");
const lineup_entity_1 = require("./lineup.entity");
let Room = class Room {
};
exports.Room = Room;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Room.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Room.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", Object)
], Room.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', nullable: true }),
    __metadata("design:type", Object)
], Room.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_official', default: false }),
    __metadata("design:type", Boolean)
], Room.prototype, "isOfficial", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', name: 'pts_weight', default: 1.0 }),
    __metadata("design:type", Number)
], Room.prototype, "ptsWeight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', name: 'reb_weight', default: 1.2 }),
    __metadata("design:type", Number)
], Room.prototype, "rebWeight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', name: 'ast_weight', default: 1.5 }),
    __metadata("design:type", Number)
], Room.prototype, "astWeight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', name: 'stl_weight', default: 3.0 }),
    __metadata("design:type", Number)
], Room.prototype, "stlWeight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', name: 'blk_weight', default: 3.0 }),
    __metadata("design:type", Number)
], Room.prototype, "blkWeight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', name: 'to_weight', default: -1.0 }),
    __metadata("design:type", Number)
], Room.prototype, "toWeight", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'salary_cap', type: 'int', default: 50000 }),
    __metadata("design:type", Number)
], Room.prototype, "salaryCap", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Room.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => room_member_entity_1.RoomMember, (rm) => rm.room),
    __metadata("design:type", Array)
], Room.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lineup_entity_1.Lineup, (l) => l.room),
    __metadata("design:type", Array)
], Room.prototype, "lineups", void 0);
exports.Room = Room = __decorate([
    (0, typeorm_1.Entity)('app_rooms')
], Room);
//# sourceMappingURL=room.entity.js.map