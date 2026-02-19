// ---------------------------------------------------------------------------
// Sina Sports API — TypeScript response interfaces
// Base URL: https://slamdunk.sports.sina.com.cn/api
// ---------------------------------------------------------------------------

export interface SinaApiEnvelope<T> {
  result: {
    status: { code: number; msg: string };
    timestamp: string;
    data: T;
  };
}

// ── GET ?p=radar&s=team&a=rosters ──────────────────────────────────────────
export interface SinaRosterPlayerBrief {
  first_name: string;
  first_name_cn: string;
  last_name: string;
  last_name_cn: string;
  pid: string;
  jersey_number: number;
}

export interface SinaTeamBrief {
  team: {
    market: string;
    market_cn: string;
    name: string;
    name_cn: string;
    tid: string;
  };
  players: SinaRosterPlayerBrief[];
}

export interface SinaAllTeamsData {
  league: { season: number };
  teams: SinaTeamBrief[];
}

// ── GET ?p=radar&s=team&a=roster&tid=...&season=... ────────────────────────
export interface SinaRosterPlayerDetail {
  first_name: string;
  first_name_cn: string;
  last_name: string;
  last_name_cn: string;
  pid: string;
  jersey_number: string;
  position: string; // Chinese: '控球后卫', '中锋', etc.
  birthdate: string;
  age: string;
  experience: string;
  centimeter: string;
  pound: string;
  college: string;
}

export interface SinaTeamRosterData {
  team: { season: string; name: string; tid: string };
  roster: SinaRosterPlayerDetail[];
}

// ── GET ?p=radar&s=stats&a=players&tid=...&season_type=reg&split=average ───
export interface SinaPlayerSeasonStats {
  first_name: string;
  last_name: string;
  pid: string;
  position: string;
  jersey_number: number;
  games_played: number;
  games_started: number;
  minutes: number;
  points: number;
  rebounds: number;
  offensive_rebounds: number;
  defensive_rebounds: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  personal_fouls: number;
  field_goals_made: number;
  field_goals_att: number;
  field_goals_pct: number;
  three_points_made: number;
  three_points_att: number;
  three_points_pct: number;
  free_throws_made: number;
  free_throws_att: number;
  free_throws_pct: number;
  on_team: boolean;
}

export interface SinaTeamSeasonStatsData {
  team: { season: number; type: string; team_name: string; tid: string; split: string };
  players: SinaPlayerSeasonStats[];
}

// ── GET ?p=radar&s=schedule&a=date_span&date=...&span=... ──────────────────
export interface SinaMatchSchedule {
  season: number;
  type: string;
  mid: string;
  date: string;        // 'YYYY-MM-DD'
  time: string;        // 'HH:MM'
  status: string;      // Chinese
  status_en: string;   // 'scheduled' | 'inprogress' | 'complete'
  home_city: string;
  home_name: string;
  home_tid: string;
  home_score: string | number;
  away_city: string;
  away_name: string;
  away_tid: string;
  away_score: string | number;
  livecast_id: string;
}

export interface SinaScheduleData {
  matchs: SinaMatchSchedule[];
}

// ── GET ?p=radar&s=summary&a=game_player&mid=... ──────────────────────────
export interface SinaGamePlayer {
  first_name: string;
  last_name: string;
  pid: string;
  starter: boolean;
  on_court: boolean;
  played: boolean;
  jersey_number: number;
  position: string;
  minutes: string;   // e.g. '35:00'
  points: number;
  rebounds: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  personal_fouls: number;
  field_goals_made: number;
  field_goals_att: number;
  three_points_made: number;
  three_points_att: number;
  free_throws_made: number;
  free_throws_att: number;
  offensive_rebounds: number;
  defensive_rebounds: number;
}

export interface SinaGamePlayerData {
  home: { players: SinaGamePlayer[] };
  away: { players: SinaGamePlayer[] };
}
