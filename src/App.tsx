import React, { useState, useEffect } from 'react';
import { AppState, GameItem, Player, GameType, GameMatch, DashboardTab } from './types/game';
import {
  INITIAL_STATE,
  loadSavedState,
  saveStateToStorage,
  clearSavedState,
} from './utils/storage';
import {
  calculateAllStats,
  generateFourDuels,
  generateTeamMatch,
  generatePuzzleMatch,
  generatePumpkinMatch,
} from './utils/calculations';
import { PumpkinPair } from './types/game';
import { soundEngine } from './utils/sound';
import { BackgroundAtmosphere } from './components/BackgroundAtmosphere';
import { HeaderNav } from './components/HeaderNav';
import { SetupView } from './components/SetupView';
import { TeamSetupView } from './components/TeamSetupView';
import { GameMasterConsole } from './components/GameMasterConsole';
import { GamesListView } from './components/GamesListView';
import { TeamsListView } from './components/TeamsListView';
import { ScoreboardView } from './components/ScoreboardView';
import { GameHistoryView } from './components/GameHistoryView';
import { HallOfFameView } from './components/HallOfFameView';
import { SettingsView } from './components/SettingsView';
import { ProjectorView } from './components/ProjectorView';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadSavedState());
  const [showHallOfFameWarning, setShowHallOfFameWarning] = useState(false);

  // Auto-save to localStorage on every state modification
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Sync sound engine options on settings modification
  useEffect(() => {
    soundEngine.configure(state.settings);
  }, [state.settings]);

  // Calculate live statistics
  const { teamA, teamB, playerStats, awards } = calculateAllStats(
    state.players,
    state.games,
    state.matches,
    state.teamANameCustom,
    state.teamBNameCustom
  );

  // Active game and match
  const currentGame = state.games.find((g) => g.id === state.currentGameId) || null;
  const currentMatch = state.currentGameId ? state.matches[state.currentGameId] : null;

  // ----------------------------------------------------
  // PRE-GAME SETUP HANDLERS
  // ----------------------------------------------------
  const handleAddGame = (name: string, description: string, gameType: GameType) => {
    const newGame: GameItem = {
      id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      description,
      status: 'NOT_PLAYED',
      gameType: gameType || 'DUEL',
      order: state.games.length + 1,
    };
    setState((prev) => ({ ...prev, games: [...prev.games, newGame] }));
  };

  const handleUpdateGame = (id: string, name: string, description: string, gameType: GameType) => {
    setState((prev) => ({
      ...prev,
      games: prev.games.map((g) => (g.id === id ? { ...g, name, description, gameType } : g)),
    }));
  };

  const handleDeleteGame = (id: string) => {
    setState((prev) => ({
      ...prev,
      games: prev.games.filter((g) => g.id !== id),
      currentGameId: prev.currentGameId === id ? null : prev.currentGameId,
    }));
  };

  const handleMoveGame = (id: string, direction: 'UP' | 'DOWN') => {
    setState((prev) => {
      const idx = prev.games.findIndex((g) => g.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.games.length) return prev;

      const updated = [...prev.games];
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;
      return { ...prev, games: updated };
    });
  };

  const handleAddPlayer = (name: string) => {
    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      team: null,
    };
    setState((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
  };

  const handleUpdatePlayer = (id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  };

  const handleDeletePlayer = (id: string) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== id),
    }));
  };

  // Helper: load sample testing data demonstrating BOTH game types
  const handleLoadSampleData = () => {
    const sampleGames: GameItem[] = [
      {
        id: 'sample_g1',
        name: 'Múmia Tekerés',
        description: 'Mind a 4 játékos egyszerre versenyez: 1 perc alatt vécépapírral teljesen be kell tekerni a kijelölt csapattársat.',
        status: 'NOT_PLAYED',
        gameType: 'TEAM',
        order: 1,
      },
      {
        id: 'sample_g2',
        name: 'Halloween Puzzle Hajsza',
        description: 'Párhuzamos csapatverseny: Mindkét csapat egyszerre rakja a kísérteties puzzle-t. Külön stopperek mérik az időt!',
        status: 'NOT_PLAYED',
        gameType: 'PUZZLE',
        order: 2,
      },
      {
        id: 'sample_g3',
        name: 'Dísztök Faragó Bajnokság',
        description: '4 pár egyszerre farag: A és B csapat 2-2 párja 30 perc alatt faragja meg a legszebb halloweeni töklámpást.',
        status: 'NOT_PLAYED',
        gameType: 'PUMPKIN',
        order: 3,
      },
      {
        id: 'sample_g4',
        name: 'Szellemvadászat Szívószállal',
        description: '1v1 párbaj: Szívószállal beszívva kell áthelyezni minél több papírszellemet egy tálból a másikba.',
        status: 'NOT_PLAYED',
        gameType: 'DUEL',
        order: 4,
      },
      {
        id: 'sample_g5',
        name: 'Vámpírfogó Pingpong',
        description: '1v1 párbaj: Műanyag vámpírfogsorral kell elkapni és célba juttatni minél több labdát kézhasználat nélkül.',
        status: 'NOT_PLAYED',
        gameType: 'DUEL',
        order: 5,
      },
      {
        id: 'sample_g6',
        name: 'Pókverseny Fújással',
        description: 'Teljes csapat: A 4 játékos egyszerre fújja a műanyag pókokat a célvonalig a megadott idő alatt.',
        status: 'NOT_PLAYED',
        gameType: 'TEAM',
        order: 6,
      },
    ];

    const samplePlayers: Player[] = [
      { id: 'sample_p1', name: 'Anna Kiss', team: 'A' },
      { id: 'sample_p2', name: 'Béla Nagy', team: 'A' },
      { id: 'sample_p3', name: 'Csilla Tóth', team: 'A' },
      { id: 'sample_p4', name: 'Dávid Kovács', team: 'A' },
      { id: 'sample_p5', name: 'Péter Varga', team: 'B' },
      { id: 'sample_p6', name: 'Éva Molnár', team: 'B' },
      { id: 'sample_p7', name: 'Gábor Szabó', team: 'B' },
      { id: 'sample_p8', name: 'Zoli Horváth', team: 'B' },
    ];

    setState((prev) => ({
      ...prev,
      games: sampleGames,
      players: samplePlayers,
    }));
  };

  // ----------------------------------------------------
  // TEAM FORMATION HANDLERS
  // ----------------------------------------------------
  const handleUpdatePlayers = (players: Player[]) => {
    setState((prev) => ({ ...prev, players }));
  };

  const handleUpdateTeamNames = (nameA: string | null, nameB: string | null) => {
    setState((prev) => ({
      ...prev,
      teamANameCustom: nameA,
      teamBNameCustom: nameB,
    }));
  };

  const handleConfirmAndStartGame = () => {
    setState((prev) => ({
      ...prev,
      screen: 'DASHBOARD',
      activeTab: 'CONSOLE',
    }));
  };

  // ----------------------------------------------------
  // GAME SELECTION (ADAPTS AUTOMATICALLY TO GAME TYPE)
  // ----------------------------------------------------
  const handleSelectGame = (gameId: string) => {
    setState((prev) => {
      const selectedGame = prev.games.find((g) => g.id === gameId);
      const isTeam = selectedGame?.gameType === 'TEAM';
      const isPuzzle = selectedGame?.gameType === 'PUZZLE';
      const isPumpkin = selectedGame?.gameType === 'PUMPKIN';

      let match = prev.matches[gameId];
      if (!match) {
        if (isTeam) {
          match = generateTeamMatch(gameId);
        } else if (isPuzzle) {
          match = generatePuzzleMatch(gameId, selectedGame?.puzzleSettings);
        } else if (isPumpkin) {
          match = generatePumpkinMatch(gameId, prev.players, selectedGame?.pumpkinSettings);
        } else {
          match = generateFourDuels(gameId, prev.players);
        }
      }

      const updatedGames = prev.games.map((g) =>
        g.id === gameId ? { ...g, status: 'IN_PROGRESS' as const } : g
      );

      return {
        ...prev,
        games: updatedGames,
        currentGameId: gameId,
        currentDuelIndex: 0,
        currentTeamStage: isTeam ? 'TEAM_A' : null,
        matches: {
          ...prev.matches,
          [gameId]: match,
        },
        activeTab: 'CONSOLE',
      };
    });
  };

  const handleDrawRandomGame = () => {
    const unplayed = state.games.filter((g) => g.status === 'NOT_PLAYED');
    if (unplayed.length === 0) return;
    const randomGame = unplayed[Math.floor(Math.random() * unplayed.length)];
    handleSelectGame(randomGame.id);
  };

  const handleSkipGame = (gameId: string) => {
    setState((prev) => {
      const updatedGames = prev.games.map((g) =>
        g.id === gameId ? { ...g, status: 'SKIPPED' as const } : g
      );
      return {
        ...prev,
        games: updatedGames,
        currentGameId: prev.currentGameId === gameId ? null : prev.currentGameId,
        currentTeamStage: null,
      };
    });
  };

  // ----------------------------------------------------
  // DUEL SCORING (1v1 Games)
  // ----------------------------------------------------
  const handleSaveDuelScore = (
    gameId: string,
    duelIndex: number,
    scoreA: number,
    scoreB: number
  ) => {
    setState((prev) => {
      const match = prev.matches[gameId];
      if (!match) return prev;

      const updatedDuels = match.duels.map((duel, idx) => {
        if (idx === duelIndex) {
          let winner: string | 'DRAW' | null = null;
          if (scoreA > scoreB) winner = duel.playerAId;
          else if (scoreB > scoreA) winner = duel.playerBId;
          else winner = 'DRAW';

          return {
            ...duel,
            scoreA,
            scoreB,
            winnerPlayerId: winner,
            completed: true,
          };
        }
        return duel;
      });

      let totalA = 0;
      let totalB = 0;
      let completedCount = 0;
      updatedDuels.forEach((d) => {
        if (d.completed) {
          completedCount++;
          totalA += d.scoreA ?? 0;
          totalB += d.scoreB ?? 0;
        }
      });

      const isMatchNowComplete = completedCount === 4;
      let matchWinnerTeam: 'A' | 'B' | 'DRAW' | null = match.winnerTeam;

      if (isMatchNowComplete) {
        if (totalA > totalB) matchWinnerTeam = 'A';
        else if (totalB > totalA) matchWinnerTeam = 'B';
        else matchWinnerTeam = 'DRAW';
      }

      const updatedMatch: typeof match = {
        ...match,
        duels: updatedDuels,
        totalScoreA: totalA,
        totalScoreB: totalB,
        completed: isMatchNowComplete,
        completedAt: isMatchNowComplete ? Date.now() : match.completedAt,
        winnerTeam: matchWinnerTeam,
      };

      const updatedGames = prev.games.map((g) => {
        if (g.id === gameId) {
          return {
            ...g,
            status: isMatchNowComplete ? ('COMPLETED' as const) : ('IN_PROGRESS' as const),
          };
        }
        return g;
      });

      const nextDuelIndex = isMatchNowComplete ? duelIndex : Math.min(3, duelIndex + 1);

      return {
        ...prev,
        games: updatedGames,
        currentDuelIndex: nextDuelIndex,
        matches: {
          ...prev.matches,
          [gameId]: updatedMatch,
        },
      };
    });
  };

  // ----------------------------------------------------
  // TEAM ROUND SCORING (Teljes csapatos Games)
  // ----------------------------------------------------
  const handleSaveTeamRoundScore = (
    gameId: string,
    team: 'A' | 'B',
    totalScore: number,
    playerScores: Record<string, number>
  ) => {
    setState((prev) => {
      const match = prev.matches[gameId];
      if (!match) return prev;

      let updatedMatch = { ...match };

      if (team === 'A') {
        updatedMatch = {
          ...updatedMatch,
          teamRoundA: {
            team: 'A',
            totalScore,
            playerScores,
            completed: true,
          },
          totalScoreA: totalScore,
        };

        return {
          ...prev,
          currentTeamStage: 'TEAM_B', // Advance to Team B round
          matches: {
            ...prev.matches,
            [gameId]: updatedMatch,
          },
        };
      } else {
        // Team B completed -> finishes the team game!
        const scoreA = updatedMatch.totalScoreA ?? updatedMatch.teamRoundA?.totalScore ?? 0;
        const scoreB = totalScore;

        let matchWinner: 'A' | 'B' | 'DRAW' = 'DRAW';
        if (scoreA > scoreB) matchWinner = 'A';
        else if (scoreB > scoreA) matchWinner = 'B';

        updatedMatch = {
          ...updatedMatch,
          teamRoundB: {
            team: 'B',
            totalScore,
            playerScores,
            completed: true,
          },
          totalScoreB: scoreB,
          completed: true,
          completedAt: Date.now(),
          winnerTeam: matchWinner,
        };

        const updatedGames = prev.games.map((g) =>
          g.id === gameId ? { ...g, status: 'COMPLETED' as const } : g
        );

        return {
          ...prev,
          games: updatedGames,
          currentTeamStage: 'SUMMARY',
          matches: {
            ...prev.matches,
            [gameId]: updatedMatch,
          },
        };
      }
    });
  };

  // Past score editing (Duel)
  const handleUpdatePastDuelScore = (
    gameId: string,
    duelIndex: number,
    scoreA: number,
    scoreB: number
  ) => {
    handleSaveDuelScore(gameId, duelIndex, scoreA, scoreB);
  };

  // Past score editing (Team Game)
  const handleUpdatePastTeamScore = (
    gameId: string,
    scoreA: number,
    scoreB: number
  ) => {
    setState((prev) => {
      const match = prev.matches[gameId];
      if (!match) return prev;

      let winner: 'A' | 'B' | 'DRAW' = 'DRAW';
      if (scoreA > scoreB) winner = 'A';
      else if (scoreB > scoreA) winner = 'B';

      const updatedMatch: GameMatch = {
        ...match,
        totalScoreA: scoreA,
        totalScoreB: scoreB,
        winnerTeam: winner,
        teamRoundA: match.teamRoundA
          ? { ...match.teamRoundA, totalScore: scoreA }
          : undefined,
        teamRoundB: match.teamRoundB
          ? { ...match.teamRoundB, totalScore: scoreB }
          : undefined,
      };

      return {
        ...prev,
        matches: {
          ...prev.matches,
          [gameId]: updatedMatch,
        },
      };
    });
  };

  // ----------------------------------------------------
  // PUZZLE & PUMPKIN MATCH HANDLERS
  // ----------------------------------------------------
  const handleUpdateMatchData = (updatedMatch: GameMatch) => {
    setState((prev) => ({
      ...prev,
      matches: {
        ...prev.matches,
        [updatedMatch.gameId]: updatedMatch,
      },
    }));
  };

  const handleFinalizePuzzle = (
    scoreA: number,
    scoreB: number,
    winnerTeam: 'A' | 'B' | 'DRAW',
    timeA: number,
    timeB: number
  ) => {
    if (!state.currentGameId) return;
    const gameId = state.currentGameId;
    setState((prev) => {
      const match = prev.matches[gameId];
      if (!match || !match.puzzleData) return prev;

      const updatedMatch: GameMatch = {
        ...match,
        totalScoreA: scoreA,
        totalScoreB: scoreB,
        winnerTeam,
        completed: true,
        completedAt: Date.now(),
        puzzleData: {
          ...match.puzzleData,
          scoreA,
          scoreB,
          winnerTeam,
          teamAFinished: true,
          teamAElapsedSeconds: timeA,
          teamBFinished: true,
          teamBElapsedSeconds: timeB,
          evaluationFinalized: true,
          timerRunning: false,
          isPaused: true,
        },
      };

      const updatedGames = prev.games.map((g) =>
        g.id === gameId ? { ...g, status: 'COMPLETED' as const } : g
      );

      return {
        ...prev,
        games: updatedGames,
        matches: {
          ...prev.matches,
          [gameId]: updatedMatch,
        },
      };
    });
  };

  const handleFinalizePumpkin = (
    scoreA: number,
    scoreB: number,
    winnerTeam: 'A' | 'B' | 'DRAW',
    pairs: PumpkinPair[]
  ) => {
    if (!state.currentGameId) return;
    const gameId = state.currentGameId;
    setState((prev) => {
      const match = prev.matches[gameId];
      if (!match || !match.pumpkinData) return prev;

      const updatedMatch: GameMatch = {
        ...match,
        totalScoreA: scoreA,
        totalScoreB: scoreB,
        winnerTeam,
        completed: true,
        completedAt: Date.now(),
        pumpkinData: {
          ...match.pumpkinData,
          scoreA,
          scoreB,
          winnerTeam,
          pairs,
          evaluationFinalized: true,
          timerRunning: false,
          isPaused: true,
        },
      };

      const updatedGames = prev.games.map((g) =>
        g.id === gameId ? { ...g, status: 'COMPLETED' as const } : g
      );

      return {
        ...prev,
        games: updatedGames,
        matches: {
          ...prev.matches,
          [gameId]: updatedMatch,
        },
      };
    });
  };

  // ----------------------------------------------------
  // SETTINGS & RESET
  // ----------------------------------------------------
  const handleUpdateSettings = (newSettings: Partial<AppState['settings']>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  };

  const handleUpdateTimerSecondsSetting = (secs: number) => {
    setState((prev) => ({ ...prev, timerSecondsSetting: secs }));
  };

  const handleToggleSound = () => {
    const nextVal = !state.settings.soundEnabled;
    handleUpdateSettings({ soundEnabled: nextVal });
    if (nextVal) soundEngine.playTick();
  };

  const handleResetCompetition = () => {
    clearSavedState();
    setState(INITIAL_STATE);
  };

  const handleImportState = (imported: Partial<AppState>) => {
    setState((prev) => ({
      ...prev,
      ...imported,
      screen: 'DASHBOARD',
      activeTab: 'CONSOLE',
    }));
  };

  // Hall of Fame Confirmation Check
  const handleRequestHallOfFame = () => {
    const unplayed = state.games.filter((g) => g.status === 'NOT_PLAYED' || g.status === 'IN_PROGRESS');
    if (unplayed.length > 0) {
      setShowHallOfFameWarning(true);
    } else {
      setState((prev) => ({ ...prev, activeTab: 'HALL_OF_FAME' }));
    }
  };

  const handleConfirmHallOfFame = () => {
    setShowHallOfFameWarning(false);
    setState((prev) => ({ ...prev, activeTab: 'HALL_OF_FAME' }));
  };

  return (
    <div className="min-h-screen bg-[#0B090D] text-zinc-100 flex flex-col relative selection:bg-orange-500 selection:text-black">
      {/* Background Ambience */}
      <BackgroundAtmosphere />

      {/* Top Bar Navigation */}
      <HeaderNav
        screen={state.screen}
        activeTab={state.activeTab}
        onSelectTab={(tab) => setState((prev) => ({ ...prev, activeTab: tab }))}
        onOpenProjector={() => setState((prev) => ({ ...prev, isProjectorOpen: true }))}
        soundEnabled={state.settings.soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenHallOfFame={handleRequestHallOfFame}
      />

      {/* Main Screen Content */}
      <main className="flex-1 pb-16">
        {/* SCREEN 1: PRE-GAME SETUP */}
        {state.screen === 'SETUP' && (
          <SetupView
            games={state.games}
            players={state.players}
            onAddGame={handleAddGame}
            onUpdateGame={handleUpdateGame}
            onDeleteGame={handleDeleteGame}
            onMoveGame={handleMoveGame}
            onAddPlayer={handleAddPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onLoadSampleData={handleLoadSampleData}
            onProceedToTeams={() => setState((prev) => ({ ...prev, screen: 'TEAM_SETUP' }))}
          />
        )}

        {/* SCREEN 2: TEAM FORMATION */}
        {state.screen === 'TEAM_SETUP' && (
          <TeamSetupView
            players={state.players}
            teamANameCustom={state.teamANameCustom}
            teamBNameCustom={state.teamBNameCustom}
            onUpdatePlayers={handleUpdatePlayers}
            onUpdateTeamNames={handleUpdateTeamNames}
            onConfirmAndStartGame={handleConfirmAndStartGame}
            onBackToSetup={() => setState((prev) => ({ ...prev, screen: 'SETUP' }))}
          />
        )}

        {/* SCREEN 3: MAIN DASHBOARD TABS */}
        {state.screen === 'DASHBOARD' && (
          <>
            {state.activeTab === 'CONSOLE' && (
              <GameMasterConsole
                games={state.games}
                players={state.players}
                teamA={teamA}
                teamB={teamB}
                matches={state.matches}
                currentGameId={state.currentGameId}
                currentDuelIndex={state.currentDuelIndex}
                currentTeamStage={state.currentTeamStage}
                timerSecondsSetting={state.timerSecondsSetting}
                onUpdateTimerSecondsSetting={handleUpdateTimerSecondsSetting}
                onSelectGame={handleSelectGame}
                onDrawRandomGame={handleDrawRandomGame}
                onSkipGame={handleSkipGame}
                onSaveDuelScore={handleSaveDuelScore}
                onSaveTeamRoundScore={handleSaveTeamRoundScore}
                onUpdateMatchData={handleUpdateMatchData}
                onFinalizePuzzle={handleFinalizePuzzle}
                onFinalizePumpkin={handleFinalizePumpkin}
                onOpenHallOfFame={handleRequestHallOfFame}
                onOpenProjector={() => setState((prev) => ({ ...prev, isProjectorOpen: true }))}
              />
            )}

            {state.activeTab === 'GAMES' && (
              <GamesListView
                games={state.games}
                matches={state.matches}
                currentGameId={state.currentGameId}
                onSelectGame={handleSelectGame}
                onSkipGame={handleSkipGame}
                onAddGame={handleAddGame}
                onUpdateGame={handleUpdateGame}
              />
            )}

            {state.activeTab === 'TEAMS' && (
              <TeamsListView
                teamA={teamA}
                teamB={teamB}
                playerStats={playerStats}
              />
            )}

            {state.activeTab === 'SCOREBOARD' && (
              <ScoreboardView
                teamA={teamA}
                teamB={teamB}
                playerStats={playerStats}
              />
            )}

            {state.activeTab === 'HISTORY' && (
              <GameHistoryView
                games={state.games}
                matches={state.matches}
                players={state.players}
                teamA={teamA}
                teamB={teamB}
                onUpdatePastDuelScore={handleUpdatePastDuelScore}
                onUpdatePastTeamScore={handleUpdatePastTeamScore}
              />
            )}

            {state.activeTab === 'HALL_OF_FAME' && (
              <HallOfFameView
                awards={awards}
                teamA={teamA}
                teamB={teamB}
                onBackToConsole={() => setState((prev) => ({ ...prev, activeTab: 'CONSOLE' }))}
              />
            )}

            {state.activeTab === 'SETTINGS' && (
              <SettingsView
                settings={state.settings}
                fullState={state}
                teamAName={teamA.name}
                teamBName={teamB.name}
                onUpdateSettings={handleUpdateSettings}
                onOpenProjector={() => setState((prev) => ({ ...prev, isProjectorOpen: true }))}
                onResetCompetition={handleResetCompetition}
                onImportState={handleImportState}
              />
            )}
          </>
        )}
      </main>

      {/* Hall of Fame Confirmation Warning Modal */}
      {showHallOfFameWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15101F] border-2 border-amber-500/80 rounded-3xl p-6 md:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h3 className="text-xl font-bold font-cinzel text-white">
              Vannak még be nem fejezett játékok!
            </h3>
            <p className="text-sm text-zinc-300">
              A listában még szerepel olyan játék, amit nem játszottatok le. Biztosan megnyitod a
              végső eredményhirdetést a jelenlegi pontállással?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                onClick={handleConfirmHallOfFame}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all"
              >
                Igen, Eredményhirdetés
              </button>
              <button
                onClick={() => setShowHallOfFameWarning(false)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
              >
                Mégse, folytatom a versenyt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projector / Spectator Mode Fullscreen Overlay */}
      {state.isProjectorOpen && (
        <ProjectorView
          onClose={() => setState((prev) => ({ ...prev, isProjectorOpen: false }))}
          teamA={teamA}
          teamB={teamB}
          currentGame={currentGame}
          currentMatch={currentMatch}
          currentDuelIndex={state.currentDuelIndex}
          currentTeamStage={state.currentTeamStage}
          players={state.players}
          timerSecondsSetting={state.timerSecondsSetting}
        />
      )}
    </div>
  );
}
