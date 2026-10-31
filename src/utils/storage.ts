import { AppState, GameItem, Player, GameMatch } from '../types/game';

const STORAGE_KEY = 'halloween_minute_to_win_it_v1';

export const INITIAL_STATE: AppState = {
  version: 2,
  screen: 'SETUP',
  activeTab: 'CONSOLE',
  games: [],
  players: [],
  teamANameCustom: null,
  teamBNameCustom: null,
  currentGameId: null,
  currentDuelIndex: 0,
  currentTeamStage: null,
  matches: {},
  settings: {
    soundEnabled: true,
    volume: 0.85,
    defaultTimerSeconds: 60,
    mysticStartSoundEnabled: true,
    urgentCountdownBeepEnabled: true,
    timesUpGongEnabled: true,
  },
  timerSecondsSetting: 60,
  isProjectorOpen: false,
};

/**
 * Load state from localStorage with migration
 */
export function loadSavedState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      // Migrate games to ensure gameType exists
      const migratedGames: GameItem[] = Array.isArray(parsed.games)
        ? parsed.games.map((g: Partial<GameItem>) => ({
            ...g,
            gameType: g.gameType || 'DUEL',
          }))
        : [];

      return {
        ...INITIAL_STATE,
        ...parsed,
        games: migratedGames,
        settings: {
          ...INITIAL_STATE.settings,
          ...(parsed.settings || {}),
        },
      };
    }
  } catch (err) {
    console.warn('Could not load saved state from localStorage', err);
  }
  return INITIAL_STATE;
}

/**
 * Save state to localStorage
 */
export function saveStateToStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Could not save state to localStorage', err);
  }
}

/**
 * Clear saved state from localStorage
 */
export function clearSavedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Could not clear saved state from localStorage', err);
  }
}

/**
 * Export full tournament data as formatted JSON
 */
export function exportStateAsJSON(state: AppState): void {
  const exportData = {
    exportedAt: new Date().toISOString(),
    tournamentName: 'HALLOWEEN – MINUTE TO WIN IT',
    games: state.games,
    players: state.players,
    teamAName: state.teamANameCustom,
    teamBName: state.teamBNameCustom,
    matches: state.matches,
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `halloween_minute_to_win_it_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export results as CSV file (supporting both DUEL and TEAM games)
 */
export function exportResultsAsCSV(
  state: AppState,
  teamAName: string,
  teamBName: string
): void {
  const playerMap = new Map<string, Player>();
  state.players.forEach((p) => playerMap.set(p.id, p));

  const gameMap = new Map<string, GameItem>();
  state.games.forEach((g) => gameMap.set(g.id, g));

  const lines: string[] = [];

  // Header 1: Games, Duels and Team Rounds
  lines.push('--- JÁTÉKOK ÉS EREDMÉNYEK ---');
  lines.push(
    'Játék sorszám,Játék neve,Típus,Forduló / Párbaj,A csapat pontszám,B csapat pontszám,Győztes'
  );

  let matchIndex = 1;
  Object.values(state.matches).forEach((match) => {
    const game = gameMap.get(match.gameId);
    const gameName = game ? `"${game.name.replace(/"/g, '""')}"` : 'Ismeretlen';
    const isTeam = match.gameType === 'TEAM';
    const typeLabel = isTeam ? 'Teljes csapatos' : 'Egyéni párbaj';

    if (isTeam) {
      const sA = match.teamRoundA?.totalScore ?? match.totalScoreA ?? 0;
      const sB = match.teamRoundB?.totalScore ?? match.totalScoreB ?? 0;
      let winner = 'Nincs lezárva';
      if (match.completed) {
        if (sA > sB) winner = teamAName;
        else if (sB > sA) winner = teamBName;
        else winner = 'Döntetlen';
      }
      lines.push(`${matchIndex},${gameName},${typeLabel},Csapatkörök,${sA},${sB},${winner}`);
    } else {
      (match.duels || []).forEach((duel) => {
        const pA = playerMap.get(duel.playerAId);
        const pB = playerMap.get(duel.playerBId);
        const pAName = pA ? `"${pA.name.replace(/"/g, '""')}"` : 'N/A';
        const pBName = pB ? `"${pB.name.replace(/"/g, '""')}"` : 'N/A';
        const sA = duel.scoreA !== null ? duel.scoreA : '';
        const sB = duel.scoreB !== null ? duel.scoreB : '';
        let winner = 'Nincs lezárva';
        if (duel.completed) {
          if ((duel.scoreA ?? 0) > (duel.scoreB ?? 0)) winner = pAName;
          else if ((duel.scoreB ?? 0) > (duel.scoreA ?? 0)) winner = pBName;
          else winner = 'Döntetlen';
        }

        lines.push(
          `${matchIndex},${gameName},${typeLabel},${duel.duelNumber}. párbaj (${pAName} vs ${pBName}),${sA},${sB},${winner}`
        );
      });
    }
    matchIndex++;
  });

  lines.push('');
  lines.push('--- JÁTÉKOSOK LISTÁJA ---');
  lines.push('Név,Csapat');
  state.players.forEach((p) => {
    const teamLabel = p.team === 'A' ? teamAName : p.team === 'B' ? teamBName : 'Nincs csapatban';
    lines.push(`"${p.name.replace(/"/g, '""')}","${teamLabel.replace(/"/g, '""')}"`);
  });

  const csvContent = '\uFEFF' + lines.join('\n'); // UTF-8 BOM for Excel
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `halloween_verseny_eredmenyek_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Validate and import tournament data from JSON file
 */
export function validateAndImportJSON(jsonText: string): {
  success: boolean;
  games?: GameItem[];
  players?: Player[];
  matches?: Record<string, GameMatch>;
  teamAName?: string | null;
  teamBName?: string | null;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonText);
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Érvénytelen JSON formátum.' };
    }

    if (!Array.isArray(data.games)) {
      return { success: false, error: 'A fájl nem tartalmaz érvényes játéklistát (games).' };
    }

    if (!Array.isArray(data.players)) {
      return { success: false, error: 'A fájl nem tartalmaz érvényes játékoslistát (players).' };
    }

    // Validate player structure
    for (const p of data.players) {
      if (!p.id || typeof p.name !== 'string') {
        return { success: false, error: 'Hibás játékos rekord található a fájlban.' };
      }
    }

    // Validate game structure and default gameType
    const validatedGames: GameItem[] = [];
    for (const g of data.games) {
      if (!g.id || typeof g.name !== 'string') {
        return { success: false, error: 'Hibás játék rekord található a fájlban.' };
      }
      validatedGames.push({
        ...g,
        gameType: g.gameType === 'TEAM' ? 'TEAM' : 'DUEL',
      });
    }

    return {
      success: true,
      games: validatedGames,
      players: data.players,
      matches: data.matches || {},
      teamAName: data.teamAName || null,
      teamBName: data.teamBName || null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ismeretlen hiba';
    return { success: false, error: `JSON beolvasási hiba: ${message}` };
  }
}
