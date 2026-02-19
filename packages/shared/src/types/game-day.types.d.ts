export type GameDayStatus = 'pending' | 'active' | 'completed';
export type GameStatus = 'scheduled' | 'in_progress' | 'completed';
export interface GameDto {
    id: number;
    homeTeam: string;
    awayTeam: string;
    status: GameStatus;
}
export interface GameDayDto {
    id: number;
    date: string;
    status: GameDayStatus;
    salaryCap: number;
    games: GameDto[];
}
