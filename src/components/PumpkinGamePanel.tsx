import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  Settings,
  Shuffle,
  Users,
  Award,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { GameItem, GameMatch, Player, PumpkinPair, PumpkinSettings } from '../types/game';
import { TeamStats } from '../utils/calculations';
import { soundEngine } from '../utils/sound';

interface PumpkinGamePanelProps {
  game: GameItem;
  match: GameMatch;
  players: Player[];
  teamA: TeamStats;
  teamB: TeamStats;
  onUpdateMatchData: (updatedMatch: GameMatch) => void;
  onFinalizePumpkin: (
    scoreA: number,
    scoreB: number,
    winnerTeam: 'A' | 'B' | 'DRAW',
    pairs: PumpkinPair[]
  ) => void;
}

export const PumpkinGamePanel: React.FC<PumpkinGamePanelProps> = ({
  game,
  match,
  players,
  teamA,
  teamB,
  onUpdateMatchData,
  onFinalizePumpkin,
}) => {
  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  const pumpkinData = match.pumpkinData || {
    settings: game.pumpkinSettings || {
      hasTimeLimit: true,
      timeLimitSeconds: 1800, // 30 minutes
      rankPoints: { 1: 100, 2: 75, 3: 50, 4: 25 },
      drawPoints: 50,
    },
    pairs: [],
    timerRunning: false,
    startTime: null,
    elapsedBeforePause: 0,
    isPaused: false,
    evaluationFinalized: false,
    scoreA: 0,
    scoreB: 0,
    winnerTeam: null,
  };

  const [remainingSecs, setRemainingSecs] = useState<number>(
    pumpkinData.settings.hasTimeLimit
      ? Math.max(0, pumpkinData.settings.timeLimitSeconds - pumpkinData.elapsedBeforePause)
      : pumpkinData.elapsedBeforePause
  );
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [tempSettings, setTempSettings] = useState<PumpkinSettings>(pumpkinData.settings);

  // Pair editing state
  const [showPairModal, setShowPairModal] = useState<boolean>(false);
  const [editingPairs, setEditingPairs] = useState<PumpkinPair[]>(pumpkinData.pairs);

  // Evaluation state for the 4 pairs
  const [pairRanks, setPairRanks] = useState<Record<string, number>>({});
  const [pairScores, setPairScores] = useState<Record<string, number>>({});

  // Sync pairs on mount or update
  useEffect(() => {
    setEditingPairs(pumpkinData.pairs);
    const initialRanks: Record<string, number> = {};
    const initialScores: Record<string, number> = {};
    pumpkinData.pairs.forEach((pair, idx) => {
      initialRanks[pair.id] = pair.rank ?? (idx + 1);
      const defaultScore =
        pair.score > 0
          ? pair.score
          : pumpkinData.settings.rankPoints[
              (pair.rank ?? (idx + 1)) as 1 | 2 | 3 | 4
            ] || 25;
      initialScores[pair.id] = defaultScore;
    });
    setPairRanks(initialRanks);
    setPairScores(initialScores);
  }, [pumpkinData.pairs, pumpkinData.settings]);

  // Timestamp-based countdown/count-up timer loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      if (pumpkinData.timerRunning && pumpkinData.startTime && !pumpkinData.isPaused) {
        const now = Date.now();
        const currentElapsed =
          pumpkinData.elapsedBeforePause + (now - pumpkinData.startTime) / 1000;

        if (pumpkinData.settings.hasTimeLimit) {
          const left = Math.max(0, pumpkinData.settings.timeLimitSeconds - currentElapsed);
          setRemainingSecs(Math.ceil(left));

          if (left <= 0) {
            handleTimeExpire();
            return;
          }
        } else {
          setRemainingSecs(Math.floor(currentElapsed));
        }
      } else {
        if (pumpkinData.settings.hasTimeLimit) {
          setRemainingSecs(
            Math.max(0, pumpkinData.settings.timeLimitSeconds - pumpkinData.elapsedBeforePause)
          );
        } else {
          setRemainingSecs(pumpkinData.elapsedBeforePause);
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [
    pumpkinData.timerRunning,
    pumpkinData.startTime,
    pumpkinData.isPaused,
    pumpkinData.elapsedBeforePause,
    pumpkinData.settings,
  ]);

  // Format time mm:ss
  const formatTimer = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Timer: Start / Resume
  const handleStartTimer = () => {
    soundEngine.playMysticStart();
    const now = Date.now();
    const updated: GameMatch = {
      ...match,
      pumpkinData: {
        ...pumpkinData,
        timerRunning: true,
        startTime: now,
        isPaused: false,
      },
    };
    onUpdateMatchData(updated);
  };

  // Timer: Pause
  const handlePauseTimer = () => {
    if (!pumpkinData.startTime) return;
    const now = Date.now();
    const newElapsed = pumpkinData.elapsedBeforePause + (now - pumpkinData.startTime) / 1000;
    const updated: GameMatch = {
      ...match,
      pumpkinData: {
        ...pumpkinData,
        timerRunning: false,
        isPaused: true,
        elapsedBeforePause: newElapsed,
        startTime: null,
      },
    };
    onUpdateMatchData(updated);
  };

  // Timer: Reset
  const handleResetTimer = () => {
    const updated: GameMatch = {
      ...match,
      pumpkinData: {
        ...pumpkinData,
        timerRunning: false,
        startTime: null,
        elapsedBeforePause: 0,
        isPaused: false,
      },
    };
    onUpdateMatchData(updated);
  };

  // Timer: Time Expired
  const handleTimeExpire = () => {
    soundEngine.playTimesUpGong();
    const updated: GameMatch = {
      ...match,
      pumpkinData: {
        ...pumpkinData,
        timerRunning: false,
        isPaused: true,
        elapsedBeforePause: pumpkinData.settings.timeLimitSeconds,
      },
    };
    onUpdateMatchData(updated);
  };

  // Manual Finish
  const handleManualStop = () => {
    soundEngine.playTimesUpGong();
    const now = Date.now();
    const newElapsed = pumpkinData.startTime
      ? pumpkinData.elapsedBeforePause + (now - pumpkinData.startTime) / 1000
      : pumpkinData.elapsedBeforePause;

    const updated: GameMatch = {
      ...match,
      pumpkinData: {
        ...pumpkinData,
        timerRunning: false,
        isPaused: true,
        elapsedBeforePause: newElapsed,
      },
    };
    onUpdateMatchData(updated);
  };

  // Pair Re-shuffle within respective teams
  const handleReshufflePairs = () => {
    const teamAPlayers = [...players.filter((p) => p.team === 'A')];
    const teamBPlayers = [...players.filter((p) => p.team === 'B')];

    // Fisher-Yates
    for (let i = teamAPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamAPlayers[i], teamAPlayers[j]] = [teamAPlayers[j], teamAPlayers[i]];
    }
    for (let i = teamBPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamBPlayers[i], teamBPlayers[j]] = [teamBPlayers[j], teamBPlayers[i]];
    }

    const newPairs: PumpkinPair[] = [
      {
        id: `${game.id}_pair_A1`,
        team: 'A',
        pairNumber: 1,
        playerIds: [teamAPlayers[0]?.id || '', teamAPlayers[1]?.id || ''],
        rank: null,
        score: 0,
      },
      {
        id: `${game.id}_pair_A2`,
        team: 'A',
        pairNumber: 2,
        playerIds: [teamAPlayers[2]?.id || '', teamAPlayers[3]?.id || ''],
        rank: null,
        score: 0,
      },
      {
        id: `${game.id}_pair_B1`,
        team: 'B',
        pairNumber: 1,
        playerIds: [teamBPlayers[0]?.id || '', teamBPlayers[1]?.id || ''],
        rank: null,
        score: 0,
      },
      {
        id: `${game.id}_pair_B2`,
        team: 'B',
        pairNumber: 2,
        playerIds: [teamBPlayers[2]?.id || '', teamBPlayers[3]?.id || ''],
        rank: null,
        score: 0,
      },
    ];

    const updated: GameMatch = {
      ...match,
      pumpkinData: {
        ...pumpkinData,
        pairs: newPairs,
      },
    };
    onUpdateMatchData(updated);
  };

  // Swap a player between Pair 1 and Pair 2 of the same team
  const handleSwapWithinTeam = (
    team: 'A' | 'B',
    pair1Idx: 0 | 1,
    pair2Idx: 0 | 1
  ) => {
    const pair1 = pumpkinData.pairs.find((p) => p.team === team && p.pairNumber === 1);
    const pair2 = pumpkinData.pairs.find((p) => p.team === team && p.pairNumber === 2);
    if (!pair1 || !pair2) return;

    const newPlayerIds1: [string, string] = [...pair1.playerIds];
    const newPlayerIds2: [string, string] = [...pair2.playerIds];

    const temp = newPlayerIds1[pair1Idx];
    newPlayerIds1[pair1Idx] = newPlayerIds2[pair2Idx];
    newPlayerIds2[pair2Idx] = temp;

    const updatedPairs = pumpkinData.pairs.map((p) => {
      if (p.id === pair1.id) return { ...p, playerIds: newPlayerIds1 };
      if (p.id === pair2.id) return { ...p, playerIds: newPlayerIds2 };
      return p;
    });

    const updated: GameMatch = {
      ...match,
      pumpkinData: {
        ...pumpkinData,
        pairs: updatedPairs,
      },
    };
    onUpdateMatchData(updated);
  };

  // Rank change in Evaluation
  const handleRankChange = (pairId: string, newRank: number) => {
    setPairRanks((prev) => ({ ...prev, [pairId]: newRank }));
    // Auto populate default points for that rank
    const defaultPts =
      pumpkinData.settings.rankPoints[newRank as 1 | 2 | 3 | 4] ||
      pumpkinData.settings.drawPoints;
    setPairScores((prev) => ({ ...prev, [pairId]: defaultPts }));
  };

  // Score change in Evaluation
  const handleScoreChange = (pairId: string, newScore: number) => {
    setPairScores((prev) => ({ ...prev, [pairId]: newScore }));
  };

  // Calculate live team sums from pairs
  const pairA1 = pumpkinData.pairs.find((p) => p.team === 'A' && p.pairNumber === 1);
  const pairA2 = pumpkinData.pairs.find((p) => p.team === 'A' && p.pairNumber === 2);
  const pairB1 = pumpkinData.pairs.find((p) => p.team === 'B' && p.pairNumber === 1);
  const pairB2 = pumpkinData.pairs.find((p) => p.team === 'B' && p.pairNumber === 2);

  const teamASum =
    (pairScores[pairA1?.id || ''] || 0) + (pairScores[pairA2?.id || ''] || 0);
  const teamBSum =
    (pairScores[pairB1?.id || ''] || 0) + (pairScores[pairB2?.id || ''] || 0);

  // Finalize evaluation
  const handleFinalize = () => {
    const updatedPairs: PumpkinPair[] = pumpkinData.pairs.map((pair) => ({
      ...pair,
      rank: (pairRanks[pair.id] ?? 1) as 1 | 2 | 3 | 4,
      score: pairScores[pair.id] ?? 0,
    }));

    let winner: 'A' | 'B' | 'DRAW' = 'DRAW';
    if (teamASum > teamBSum) winner = 'A';
    else if (teamBSum > teamASum) winner = 'B';

    soundEngine.playTimesUpGong();
    onFinalizePumpkin(teamASum, teamBSum, winner, updatedPairs);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-orange-950/40 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner">
            🎃
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono uppercase font-bold tracking-wider">
                Négy Pár · Egyidejű Csapatverseny
              </span>
              {pumpkinData.evaluationFinalized && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  ✓ Lezárva
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold font-cinzel text-white mt-0.5">
              {game.name}
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              Mind a 4 pár (2 A-csapatos és 2 B-csapatos pár) egyszerre faragja a tökét. Közös 30 perces visszaszámlálás, majd a 4 tök együttes értékelése.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!pumpkinData.timerRunning && !pumpkinData.evaluationFinalized && (
            <button
              onClick={handleReshufflePairs}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
              title="Párok véletlenszerű újrasorsolása a csapatokon belül"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Párok újrasorsolása</span>
            </button>
          )}

          <button
            onClick={() => {
              setTempSettings(pumpkinData.settings);
              setShowSettingsModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Beállítások</span>
          </button>
        </div>
      </div>

      {/* Central Big Shared Countdown Timer Stage */}
      <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1c1328] via-[#120c1a] to-[#0b0811] border-2 border-amber-500/40 text-center relative overflow-hidden shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase mb-3">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>KÖZÖS TÖKFARAGÓ IDŐMÉRŐ</span>
        </div>

        <div className="text-6xl sm:text-8xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-orange-400 to-amber-600 tabular-nums drop-shadow-md">
          {formatTimer(remainingSecs)}
        </div>

        <div className="text-xs font-mono text-zinc-400 mt-2 uppercase tracking-widest">
          {pumpkinData.settings.hasTimeLimit
            ? `Hátralévő idő (Összesen: ${Math.floor(pumpkinData.settings.timeLimitSeconds / 60)} perc)`
            : 'Stopper időkorlát nélkül'}
        </div>

        {/* Timer Control Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {!pumpkinData.timerRunning ? (
            <button
              onClick={handleStartTimer}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold font-cinzel text-sm shadow-xl shadow-amber-950/60 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {pumpkinData.elapsedBeforePause > 0
                  ? 'VERSENY FOLYTATÁSA'
                  : 'VERSENY INDÍTÁSA (START)'}
              </span>
            </button>
          ) : (
            <button
              onClick={handlePauseTimer}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-black font-extrabold font-cinzel text-sm shadow-xl active:scale-95 transition-all cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>SZÜNETELTETÉS</span>
            </button>
          )}

          {/* Manual finish / evaluate */}
          <button
            onClick={handleManualStop}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition-colors cursor-pointer"
          >
            <span>🏁 Kézi lezárás / Értékelés</span>
          </button>

          {pumpkinData.elapsedBeforePause > 0 && !pumpkinData.timerRunning && (
            <button
              onClick={handleResetTimer}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Idő nullázása</span>
            </button>
          )}
        </div>
      </div>

      {/* The 4 Pairs Grid (Live Carving Status & Player roster) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold font-cinzel text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>A 4 Versenyző Tökfaragó Pár (2 A és 2 B pár)</span>
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            Mind a 4 pár egyszerre farag
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pumpkinData.pairs.map((pair) => {
            const isTeamA = pair.team === 'A';
            const teamInfo = isTeamA ? teamA : teamB;
            const p1 = playerMap.get(pair.playerIds[0]);
            const p2 = playerMap.get(pair.playerIds[1]);

            return (
              <div
                key={pair.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isTeamA
                    ? 'bg-gradient-to-b from-[#1a1124] to-[#120b1a] border-orange-500/30'
                    : 'bg-gradient-to-b from-[#161026] to-[#0e091b] border-purple-500/30'
                }`}
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span
                    className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
                      isTeamA ? 'text-orange-400' : 'text-purple-400'
                    }`}
                  >
                    {teamInfo.name} · {pair.pairNumber}. pár
                  </span>
                  <span className="text-xs">🎃</span>
                </div>

                <div className="my-3 space-y-1.5">
                  <div className="px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white text-xs font-semibold flex items-center justify-between">
                    <span>{p1 ? p1.name : '1. Játékos'}</span>
                    {!pumpkinData.timerRunning && !pumpkinData.evaluationFinalized && (
                      <button
                        onClick={() => handleSwapWithinTeam(pair.team, 0, 0)}
                        className="text-[10px] text-zinc-500 hover:text-amber-400 cursor-pointer"
                        title="Csere a másik párral a csapaton belül"
                      >
                        ⇄ Csere
                      </button>
                    )}
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white text-xs font-semibold flex items-center justify-between">
                    <span>{p2 ? p2.name : '2. Játékos'}</span>
                    {!pumpkinData.timerRunning && !pumpkinData.evaluationFinalized && (
                      <button
                        onClick={() => handleSwapWithinTeam(pair.team, 1, 1)}
                        className="text-[10px] text-zinc-500 hover:text-amber-400 cursor-pointer"
                        title="Csere a másik párral a csapaton belül"
                      >
                        ⇄ Csere
                      </button>
                    )}
                  </div>
                </div>

                {pumpkinData.evaluationFinalized && (
                  <div className="pt-2 border-t border-zinc-800 text-center">
                    <span className="text-xs font-bold text-amber-400">
                      {pair.rank}. helyezett · {pair.score} pont
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* JOINT EVALUATION BOARD (Értékelési Felület) */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1a1226] via-[#120c1c] to-[#0a0711] border-2 border-amber-500/50 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xl">
              ⚖️
            </div>
            <div>
              <h3 className="text-lg font-bold font-cinzel text-white">
                A Négy Tök Együttes Értékelése
              </h3>
              <p className="text-xs text-zinc-400">
                A játékmester a 4 elkészült tököt egymáshoz viszonyítva rangsorolja (1-4. hely vagy döntetlen).
              </p>
            </div>
          </div>

          {/* Live Team Sum Preview */}
          <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-2xl border border-zinc-800">
            <div>
              <span className="text-[10px] uppercase font-mono text-orange-400 block font-bold">
                {teamA.name}
              </span>
              <span className="text-lg font-black font-cinzel text-white">
                {teamASum} <span className="text-xs text-zinc-500">PONT</span>
              </span>
            </div>
            <div className="text-zinc-600 font-cinzel">VS</div>
            <div>
              <span className="text-[10px] uppercase font-mono text-purple-400 block font-bold">
                {teamB.name}
              </span>
              <span className="text-lg font-black font-cinzel text-white">
                {teamBSum} <span className="text-xs text-zinc-500">PONT</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Pairs Evaluation Table/Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pumpkinData.pairs.map((pair) => {
            const isTeamA = pair.team === 'A';
            const teamName = isTeamA ? teamA.name : teamB.name;
            const p1 = playerMap.get(pair.playerIds[0]);
            const p2 = playerMap.get(pair.playerIds[1]);
            const curRank = pairRanks[pair.id] ?? 1;
            const curScore = pairScores[pair.id] ?? 0;

            const medal =
              curRank === 1
                ? '🥇 1. Helyezett'
                : curRank === 2
                ? '🥈 2. Helyezett'
                : curRank === 3
                ? '🥉 3. Helyezett'
                : '🎃 4. Helyezett';

            return (
              <div
                key={pair.id}
                className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                  curRank === 1
                    ? 'border-amber-400 bg-amber-950/20 shadow-xl shadow-amber-950/30'
                    : isTeamA
                    ? 'border-orange-500/30 bg-zinc-900/60'
                    : 'border-purple-500/30 bg-zinc-900/60'
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] font-mono uppercase font-bold ${
                      isTeamA ? 'text-orange-400' : 'text-purple-400'
                    }`}
                  >
                    {teamName} · {pair.pairNumber}. pár
                  </span>
                  <div className="text-xs font-semibold text-zinc-200 mt-0.5 truncate">
                    {p1?.name} & {p2?.name}
                  </div>
                </div>

                {/* Rank Selector */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Helyezés / Rang
                  </label>
                  <select
                    value={curRank}
                    onChange={(e) => handleRankChange(pair.id, parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value={1}>🥇 1. helyezett (legszebb tök)</option>
                    <option value={2}>🥈 2. helyezett</option>
                    <option value={3}>🥉 3. helyezett</option>
                    <option value={4}>🎃 4. helyezett</option>
                  </select>
                </div>

                {/* Score Input */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Megítélt Pontszám
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={curScore}
                    onChange={(e) => handleScoreChange(pair.id, parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 text-amber-400 text-sm font-black font-mono text-center outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Action & Finalization */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-400 space-y-1">
            <p>
              • <strong>Csapatpontozás:</strong> {teamA.name} = {teamASum} pont ({pairScores[pairA1?.id || ''] || 0} + {pairScores[pairA2?.id || ''] || 0}),{' '}
              {teamB.name} = {teamBSum} pont ({pairScores[pairB1?.id || ''] || 0} + {pairScores[pairB2?.id || ''] || 0}).
            </p>
            <p>• A tökfaragás nem ad mesterséges egyéni pontokat a játékosoknak.</p>
          </div>

          <button
            onClick={handleFinalize}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold font-cinzel text-sm shadow-xl shadow-amber-950/60 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>ÉRTÉKELÉS JÓVÁHAGYÁSA ÉS MENTÉSE</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15101F] border border-amber-500/50 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold font-cinzel text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Tökfaragó Verseny Beállítások</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-zinc-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempSettings.hasTimeLimit}
                    onChange={(e) =>
                      setTempSettings((prev) => ({
                        ...prev,
                        hasTimeLimit: e.target.checked,
                      }))
                    }
                    className="rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Időkorlát bekapcsolása (alapértelmezett: 30 perc)</span>
                </label>
                {tempSettings.hasTimeLimit && (
                  <div className="mt-2 pl-6">
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Időkeret (másodperc)
                    </label>
                    <input
                      type="number"
                      min="60"
                      step="60"
                      value={tempSettings.timeLimitSeconds}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                          ...prev,
                          timeLimitSeconds: parseInt(e.target.value) || 1800,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm font-mono"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                      = {Math.floor(tempSettings.timeLimitSeconds / 60)} perc
                    </span>
                  </div>
                )}
              </div>

              {/* Rank Points */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                <span className="text-xs font-bold font-cinzel text-zinc-300 block">
                  Helyezések pontszámai
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-0.5">
                      🥇 1. hely pont
                    </label>
                    <input
                      type="number"
                      value={tempSettings.rankPoints[1]}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                          ...prev,
                          rankPoints: {
                            ...prev.rankPoints,
                            1: parseInt(e.target.value) || 100,
                          },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-0.5">
                      🥈 2. hely pont
                    </label>
                    <input
                      type="number"
                      value={tempSettings.rankPoints[2]}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                          ...prev,
                          rankPoints: {
                            ...prev.rankPoints,
                            2: parseInt(e.target.value) || 75,
                          },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-0.5">
                      🥉 3. hely pont
                    </label>
                    <input
                      type="number"
                      value={tempSettings.rankPoints[3]}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                          ...prev,
                          rankPoints: {
                            ...prev.rankPoints,
                            3: parseInt(e.target.value) || 50,
                          },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-0.5">
                      🎃 4. hely pont
                    </label>
                    <input
                      type="number"
                      value={tempSettings.rankPoints[4]}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                          ...prev,
                          rankPoints: {
                            ...prev.rankPoints,
                            4: parseInt(e.target.value) || 25,
                          },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Mégse
              </button>
              <button
                onClick={() => {
                  const updated: GameMatch = {
                    ...match,
                    pumpkinData: {
                      ...pumpkinData,
                      settings: tempSettings,
                    },
                  };
                  onUpdateMatchData(updated);
                  setShowSettingsModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-cinzel shadow-lg cursor-pointer"
              >
                Mentés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
