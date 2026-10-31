export interface Player {
  id: string;
  name: string;
  team: 'A' | 'B' | null;
}

export type GameStatus =
  | 'NOT_PLAYED'
  | 'IN_PROGRESS'
  | 'AWAITING_EVALUATION'
  | 'COMPLETED'
  | 'SKIPPED';

export type GameType = 'TEAM' | 'DUEL' | 'PUZZLE' | 'PUMPKIN';

// --- PUZZLE MATCH DATA ---
export interface PuzzleSettings {
  hasTimeLimit: boolean;
  timeLimitSeconds: number; // e.g. 300 (5 minutes), or 0 if unlimited
  winPoints: number; // default: 100
  losePoints: number; // default: 25
  drawPoints: number; // default: 50
}

export interface PuzzleMatchData {
  settings: PuzzleSettings;
  timerRunning: boolean;
  startTime: number | null; // epoch ms
  elapsedBeforePause: number; // seconds
  isPaused: boolean;
  teamAFinished: boolean;
  teamAElapsedSeconds: number | null;
  teamBFinished: boolean;
  teamBElapsedSeconds: number | null;
  scoreA: number;
  scoreB: number;
  winnerTeam: 'A' | 'B' | 'DRAW' | null;
  evaluationFinalized: boolean;
}

// --- PUMPKIN MATCH DATA ---
export interface PumpkinPair {
  id: string;
  team: 'A' | 'B';
  pairNumber: 1 | 2;
  playerIds: [string, string]; // exactly 2 player IDs
  rank: 1 | 2 | 3 | 4 | null;
  score: number;
  notes?: string;
}

export interface PumpkinSettings {
  hasTimeLimit: boolean;
  timeLimitSeconds: number; // default 30 mins = 1800s
  rankPoints: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
  drawPoints: number;
}

export interface PumpkinMatchData {
  settings: PumpkinSettings;
  pairs: PumpkinPair[]; // 4 pairs: 2 for team A, 2 for team B
  timerRunning: boolean;
  startTime: number | null;
  elapsedBeforePause: number;
  isPaused: boolean;
  evaluationFinalized: boolean;
  scoreA: number; // sum of team A pairs
  scoreB: number; // sum of team B pairs
  winnerTeam: 'A' | 'B' | 'DRAW' | null;
}

export interface GameItem {
  id: string;
  name: string;
  description: string;
  status: GameStatus;
  gameType: GameType;
  order: number;
  puzzleSettings?: PuzzleSettings;
  pumpkinSettings?: PumpkinSettings;
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
  puzzleData?: PuzzleMatchData; // if gameType === 'PUZZLE'
  pumpkinData?: PumpkinMatchData; // if gameType === 'PUMPKIN'
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
