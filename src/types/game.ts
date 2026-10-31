export interface Player {
  id: string;
  name: string;
  team: 'A' | 'B' | null;
}

export type GameStatus = 'NOT_PLAYED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type GameType = 'TEAM' | 'DUEL';

export interface GameItem {
  id: string;
  name: string;
  description: string;
  status: GameStatus;
  gameType: GameType;
  order: number;
}

export interface Duel {
  id: string;
  duelNumber: 1 | 2 | 3 | 4;
  playerAId: string;
  playerBId: string;
  scoreA: number | null;
  scoreB: number | null;
  winnerPlayerId: string | 'DRAW' | null;
  completed: boolean;
}

export interface TeamRound {
  team: 'A' | 'B';
  totalScore: number;
  playerScores: Record<string, number>; // playerId -> score (if individual scoring was recorded)
  completed: boolean;
}

export interface GameMatch {
  gameId: string;
  gameType: GameType;
  duels: Duel[]; // exactly 4 duels if gameType === 'DUEL'
  teamRoundA?: TeamRound; // if gameType === 'TEAM'
  teamRoundB?: TeamRound; // if gameType === 'TEAM'
  winnerTeam: 'A' | 'B' | 'DRAW' | null;
  totalScoreA: number;
  totalScoreB: number;
  completed: boolean;
  completedAt?: number;
}

export interface AppSettings {
  soundEnabled: boolean;
  volume: number; // 0 - 1
  defaultTimerSeconds: number; // e.g. 60
  mysticStartSoundEnabled: boolean;
  urgentCountdownBeepEnabled: boolean;
  timesUpGongEnabled: boolean;
}

export type ScreenMode = 'SETUP' | 'TEAM_SETUP' | 'DASHBOARD' | 'HALL_OF_FAME';

export type DashboardTab =
  | 'CONSOLE'
  | 'GAMES'
  | 'TEAMS'
  | 'SCOREBOARD'
  | 'HISTORY'
  | 'HALL_OF_FAME'
  | 'SETTINGS';

export interface AppState {
  version: number;
  screen: ScreenMode;
  activeTab: DashboardTab;
  games: GameItem[];
  players: Player[];
  teamANameCustom: string | null;
  teamBNameCustom: string | null;
  currentGameId: string | null;
  currentDuelIndex: number; // 0, 1, 2, 3 (for DUEL games)
  currentTeamStage: 'TEAM_A' | 'TEAM_B' | 'SUMMARY' | null; // (for TEAM games)
  matches: Record<string, GameMatch>; // keyed by gameId
  settings: AppSettings;
  timerSecondsSetting: number; // persists GM preference between duels/rounds
  isProjectorOpen: boolean;
}
