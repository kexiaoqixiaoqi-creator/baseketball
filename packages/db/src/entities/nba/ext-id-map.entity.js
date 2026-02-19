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
exports.ExtIdMap = void 0;
const typeorm_1 = require("typeorm");
let ExtIdMap = class ExtIdMap {
};
exports.ExtIdMap = ExtIdMap;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ExtIdMap.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ExtIdMap.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'entity_type' }),
    __metadata("design:type", String)
], ExtIdMap.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'ext_id' }),
    __metadata("design:type", String)
], ExtIdMap.prototype, "extId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'internal_id' }),
    __metadata("design:type", Number)
], ExtIdMap.prototype, "internalId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ExtIdMap.prototype, "createdAt", void 0);
exports.ExtIdMap = ExtIdMap = __decorate([
    (0, typeorm_1.Entity)('nba_ext_id_map'),
    (0, typeorm_1.Index)('uq_nba_ext_id_map', ['source', 'entityType', 'extId'], { unique: true })
], ExtIdMap);
//# sourceMappingURL=ext-id-map.entity.js.map