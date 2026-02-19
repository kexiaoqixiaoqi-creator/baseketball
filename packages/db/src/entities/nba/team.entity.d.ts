import { Player } from './player.entity';
export declare class Team {
    id: number;
    name: string;
    nameCn: string;
    market: string;
    marketCn: string | null;
    players: Player[];
}
