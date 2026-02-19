import { Game } from './game.entity';
import { Lineup } from './lineup.entity';
export declare class GameDay {
    id: number;
    date: string;
    status: string;
    salaryCap: number;
    games: Game[];
    lineups: Lineup[];
}
