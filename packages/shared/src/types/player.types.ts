import type { Position } from '../constants/game.constants';

export interface SeasonStatsDto {
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  topg: number;
  mpg: number;
  fantasyScore: number;
  cost: number;
}

export interface PlayerDto {
  id: number;
  name: string;
  position: Position;
  team: string;
  jerseyNumber: string;
  isActive: boolean;
  cost: number;
  seasonStats?: SeasonStatsDto;
}
