import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExtIdMap } from '@fantasy-nba/db';
import { MappingService } from './mapping.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExtIdMap])],
  providers: [MappingService],
  exports: [MappingService],
})
export class MappingModule {}
