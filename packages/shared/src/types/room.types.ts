export interface RoomWeights {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
}

export interface RoomDto {
  id: number;
  name: string;
  isOfficial: boolean;
  ownerId: number | null;
  salaryCap: number;
  weights: RoomWeights;
  memberCount: number;
}

export interface RankingEntryDto {
  rank: number;
  userId: number;
  username: string;
  totalScore: number;
  lineupId: number;
}

export interface CreateRoomDto {
  name: string;
  salaryCap?: number;
  weights?: Partial<RoomWeights>;
}
