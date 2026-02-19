import { Game } from './game.entity';
import { Player } from './player.entity';
export declare class GamePlayerStats {
    id: number;
    game: Game;
    gameId: number;
    player: Player;
    playerId: number;
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    toVal: number;
    min: number;
    fantasyScore: number;
}
