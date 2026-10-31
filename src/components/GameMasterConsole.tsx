import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Swords,
  CheckCircle,
  Skull,
  Shuffle,
  SkipForward,
  Users,
  Award,
} from 'lucide-react';
import { GameItem, GameMatch, Player } from '../types/game';
import { TeamStats } from '../utils/calculations';
import { soundEngine } from '../utils/sound';

interface GameMasterConsoleProps {
  games: GameItem[];
  players: Player[];
  teamA: TeamStats;
  teamB: TeamStats;
  matches: Record<string, GameMatch>;
  currentGameId: string | null;
  currentDuelIndex: number;
  currentTeamStage: 'TEAM_A' | 'TEAM_B' | 'SUMMARY' | null;
  timerSecondsSetting: number;
  onUpdateTimerSecondsSetting: (secs: number) => void;
  onSelectGame: (gameId: string) => void;
  onDrawRandomGame: () => void;
  onSkipGame: (gameId: string) => void;
  onSaveDuelScore: (
    gameId: string,
    duelIndex: number,
    scoreA: number,
    scoreB: number
  ) => void;
  onSaveTeamRoundScore: (
    gameId: string,
    team: 'A' | 'B',
    totalScore: number,
    playerScores: Record<string, number>
  ) => void;
  onOpenHallOfFame: () => void;
  onOpenProjector: () => void;
}

