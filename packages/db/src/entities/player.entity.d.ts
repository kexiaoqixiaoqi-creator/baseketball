import { PlayerSeasonStats } from './player-season-stats.entity';
import { GamePlayerStats } from './game-player-stats.entity';
export declare class Player {
    id: number;
    name: string;
    position: string;
    team: string;
    jerseyNumber: string;
    isActive: boolean;
    seasonStats: PlayerSeasonStats[];
    gameStats: GamePlayerStats[];
}
