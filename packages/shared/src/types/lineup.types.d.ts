export interface CreateLineupDto {
    gameDayId: number;
    roomId: number;
    pgId: number;
    sgId: number;
    sfId: number;
    pfId: number;
    cId: number;
}
export interface PlayerSlotDto {
    id: number;
    name: string;
    team: string;
    cost: number;
    actualScore: number | null;
}
export interface LineupDto {
    id: number;
    gameDayId: number;
    roomId: number;
    totalCost: number;
    totalScore: number | null;
    players: {
        PG: PlayerSlotDto;
        SG: PlayerSlotDto;
        SF: PlayerSlotDto;
        PF: PlayerSlotDto;
        C: PlayerSlotDto;
    };
    createdAt: string;
}