export const GameMasterConsole: React.FC<GameMasterConsoleProps> = ({
  games,
  players,
  teamA,
  teamB,
  matches,
  currentGameId,
  currentDuelIndex,
  currentTeamStage,
  timerSecondsSetting,
  onUpdateTimerSecondsSetting,
  onSelectGame,
  onDrawRandomGame,
  onSkipGame,
  onSaveDuelScore,
  onSaveTeamRoundScore,
  onOpenHallOfFame,
}) => {
  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  const currentGame = games.find((g) => g.id === currentGameId) || null;
  const currentMatch = currentGameId ? matches[currentGameId] : null;

  const isTeamGame = currentGame?.gameType === 'TEAM';

  // DUEL GAME: active duel
  const activeDuel = !isTeamGame && currentMatch?.duels ? currentMatch.duels[currentDuelIndex] || null : null;
  const playerA = activeDuel ? playerMap.get(activeDuel.playerAId) : null;
  const playerB = activeDuel ? playerMap.get(activeDuel.playerBId) : null;

  // TEAM GAME: active team stage ('TEAM_A' or 'TEAM_B' or 'SUMMARY')
  const activeTeamStage = currentTeamStage || 'TEAM_A';

  // Timer states
  const [totalTimerSecs, setTotalTimerSecs] = useState<number>(timerSecondsSetting || 60);
  const [remainingSecs, setRemainingSecs] = useState<number>(timerSecondsSetting || 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timesUpTriggered, setTimesUpTriggered] = useState<boolean>(false);

  // DUEL Scoring Panel State
  const [scoreInputA, setScoreInputA] = useState<number>(0);
  const [scoreInputB, setScoreInputB] = useState<number>(0);
  const [scoringPanelOpen, setScoringPanelOpen] = useState<boolean>(false);

  // TEAM Scoring Panel State
  const [teamScoreMode, setTeamScoreMode] = useState<'DIRECT' | 'PER_PLAYER'>('DIRECT');
  const [teamDirectScore, setTeamDirectScore] = useState<number>(0);
  const [teamPlayerScores, setTeamPlayerScores] = useState<Record<string, number>>({});

  // Drawing Game Roulette Animation state
  const [isDrawingGame, setIsDrawingGame] = useState<boolean>(false);
  const [drawDisplayTitle, setDrawDisplayTitle] = useState<string>('');

  const isMatchComplete = currentMatch ? currentMatch.completed : false;

  // High precision timestamp timer ref
  const timerEndTimestampRef = useRef<number | null>(null);
  const timerPausedRemainingRef = useRef<number>(timerSecondsSetting || 60);
  const lastUrgentBeepSecRef = useRef<number | null>(null);

  // Sync setting updates
  useEffect(() => {
    if (!timerRunning) {
      setTotalTimerSecs(timerSecondsSetting);
      setRemainingSecs(timerSecondsSetting);
      timerPausedRemainingRef.current = timerSecondsSetting;
    }
  }, [timerSecondsSetting, timerRunning]);

  // Reset duel inputs when active duel changes
  useEffect(() => {
    if (activeDuel) {
      setScoreInputA(activeDuel.scoreA ?? 0);
      setScoreInputB(activeDuel.scoreB ?? 0);
      setRemainingSecs(totalTimerSecs);
      timerPausedRemainingRef.current = totalTimerSecs;
      setTimerRunning(false);
      setTimesUpTriggered(false);
      setScoringPanelOpen(activeDuel.completed);
    }
  }, [activeDuel?.id, totalTimerSecs]);

  // Reset team inputs when team stage changes
  useEffect(() => {
    if (isTeamGame) {
      setRemainingSecs(totalTimerSecs);
      timerPausedRemainingRef.current = totalTimerSecs;
      setTimerRunning(false);
      setTimesUpTriggered(false);
      setScoringPanelOpen(false);

      const targetTeam = activeTeamStage === 'TEAM_A' ? 'A' : 'B';
      const roundData = targetTeam === 'A' ? currentMatch?.teamRoundA : currentMatch?.teamRoundB;
      const initialScore = roundData ? roundData.totalScore : 0;
      setTeamDirectScore(initialScore);

      const initialPlayerScores: Record<string, number> = {};
      const activePlayers = targetTeam === 'A' ? teamA.players : teamB.players;
      activePlayers.forEach((p) => {
        initialPlayerScores[p.id] = roundData?.playerScores?.[p.id] ?? 0;
      });
      setTeamPlayerScores(initialPlayerScores);
    }
  }, [activeTeamStage, isTeamGame, currentGameId, totalTimerSecs]);

  // Accurate Timer Loop with Web Audio triggers
  useEffect(() => {
    if (!timerRunning) return;

    let frameId: number;

    const tick = () => {
      if (!timerEndTimestampRef.current) return;
      const now = Date.now();
      const diffMs = timerEndTimestampRef.current - now;
      const curSecs = Math.max(0, Math.ceil(diffMs / 1000));

      setRemainingSecs(curSecs);

      // Section 4 audio: NO ticking during first 50s.
      // Urgent countdown ticking PRECISELY at last 10 seconds: 10, 9, 8 ... down to 1
      if (curSecs <= 10 && curSecs > 0) {
        if (lastUrgentBeepSecRef.current !== curSecs) {
          lastUrgentBeepSecRef.current = curSecs;
          soundEngine.playUrgentTick(curSecs);
        }
      }

      // Time's Up Trigger (at exactly 0)
      if (diffMs <= 0) {
        setTimerRunning(false);
        setRemainingSecs(0);
        setTimesUpTriggered(true);
        soundEngine.playTimesUpGong();
        setScoringPanelOpen(true);
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [timerRunning]);

  // Timer Handlers (plays mystic start sound on trigger)
  const handleStartTimer = () => {
    soundEngine.playMysticStart();
    const duration = remainingSecs > 0 ? remainingSecs : totalTimerSecs;
    timerEndTimestampRef.current = Date.now() + duration * 1000;
    setTimerRunning(true);
    setTimesUpTriggered(false);
  };

  const handlePauseTimer = () => {
    if (!timerRunning) return;
    setTimerRunning(false);
    timerPausedRemainingRef.current = remainingSecs;
    timerEndTimestampRef.current = null;
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimesUpTriggered(false);
    setRemainingSecs(totalTimerSecs);
    timerPausedRemainingRef.current = totalTimerSecs;
    timerEndTimestampRef.current = null;
    lastUrgentBeepSecRef.current = null;
  };

  const handleAdjustTimer = (delta: number) => {
    const nextVal = Math.max(5, totalTimerSecs + delta);
    setTotalTimerSecs(nextVal);
    onUpdateTimerSecondsSetting(nextVal);
    if (!timerRunning) {
      setRemainingSecs(nextVal);
      timerPausedRemainingRef.current = nextVal;
    } else {
      if (timerEndTimestampRef.current) {
        timerEndTimestampRef.current += delta * 1000;
      }
    }
  };

  const handleResetToDefault60 = () => {
    setTotalTimerSecs(60);
    onUpdateTimerSecondsSetting(60);
    if (!timerRunning) {
      setRemainingSecs(60);
      timerPausedRemainingRef.current = 60;
    }
  };

  // Roulette Game Draw
  const handleStartGameDraw = () => {
    const unplayed = games.filter((g) => g.status === 'NOT_PLAYED');
    if (unplayed.length === 0) return;

    setIsDrawingGame(true);
    let iterations = 0;
    const maxIterations = 20;

    const interval = setInterval(() => {
      const randomGame = unplayed[Math.floor(Math.random() * unplayed.length)];
      setDrawDisplayTitle(randomGame.name);
      soundEngine.playTick();
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(interval);
        onDrawRandomGame();
        setIsDrawingGame(false);
        soundEngine.playMysticStart();
      }
    }, 100);
  };

  // Save Duel Score
  const handleSaveDuel = () => {
    if (!currentGameId || activeDuel === null) return;
    onSaveDuelScore(currentGameId, currentDuelIndex, scoreInputA, scoreInputB);
    setScoringPanelOpen(false);
  };

  // Save Team Round Score
  const handleSaveTeamRound = () => {
    if (!currentGameId) return;
    const activeTeam = activeTeamStage === 'TEAM_A' ? 'A' : 'B';
    const activeRoster = activeTeam === 'A' ? teamA.players : teamB.players;

    let finalTotal = teamDirectScore;
    let finalPlayerScores: Record<string, number> = {};

    if (teamScoreMode === 'PER_PLAYER') {
      finalPlayerScores = { ...teamPlayerScores };
      finalTotal = Object.values(finalPlayerScores).reduce((sum, val) => sum + val, 0);
    } else {
      // Direct team score: distribute 1/4 share to individual player statistics
      const perPlayer = Math.round((teamDirectScore / 4) * 10) / 10;
      activeRoster.forEach((p) => {
        finalPlayerScores[p.id] = perPlayer;
      });
    }

    onSaveTeamRoundScore(currentGameId, activeTeam, finalTotal, finalPlayerScores);
    setScoringPanelOpen(false);
  };

  // Remaining and completed games
  const completedGamesCount = games.filter((g) => g.status === 'COMPLETED').length;
  const unplayedGamesCount = games.filter((g) => g.status === 'NOT_PLAYED').length;
  const allGamesFinished = games.length > 0 && unplayedGamesCount === 0 && !currentGame;

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isUrgent = timerRunning && remainingSecs <= 10 && remainingSecs > 0;
  const progressPercent = Math.min(100, Math.max(0, (remainingSecs / totalTimerSecs) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 relative z-10 space-y-6">
      {/* 5.1 LIVE SCOREBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {/* TEAM A CARD */}
        <div
          className={`relative rounded-2xl p-5 md:p-6 bg-gradient-to-br from-[#18121f] to-[#120d18] border transition-all duration-300 shadow-xl ${
            teamA.isLeader
              ? 'border-amber-500/80 shadow-amber-950/40 ring-1 ring-amber-500/50'
              : 'border-orange-500/25'
          }`}
        >
          {teamA.isLeader && (
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
              <Trophy className="w-3 h-3" />
              <span>VEZETŐ CSAPAT (+{teamA.pointDiff} pont)</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-[11px] uppercase font-mono tracking-wider text-orange-400">
                  {teamA.code}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold font-cinzel text-white mt-0.5 truncate max-w-[280px]">
                {teamA.name}
              </h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {teamA.players.map((p) => (
                  <span
                    key={p.id}
                    className="text-xs px-2 py-0.5 rounded-md bg-zinc-900/80 border border-orange-500/20 text-zinc-300"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Total Points */}
            <div className="text-right shrink-0">
              <div className="text-4xl md:text-5xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-amber-200 to-orange-500 tabular-nums">
                {teamA.totalScore}
              </div>
              <span className="text-[11px] uppercase font-mono tracking-widest text-orange-400 block -mt-1">
                ÖSSZES PONT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-800 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Nyert játékok:</span>
              <span className="font-mono font-bold text-white tabular-nums">{teamA.wonGames}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Nyert párbajok:</span>
              <span className="font-mono font-bold text-white tabular-nums">{teamA.wonDuels}</span>
            </div>
          </div>
        </div>

        {/* TEAM B CARD */}
        <div
          className={`relative rounded-2xl p-5 md:p-6 bg-gradient-to-br from-[#161022] to-[#0e0a16] border transition-all duration-300 shadow-xl ${
            teamB.isLeader
              ? 'border-purple-400/80 shadow-purple-950/40 ring-1 ring-purple-400/50'
              : 'border-purple-500/25'
          }`}
        >
          {teamB.isLeader && (
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
              <Trophy className="w-3 h-3" />
              <span>VEZETŐ CSAPAT (+{teamB.pointDiff} pont)</span>
            </div>
          )}

          {teamA.isTie && teamA.totalScore > 0 && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black text-[11px] font-extrabold uppercase tracking-wider shadow-md">
              DÖNTETLEN ÁLLÁS
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-[11px] uppercase font-mono tracking-wider text-purple-400">
                  {teamB.code}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold font-cinzel text-white mt-0.5 truncate max-w-[280px]">
                {teamB.name}
              </h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {teamB.players.map((p) => (
                  <span
                    key={p.id}
                    className="text-xs px-2 py-0.5 rounded-md bg-zinc-900/80 border border-purple-500/20 text-zinc-300"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Total Points */}
            <div className="text-right shrink-0">
              <div className="text-4xl md:text-5xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-br from-purple-300 via-indigo-200 to-purple-400 tabular-nums">
                {teamB.totalScore}
              </div>
              <span className="text-[11px] uppercase font-mono tracking-widest text-purple-400 block -mt-1">
                ÖSSZES PONT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-800 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Nyert játékok:</span>
              <span className="font-mono font-bold text-white tabular-nums">{teamB.wonGames}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Nyert párbajok:</span>
              <span className="font-mono font-bold text-white tabular-nums">{teamB.wonDuels}</span>
            </div>
          </div>
        </div>
      </div>

      {/* HEADER STATUS STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#14101A] border border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Aktuális versenyállás:</span>
          <span className="font-mono font-bold text-orange-400">
            {completedGamesCount} befejezve
          </span>
          <span className="text-zinc-600">/</span>
          <span className="font-mono text-zinc-400">{unplayedGamesCount} hátralévő játék</span>
        </div>

        {currentGame && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Játék:</span>
            <span className="font-bold text-zinc-200">{currentGame.name}</span>
            <span className="text-zinc-600">·</span>
            <span
              className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                isTeamGame
                  ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                  : 'bg-orange-950/60 text-orange-300 border border-orange-500/30'
              }`}
            >
              {isTeamGame ? '👥 TELJES CSAPATOS' : '⚔️ EGYÉNI PÁRBAJ'}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="font-mono text-amber-300 font-bold">
              {isTeamGame
                ? activeTeamStage === 'TEAM_A'
                  ? '1. kör (A csapat)'
                  : activeTeamStage === 'TEAM_B'
                  ? '2. kör (B csapat)'
                  : 'Összesítés'
                : `${currentDuelIndex + 1}. párbaj a 4-ből`}
            </span>
          </div>
        )}
      </div>

      {/* CENTRAL COCKPIT */}
      {!currentGame ? (
        /* NO ACTIVE GAME STATE: DRAW GAME VIEW */
        <div className="rounded-3xl p-8 md:p-12 bg-gradient-to-b from-[#181124] to-[#0f0b17] border border-orange-500/30 text-center shadow-2xl relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-xl shadow-orange-950/60 border border-orange-400/40">
              <Skull className="w-10 h-10 text-white animate-pulse" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-orange-400">
                1 Perc és Nyersz · Halloween Bajnokság
              </span>
              <h2 className="text-2xl md:text-4xl font-extrabold font-cinzel text-white mt-1">
                KÖVETKEZŐ JÁTÉK KISORSOLÁSA
              </h2>
              <p className="text-sm text-zinc-400 mt-2">
                A rendszer véletlenszerűen kiválaszt egyet a hátralévő játékok közül, és automatikusan
                elindítja a megfelelő menetrendet (Teljes csapatos vagy Egyéni párbaj).
              </p>
            </div>

            {/* Drawing Animation */}
            {isDrawingGame && (
              <div className="p-4 rounded-xl bg-orange-950/40 border border-orange-500/40 animate-pulse text-orange-300 font-cinzel text-lg font-bold">
                🎲 Sorsolás: {drawDisplayTitle || 'Keresés...'}
              </div>
            )}

            {/* Draw Button */}
            {!isDrawingGame && unplayedGamesCount > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleStartGameDraw}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-700 hover:from-orange-500 hover:to-amber-400 text-white font-cinzel font-bold text-lg shadow-xl shadow-orange-950/50 transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Shuffle className="w-5 h-5" />
                  <span>🎲 KÖVETKEZŐ JÁTÉK KISORSOLÁSA</span>
                </button>
              </div>
            )}

            {/* All Games Finished Banner */}
            {allGamesFinished && (
              <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-center space-y-4">
                <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
                <h3 className="text-xl font-bold font-cinzel text-white">
                  Minden játék lezajlott vagy befejeződött!
                </h3>
                <p className="text-sm text-zinc-300">
                  Gratulálunk! Ideje kihirdetni a győztes csapatot és átadni a Halloween Hall of Fame
                  különdíjait.
                </p>
                <button
                  onClick={onOpenHallOfFame}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-cinzel font-black tracking-wider text-base shadow-xl hover:scale-105 transition-all"
                >
                  🏆 JÁTÉK VÉGE – EREDMÉNYHIRDETÉS
                </button>
              </div>
            )}

            {/* Manual Pick / Skip Option */}
            {unplayedGamesCount > 0 && !isDrawingGame && (
              <div className="pt-6 border-t border-zinc-800">
                <span className="text-xs text-zinc-500 block mb-3">Vagy válassz kézzel egy játékot:</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {games
                    .filter((g) => g.status === 'NOT_PLAYED')
                    .map((g) => (
                      <button
                        key={g.id}
                        onClick={() => onSelectGame(g.id)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <span>{g.gameType === 'TEAM' ? '👥' : '⚔️'}</span>
                        <span>{g.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ACTIVE GAME CONSOLE VIEW */
        <div className="space-y-6">
          {/* Active Game Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#15101E] border border-orange-500/30 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center font-cinzel font-bold text-xl">
                🎃
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-orange-400">
                    Aktuális Versenyszám
                  </span>
                  <span className="text-xs text-zinc-500">·</span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      isTeamGame
                        ? 'bg-purple-950/50 text-purple-300 border border-purple-500/30'
                        : 'bg-orange-950/50 text-orange-300 border border-orange-500/30'
                    }`}
                  >
                    {isTeamGame ? '👥 TELJES CSAPATOS' : '⚔️ EGYÉNI PÁRBAJ'}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-cinzel text-white">
                  {currentGame.name}
                </h2>
                {currentGame.description && (
                  <p className="text-xs text-zinc-400 mt-0.5">{currentGame.description}</p>
                )}
              </div>
            </div>

            {/* Skip Game Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSkipGame(currentGame.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                title="Játék kihagyása"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Kihagyás</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* A) TELJES CSAPATOS JÁTÉKMENET (Section 1.A & 3) */}
          {/* ======================================================== */}
          {isTeamGame && !isMatchComplete && (
            <div className="space-y-6">
              {/* Team Progress Stepper (A kör -> B kör) */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl border text-center transition-all ${
                    activeTeamStage === 'TEAM_A'
                      ? 'bg-orange-500/15 border-orange-500 ring-1 ring-orange-500/50 shadow-md'
                      : currentMatch?.teamRoundA?.completed
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="font-bold">1. KÖR: {teamA.name}</span>
                    {currentMatch?.teamRoundA?.completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] text-orange-400">
                        {activeTeamStage === 'TEAM_A' ? 'AKTÍV KÖR' : 'VÁR'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-300">Mind a 4 játékos együtt versenyez</div>
                  {currentMatch?.teamRoundA?.completed && (
                    <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                      {currentMatch.teamRoundA.totalScore} pont
                    </div>
                  )}
                </div>

                <div
                  className={`p-4 rounded-xl border text-center transition-all ${
                    activeTeamStage === 'TEAM_B'
                      ? 'bg-purple-500/15 border-purple-500 ring-1 ring-purple-500/50 shadow-md'
                      : currentMatch?.teamRoundB?.completed
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="font-bold">2. KÖR: {teamB.name}</span>
                    {currentMatch?.teamRoundB?.completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] text-purple-400">
                        {activeTeamStage === 'TEAM_B' ? 'AKTÍV KÖR' : 'VÁR'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-300">Mind a 4 játékos együtt versenyez</div>
                  {currentMatch?.teamRoundB?.completed && (
                    <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                      {currentMatch.teamRoundB.totalScore} pont
                    </div>
                  )}
                </div>
              </div>

              {/* Active Team Stage Banner & 4 Players */}
              <div
                className={`p-6 rounded-2xl border transition-all ${
                  activeTeamStage === 'TEAM_A'
                    ? 'bg-gradient-to-b from-[#1f1224] to-[#120b17] border-orange-500/40'
                    : 'bg-gradient-to-b from-[#1b102b] to-[#110a1b] border-purple-500/40'
                }`}
              >
                <div className="text-center mb-4">
                  <span
                    className={`text-xs font-mono uppercase tracking-widest font-bold ${
                      activeTeamStage === 'TEAM_A' ? 'text-orange-400' : 'text-purple-400'
                    }`}
                  >
                    {activeTeamStage === 'TEAM_A' ? '1. FORDULÓ · A CSAPAT TELJESÍT' : '2. FORDULÓ · B CSAPAT TELJESÍT'}
                  </span>
                  <h3 className="text-2xl font-black font-cinzel text-white mt-1">
                    {activeTeamStage === 'TEAM_A' ? teamA.name : teamB.name}
                  </h3>
                </div>

                {/* 4 Team Members Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto my-4">
                  {(activeTeamStage === 'TEAM_A' ? teamA.players : teamB.players).map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center"
                    >
                      <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 text-white font-cinzel font-bold flex items-center justify-center mb-1">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-semibold text-white block truncate">{p.name}</span>
                    </div>
                  ))}
                </div>

                {/* Dramatic Countdown Timer for Team Round */}
                <div
                  className={`mt-6 p-6 rounded-2xl border transition-all duration-500 ${
                    isUrgent
                      ? 'bg-red-950/50 border-red-500/80 ring-2 ring-red-500 shadow-2xl shadow-red-950/70'
                      : 'bg-[#100b17] border-zinc-800'
                  }`}
                >
                  {timesUpTriggered && (
                    <div className="text-center py-3 mb-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-cinzel font-black text-2xl md:text-4xl tracking-widest animate-bounce shadow-xl">
                      TIME'S UP!
                    </div>
                  )}

                  <div className="text-center relative">
                    <div
                      className={`text-6xl md:text-8xl font-black font-mono tracking-wider tabular-nums transition-all ${
                        isUrgent
                          ? 'text-red-500 animate-urgent drop-shadow-[0_0_35px_rgba(215,38,56,0.9)]'
                          : timerRunning
                          ? 'text-orange-400 drop-shadow-[0_0_20px_rgba(255,117,24,0.5)]'
                          : 'text-zinc-200'
                      }`}
                    >
                      {formatTime(remainingSecs)}
                    </div>

                    <div className="w-full max-w-md mx-auto h-2.5 bg-zinc-900 rounded-full overflow-hidden mt-3 border border-zinc-800">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isUrgent
                            ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
                            : 'bg-gradient-to-r from-orange-500 to-amber-400'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Timer +/- Adjustments */}
                  <div className="flex items-center justify-center gap-2 mt-5">
                    <button
                      onClick={() => handleAdjustTimer(-5)}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 active:scale-95 transition-all"
                    >
                      − 5 MÁSODPERC
                    </button>
                    <button
                      onClick={handleResetToDefault60}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 active:scale-95 transition-all"
                    >
                      Visszaállítás 60 mp-re
                    </button>
                    <button
                      onClick={() => handleAdjustTimer(5)}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 active:scale-95 transition-all"
                    >
                      + 5 MÁSODPERC
                    </button>
                  </div>

                  {/* Timer Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                    {!timerRunning ? (
                      <button
                        onClick={handleStartTimer}
                        className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-700 hover:from-orange-500 hover:to-amber-400 text-white font-cinzel font-bold text-base shadow-xl shadow-orange-950/50 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>{remainingSecs < totalTimerSecs ? 'FOLYTATÁS' : 'START'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handlePauseTimer}
                        className="px-8 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-cinzel font-bold text-base border border-amber-500/40 shadow-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                      >
                        <Pause className="w-5 h-5 fill-current" />
                        <span>PAUSE</span>
                      </button>
                    )}

                    <button
                      onClick={handleResetTimer}
                      className="px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-sm font-medium transition-all active:scale-95 flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>ÚJRAINDÍTÁS</span>
                    </button>

                    <button
                      onClick={() => setScoringPanelOpen(!scoringPanelOpen)}
                      className="px-5 py-3.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 text-purple-300 border border-purple-500/40 text-sm font-medium transition-all flex items-center gap-2"
                    >
                      <span>Pontozás megnyitása</span>
                    </button>
                  </div>
                </div>

                {/* Team Scoring Panel */}
                {scoringPanelOpen && (
                  <div className="mt-6 p-6 rounded-2xl bg-[#140f1c] border-2 border-purple-500/60 shadow-2xl space-y-6 animate-in fade-in">
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400">
                        Csapat Pontozása
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold font-cinzel text-white">
                        {activeTeamStage === 'TEAM_A' ? teamA.name : teamB.name} pontszámának rögzítése
                      </h3>

                      {/* Mode Switcher: Direct or Per-player */}
                      <div className="inline-flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl mt-3">
                        <button
                          onClick={() => setTeamScoreMode('DIRECT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            teamScoreMode === 'DIRECT'
                              ? 'bg-purple-600 text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Közvetlen csapatpontszám
                        </button>
                        <button
                          onClick={() => setTeamScoreMode('PER_PLAYER')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            teamScoreMode === 'PER_PLAYER'
                              ? 'bg-purple-600 text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Egyéni játékosonkénti pontozás
                        </button>
                      </div>
                    </div>

                    {/* Mode 1: Direct Team Score */}
                    {teamScoreMode === 'DIRECT' ? (
                      <div className="max-w-md mx-auto text-center p-5 rounded-2xl bg-zinc-900/80 border border-purple-500/30">
                        <span className="text-xs text-zinc-400 block mb-2">Összesített csapatpont:</span>
                        <div className="flex items-center justify-center gap-3 my-4">
                          <button
                            onClick={() => setTeamDirectScore((prev) => Math.max(0, prev - 5))}
                            className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-lg active:scale-95 flex items-center justify-center"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => setTeamDirectScore((prev) => Math.max(0, prev - 1))}
                            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm active:scale-95 flex items-center justify-center"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={teamDirectScore}
                            onChange={(e) => setTeamDirectScore(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-24 py-2 rounded-xl bg-black border-2 border-purple-500 text-center text-3xl font-mono font-bold text-white outline-none"
                          />
                          <button
                            onClick={() => setTeamDirectScore((prev) => prev + 1)}
                            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm active:scale-95 flex items-center justify-center"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => setTeamDirectScore((prev) => prev + 5)}
                            className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-lg active:scale-95 flex items-center justify-center"
                          >
                            +5
                          </button>
                        </div>

                        {/* Presets */}
                        <div className="flex justify-center gap-1.5 mt-2">
                          {[0, 10, 20, 25, 40, 50, 100].map((val) => (
                            <button
                              key={val}
                              onClick={() => setTeamDirectScore(val)}
                              className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] text-zinc-400 hover:text-white"
                            >
                              {val}p
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Mode 2: Per-Player Scoring */
                      <div className="max-w-xl mx-auto space-y-3">
                        {(activeTeamStage === 'TEAM_A' ? teamA.players : teamB.players).map((p) => {
                          const val = teamPlayerScores[p.id] ?? 0;
                          return (
                            <div
                              key={p.id}
                              className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-4"
                            >
                              <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    setTeamPlayerScores((prev) => ({
                                      ...prev,
                                      [p.id]: Math.max(0, (prev[p.id] || 0) - 1),
                                    }))
                                  }
                                  className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold"
                                >
                                  -1
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={val}
                                  onChange={(e) =>
                                    setTeamPlayerScores((prev) => ({
                                      ...prev,
                                      [p.id]: Math.max(0, parseInt(e.target.value) || 0),
                                    }))
                                  }
                                  className="w-16 py-1 rounded bg-black border border-purple-500 text-center font-mono font-bold text-white text-sm outline-none"
                                />
                                <button
                                  onClick={() =>
                                    setTeamPlayerScores((prev) => ({
                                      ...prev,
                                      [p.id]: (prev[p.id] || 0) + 1,
                                    }))
                                  }
                                  className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold"
                                >
                                  +1
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Calculated sum indicator */}
                        <div className="p-3 rounded-xl bg-black/40 border border-purple-500/40 text-center text-sm font-mono">
                          <span>Kiszámított csapatösszpontszám: </span>
                          <span className="text-purple-400 font-bold text-lg">
                            {Object.values(teamPlayerScores).reduce((sum, v) => sum + v, 0)} pont
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="text-center pt-2">
                      <button
                        onClick={handleSaveTeamRound}
                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-cinzel font-bold text-base shadow-xl shadow-emerald-950/50 active:scale-95 transition-all"
                      >
                        {activeTeamStage === 'TEAM_A'
                          ? 'A CSAPAT EREDMÉNYÉNEK MENTÉSE ÉS TOVÁBB A B CSAPATRA'
                          : 'B CSAPAT EREDMÉNYÉNEK MENTÉSE ÉS JÁTÉK LEZÁRÁSA'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* B) EGYÉNI PÁRBAJ JÁTÉKMENET (DUEL: 4 Párbaj) */}
          {/* ======================================================== */}
          {!isTeamGame && activeDuel && !isMatchComplete && (
            <div className="rounded-2xl p-6 bg-gradient-to-b from-[#1b1226] to-[#110d1a] border border-orange-500/30 shadow-2xl relative overflow-hidden">
              <div className="text-center mb-4">
                <span className="text-[11px] uppercase font-mono tracking-widest text-orange-400">
                  {currentDuelIndex + 1}. PÁRBAJ · {currentGame.name}
                </span>
              </div>

              {/* Opposing Fighters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                {/* Player A Box */}
                <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-orange-950/40 to-zinc-900/80 border border-orange-500/40 text-center md:text-left flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-cinzel font-black text-2xl shadow-lg shadow-orange-950/50 shrink-0">
                    {playerA?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-mono text-orange-400 tracking-wider block">
                      {teamA.name}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold font-cinzel text-white truncate">
                      {playerA?.name || 'A Játékos'}
                    </h3>
                  </div>
                </div>

                {/* VS Centerpiece */}
                <div className="md:col-span-1 text-center py-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900 border border-orange-500/40 flex items-center justify-center font-cinzel font-black text-orange-400 text-sm shadow-lg animate-pulse">
                    VS
                  </div>
                </div>

                {/* Player B Box */}
                <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-l from-purple-950/40 to-zinc-900/80 border border-purple-500/40 text-center md:text-right flex items-center flex-row-reverse md:flex-row gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-mono text-purple-400 tracking-wider block">
                      {teamB.name}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold font-cinzel text-white truncate">
                      {playerB?.name || 'B Játékos'}
                    </h3>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-cinzel font-black text-2xl shadow-lg shadow-purple-950/50 shrink-0">
                    {playerB?.name?.charAt(0) || 'B'}
                  </div>
                </div>
              </div>

              {/* Dramatic Countdown Timer for Duel */}
              <div
                className={`mt-6 p-6 rounded-2xl border transition-all duration-500 ${
                  isUrgent
                    ? 'bg-red-950/50 border-red-500/80 ring-2 ring-red-500 shadow-2xl shadow-red-950/70'
                    : 'bg-[#100b17] border-zinc-800'
                }`}
              >
                {timesUpTriggered && (
                  <div className="text-center py-3 mb-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-cinzel font-black text-2xl md:text-4xl tracking-widest animate-bounce shadow-xl">
                    TIME'S UP!
                  </div>
                )}

                <div className="text-center relative">
                  <div
                    className={`text-6xl md:text-8xl font-black font-mono tracking-wider tabular-nums transition-all ${
                      isUrgent
                        ? 'text-red-500 animate-urgent drop-shadow-[0_0_35px_rgba(215,38,56,0.9)]'
                        : timerRunning
                        ? 'text-orange-400 drop-shadow-[0_0_20px_rgba(255,117,24,0.5)]'
                        : 'text-zinc-200'
                    }`}
                  >
                    {formatTime(remainingSecs)}
                  </div>

                  <div className="w-full max-w-md mx-auto h-2.5 bg-zinc-900 rounded-full overflow-hidden mt-3 border border-zinc-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isUrgent
                          ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
                          : 'bg-gradient-to-r from-orange-500 to-amber-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-5">
                  <button
                    onClick={() => handleAdjustTimer(-5)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 active:scale-95 transition-all"
                  >
                    − 5 MÁSODPERC
                  </button>
                  <button
                    onClick={handleResetToDefault60}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 active:scale-95 transition-all"
                  >
                    Visszaállítás 60 mp-re
                  </button>
                  <button
                    onClick={() => handleAdjustTimer(5)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 active:scale-95 transition-all"
                  >
                    + 5 MÁSODPERC
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                  {!timerRunning ? (
                    <button
                      onClick={handleStartTimer}
                      className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-700 hover:from-orange-500 hover:to-amber-400 text-white font-cinzel font-bold text-base shadow-xl shadow-orange-950/50 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>{remainingSecs < totalTimerSecs ? 'FOLYTATÁS' : 'START'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseTimer}
                      className="px-8 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-cinzel font-bold text-base border border-amber-500/40 shadow-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <Pause className="w-5 h-5 fill-current" />
                      <span>PAUSE</span>
                    </button>
                  )}

                  <button
                    onClick={handleResetTimer}
                    className="px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-sm font-medium transition-all active:scale-95 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>ÚJRAINDÍTÁS</span>
                  </button>

                  <button
                    onClick={() => setScoringPanelOpen(!scoringPanelOpen)}
                    className="px-5 py-3.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 text-purple-300 border border-purple-500/40 text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <span>Pontozás megnyitása</span>
                  </button>
                </div>
              </div>

              {/* Duel Scoring Panel */}
              {scoringPanelOpen && (
                <div className="mt-6 p-6 rounded-2xl bg-[#140f1c] border-2 border-orange-500/60 shadow-2xl animate-in fade-in duration-300">
                  <div className="text-center mb-6">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-orange-400">
                      Párbaj Pontozása
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold font-cinzel text-white">
                      Rögzítsd a párbaj eredményét
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {/* Player A Score Input */}
                    <div className="p-4 rounded-xl bg-zinc-900/90 border border-orange-500/30 text-center">
                      <span className="text-[11px] uppercase font-mono text-orange-400 block truncate">
                        {teamA.name}
                      </span>
                      <h4 className="text-lg font-bold text-white truncate">
                        {playerA?.name || 'A Játékos'}
                      </h4>

                      <div className="flex items-center justify-center gap-3 my-4">
                        <button
                          onClick={() => setScoreInputA((prev) => Math.max(0, prev - 5))}
                          className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-lg active:scale-95 flex items-center justify-center"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => setScoreInputA((prev) => Math.max(0, prev - 1))}
                          className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm active:scale-95 flex items-center justify-center"
                        >
                          -1
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={scoreInputA}
                          onChange={(e) => setScoreInputA(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-20 py-2 rounded-xl bg-black border-2 border-orange-500 text-center text-2xl font-mono font-bold text-white outline-none"
                        />
                        <button
                          onClick={() => setScoreInputA((prev) => prev + 1)}
                          className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm active:scale-95 flex items-center justify-center"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => setScoreInputA((prev) => prev + 5)}
                          className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-lg active:scale-95 flex items-center justify-center"
                        >
                          +5
                        </button>
                      </div>

                      <div className="flex justify-center gap-1.5">
                        {[0, 10, 20, 25, 50].map((val) => (
                          <button
                            key={val}
                            onClick={() => setScoreInputA(val)}
                            className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] text-zinc-400 hover:text-white"
                          >
                            {val}p
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Player B Score Input */}
                    <div className="p-4 rounded-xl bg-zinc-900/90 border border-purple-500/30 text-center">
                      <span className="text-[11px] uppercase font-mono text-purple-400 block truncate">
                        {teamB.name}
                      </span>
                      <h4 className="text-lg font-bold text-white truncate">
                        {playerB?.name || 'B Játékos'}
                      </h4>

                      <div className="flex items-center justify-center gap-3 my-4">
                        <button
                          onClick={() => setScoreInputB((prev) => Math.max(0, prev - 5))}
                          className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-lg active:scale-95 flex items-center justify-center"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => setScoreInputB((prev) => Math.max(0, prev - 1))}
                          className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm active:scale-95 flex items-center justify-center"
                        >
                          -1
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={scoreInputB}
                          onChange={(e) => setScoreInputB(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-20 py-2 rounded-xl bg-black border-2 border-purple-500 text-center text-2xl font-mono font-bold text-white outline-none"
                        />
                        <button
                          onClick={() => setScoreInputB((prev) => prev + 1)}
                          className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm active:scale-95 flex items-center justify-center"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => setScoreInputB((prev) => prev + 5)}
                          className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-lg active:scale-95 flex items-center justify-center"
                        >
                          +5
                        </button>
                      </div>

                      <div className="flex justify-center gap-1.5">
                        {[0, 10, 20, 25, 50].map((val) => (
                          <button
                            key={val}
                            onClick={() => setScoreInputB(val)}
                            className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] text-zinc-400 hover:text-white"
                          >
                            {val}p
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-6">
                    <button
                      onClick={handleSaveDuel}
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-cinzel font-bold text-base shadow-xl shadow-emerald-950/50 active:scale-95 transition-all"
                    >
                      {currentDuelIndex < 3
                        ? 'EREDMÉNY MENTÉSE ÉS KÖVETKEZŐ PÁRBAJ'
                        : 'EREDMÉNY MENTÉSE ÉS JÁTÉK LEZÁRÁSA'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ROUND SUMMARY (Both DUEL and TEAM games) */}
          {/* ======================================================== */}
          {isMatchComplete && currentMatch && (
            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#181024] to-[#0e0a16] border-2 border-amber-500/60 shadow-2xl text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-2xl font-cinzel">
                🎉
              </div>

              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-amber-400">
                  Játék sikeresen befejezve!
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold font-cinzel text-white mt-1">
                  {currentGame.name} — Végeredmény
                </h3>
              </div>

              {/* Match Score Display */}
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="text-right">
                  <span className="text-xs text-orange-400 block font-mono">{teamA.name}</span>
                  <span className="text-4xl md:text-5xl font-black font-cinzel text-white tabular-nums">
                    {currentMatch.totalScoreA}
                  </span>
                </div>
                <span className="text-2xl font-mono text-zinc-600">VS</span>
                <div className="text-left">
                  <span className="text-xs text-purple-400 block font-mono">{teamB.name}</span>
                  <span className="text-4xl md:text-5xl font-black font-cinzel text-white tabular-nums">
                    {currentMatch.totalScoreB}
                  </span>
                </div>
              </div>

              {/* Game Winner announcement */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-sm font-semibold">
                {currentMatch.winnerTeam === 'A' && (
                  <span className="text-orange-400 font-cinzel">
                    🏆 A játék győztese: {teamA.name}!
                  </span>
                )}
                {currentMatch.winnerTeam === 'B' && (
                  <span className="text-purple-400 font-cinzel">
                    🏆 A játék győztese: {teamB.name}!
                  </span>
                )}
                {currentMatch.winnerTeam === 'DRAW' && (
                  <span className="text-amber-400 font-cinzel">
                    ⚖️ Döntetlen játék! Mindkét csapat 0.5 győzelmet kap.
                  </span>
                )}
              </div>

              {/* Next Game Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                {unplayedGamesCount > 0 ? (
                  <button
                    onClick={handleStartGameDraw}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-700 hover:from-orange-500 hover:to-amber-400 text-white font-cinzel font-bold text-base shadow-xl shadow-orange-950/50 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Shuffle className="w-5 h-5" />
                    <span>KÖVETKEZŐ JÁTÉK KISORSOLÁSA</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenHallOfFame}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-cinzel font-black tracking-wider text-base shadow-xl hover:scale-105 transition-all"
                  >
                    🏆 JÁTÉK VÉGE – EREDMÉNYHIRDETÉS
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
