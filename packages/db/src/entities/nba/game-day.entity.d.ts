import { Game } from './game.entity';
export declare class GameDay {
    id: number;
    date: string;
    status: string;
    salaryCap: number;
    games: Game[];
}
