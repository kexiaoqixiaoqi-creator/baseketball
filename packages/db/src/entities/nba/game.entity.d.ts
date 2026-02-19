import { GameDay } from './game-day.entity';
import { GamePlayerStats } from './game-player-stats.entity';
export declare class Game {
    id: number;
    gameDay: GameDay;
    gameDayId: number;
    homeTeam: string;
    awayTeam: string;
    status: string;
    playerStats: GamePlayerStats[];
}
