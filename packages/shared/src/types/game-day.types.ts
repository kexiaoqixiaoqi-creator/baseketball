export type GameDayStatus = 'prepare' | 'playing' | 'finish';
export type GameStatus = 'prepare' | 'playing' | 'finish';

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
