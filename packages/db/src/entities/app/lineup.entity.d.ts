import { User } from './user.entity';
import { Room } from './room.entity';
import { GameDay } from '../nba/game-day.entity';
export declare class Lineup {
    id: number;
    user: User;
    userId: number;
    room: Room;
    roomId: number;
    gameDay: GameDay;
    gameDayId: number;
    pgId: number;
    sgId: number;
    sfId: number;
    pfId: number;
    cId: number;
    totalCost: number;
    totalScore: number | null;
    createdAt: Date;
}
