import { PlayerSeasonStats } from './player-season-stats.entity';
import { GamePlayerStats } from './game-player-stats.entity';
import { Team } from './team.entity';
export declare class Player {
    id: number;
    name: string;
    nameCn: string | null;
    position: string;
    team: string;
    teamId: number | null;
    teamEntity: Team | null;
    jerseyNumber: string;
    isActive: boolean;
    seasonStats: PlayerSeasonStats[];
    gameStats: GamePlayerStats[];
}
