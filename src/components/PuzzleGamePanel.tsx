import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Trophy,
  CheckCircle2,
  Clock,
  Settings,
} from 'lucide-react';
import { GameItem, GameMatch, Player, PuzzleSettings } from '../types/game';
import { TeamStats } from '../utils/calculations';
import { soundEngine } from '../utils/sound';

interface PuzzleGamePanelProps {
  game: GameItem;
  match: GameMatch;
  players: Player[];
  teamA: TeamStats;
  teamB: TeamStats;
  onUpdateMatchData: (updatedMatch: GameMatch) => void;
  onFinalizePuzzle: (
    scoreA: number,
    scoreB: number,
    winnerTeam: 'A' | 'B' | 'DRAW',
    timeA: number,
    timeB: number
  ) => void;
}

export const PuzzleGamePanel: React.FC<PuzzleGamePanelProps> = ({
  game,
  match,
  teamA,
  teamB,
  onUpdateMatchData,
  onFinalizePuzzle,
}) => {
  const puzzleData = match.puzzleData || {
    settings: game.puzzleSettings || {
      hasTimeLimit: false,
      timeLimitSeconds: 300,
      winPoints: 100,
      losePoints: 25,
      drawPoints: 50,
    },
    timerRunning: false,
    startTime: null,
    elapsedBeforePause: 0,
    isPaused: false,
    teamAFinished: false,
    teamAElapsedSeconds: null,
    teamBFinished: false,
    teamBElapsedSeconds: null,
    scoreA: 0,
    scoreB: 0,
    winnerTeam: null,
    evaluationFinalized: false,
  };

  const [liveElapsedSecs, setLiveElapsedSecs] = useState<number>(0);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [tempSettings, setTempSettings] = useState<PuzzleSettings>(puzzleData.settings);

  // Manual evaluation adjustments
  const [adjustedTimeA, setAdjustedTimeA] = useState<number>(
    puzzleData.teamAElapsedSeconds ?? 0
  );
  const [adjustedTimeB, setAdjustedTimeB] = useState<number>(
    puzzleData.teamBElapsedSeconds ?? 0
  );
  const [customScoreA, setCustomScoreA] = useState<number>(puzzleData.scoreA);
  const [customScoreB, setCustomScoreB] = useState<number>(puzzleData.scoreB);

  // Continuous animation frame loop for smooth stopwatches
  useEffect(() => {
    let animId: number;

    const updateTimer = () => {
      if (puzzleData.timerRunning && puzzleData.startTime && !puzzleData.isPaused) {
        const now = Date.now();
        const currentElapsed =
          puzzleData.elapsedBeforePause + (now - puzzleData.startTime) / 1000;
        setLiveElapsedSecs(currentElapsed);

        // Check optional max time limit
        if (
          puzzleData.settings.hasTimeLimit &&
          puzzleData.settings.timeLimitSeconds > 0 &&
          currentElapsed >= puzzleData.settings.timeLimitSeconds
        ) {
          // Time limit reached! Stop both unfinished teams
          handleTimeLimitReached(puzzleData.settings.timeLimitSeconds);
          return;
        }
      } else {
        setLiveElapsedSecs(puzzleData.elapsedBeforePause);
      }
      animId = requestAnimationFrame(updateTimer);
    };

    animId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(animId);
  }, [
    puzzleData.timerRunning,
    puzzleData.startTime,
    puzzleData.isPaused,
    puzzleData.elapsedBeforePause,
    puzzleData.settings,
  ]);

  // Sync evaluation inputs when both teams finish
  useEffect(() => {
    if (puzzleData.teamAFinished && puzzleData.teamAElapsedSeconds !== null) {
      setAdjustedTimeA(puzzleData.teamAElapsedSeconds);
    }
    if (puzzleData.teamBFinished && puzzleData.teamBElapsedSeconds !== null) {
      setAdjustedTimeB(puzzleData.teamBElapsedSeconds);
    }
  }, [
    puzzleData.teamAFinished,
    puzzleData.teamBFinished,
    puzzleData.teamAElapsedSeconds,
    puzzleData.teamBElapsedSeconds,
  ]);

  // Auto calculate scores whenever adjusted times change in evaluation
  useEffect(() => {
    if (puzzleData.teamAFinished && puzzleData.teamBFinished) {
      const timeA = adjustedTimeA;
      const timeB = adjustedTimeB;
      const { winPoints, losePoints, drawPoints } = puzzleData.settings;

      if (timeA < timeB) {
        setCustomScoreA(winPoints);
        setCustomScoreB(losePoints);
      } else if (timeB < timeA) {
        setCustomScoreA(losePoints);
        setCustomScoreB(winPoints);
      } else {
        setCustomScoreA(drawPoints);
        setCustomScoreB(drawPoints);
      }
    }
  }, [adjustedTimeA, adjustedTimeB, puzzleData.teamAFinished, puzzleData.teamBFinished, puzzleData.settings]);

  // Format seconds to mm:ss.s
  const formatTime = (secs: number | null | undefined): string => {
    if (secs === null || secs === undefined) return '--:--.-';
    const totalTenths = Math.max(0, Math.floor(secs * 10));
    const tenths = totalTenths % 10;
    const totalSecs = Math.floor(totalTenths / 10);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${tenths}`;
  };

  // 1. Joint START
  const handleStartBoth = () => {
    soundEngine.playMysticStart();
    const now = Date.now();
    const updated: GameMatch = {
      ...match,
      completed: false,
      puzzleData: {
        ...puzzleData,
        timerRunning: true,
        startTime: now,
        isPaused: false,
        evaluationFinalized: false,
      },
    };
    onUpdateMatchData(updated);
  };

  // 2. Individual STOP Team A
  const handleStopTeamA = () => {
    const elapsedNow = puzzleData.startTime
      ? puzzleData.elapsedBeforePause + (Date.now() - puzzleData.startTime) / 1000
      : liveElapsedSecs;
    const recordedSecs = Math.round(elapsedNow * 10) / 10;

    soundEngine.playTick();

    const bothWillBeFinished = puzzleData.teamBFinished;
    const updated: GameMatch = {
      ...match,
      puzzleData: {
        ...puzzleData,
        teamAFinished: true,
        teamAElapsedSeconds: recordedSecs,
        timerRunning: !bothWillBeFinished,
        isPaused: bothWillBeFinished,
      },
    };
    onUpdateMatchData(updated);
  };

  // 3. Individual STOP Team B
  const handleStopTeamB = () => {
    const elapsedNow = puzzleData.startTime
      ? puzzleData.elapsedBeforePause + (Date.now() - puzzleData.startTime) / 1000
      : liveElapsedSecs;
    const recordedSecs = Math.round(elapsedNow * 10) / 10;

    soundEngine.playTick();

    const bothWillBeFinished = puzzleData.teamAFinished;
    const updated: GameMatch = {
      ...match,
      puzzleData: {
        ...puzzleData,
        teamBFinished: true,
        teamBElapsedSeconds: recordedSecs,
        timerRunning: !bothWillBeFinished,
        isPaused: bothWillBeFinished,
      },
    };
    onUpdateMatchData(updated);
  };

  // Time limit reached
  const handleTimeLimitReached = (maxSecs: number) => {
    soundEngine.playTimesUpGong();
    const updated: GameMatch = {
      ...match,
      puzzleData: {
        ...puzzleData,
        timerRunning: false,
        isPaused: true,
        teamAFinished: true,
        teamAElapsedSeconds: puzzleData.teamAFinished
          ? puzzleData.teamAElapsedSeconds
          : maxSecs,
        teamBFinished: true,
        teamBElapsedSeconds: puzzleData.teamBFinished
          ? puzzleData.teamBElapsedSeconds
          : maxSecs,
      },
    };
    onUpdateMatchData(updated);
  };

  // Reset stopwatches
  const handleResetStopwatches = () => {
    const updated: GameMatch = {
      ...match,
      completed: false,
      puzzleData: {
        ...puzzleData,
        timerRunning: false,
        startTime: null,
        elapsedBeforePause: 0,
        isPaused: false,
        teamAFinished: false,
        teamAElapsedSeconds: null,
        teamBFinished: false,
        teamBElapsedSeconds: null,
        evaluationFinalized: false,
      },
    };
    setLiveElapsedSecs(0);
    onUpdateMatchData(updated);
  };

  // Save Settings
  const handleSaveSettings = () => {
    const updated: GameMatch = {
      ...match,
      puzzleData: {
        ...puzzleData,
        settings: tempSettings,
      },
    };
    onUpdateMatchData(updated);
    setShowSettingsModal(false);
  };

  // Finalize & Save
  const handleFinalizeEvaluation = () => {
    const timeA = adjustedTimeA;
    const timeB = adjustedTimeB;
    let winner: 'A' | 'B' | 'DRAW' = 'DRAW';
    if (timeA < timeB) winner = 'A';
    else if (timeB < timeA) winner = 'B';

    soundEngine.playTimesUpGong();
    onFinalizePuzzle(customScoreA, customScoreB, winner, timeA, timeB);
  };

  const bothFinished = puzzleData.teamAFinished && puzzleData.teamBFinished;
  const isStarted = puzzleData.startTime !== null || puzzleData.elapsedBeforePause > 0;

  // Displayed elapsed for Team A
  const teamADisplaySecs = puzzleData.teamAFinished
    ? puzzleData.teamAElapsedSeconds
    : puzzleData.timerRunning
    ? liveElapsedSecs
    : puzzleData.elapsedBeforePause;

  // Displayed elapsed for Team B
  const teamBDisplaySecs = puzzleData.teamBFinished
    ? puzzleData.teamBElapsedSeconds
    : puzzleData.timerRunning
    ? liveElapsedSecs
    : puzzleData.elapsedBeforePause;

  return (
    <div className="space-y-6">
      {/* Header Info & Settings Bar */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-indigo-950/40 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-inner">
            🧩
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono uppercase font-bold tracking-wider">
                Párhuzamos Csapatverseny
              </span>
              {puzzleData.evaluationFinalized && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  ✓ Lezárva
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold font-cinzel text-white mt-0.5">
              {game.name}
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              Mindkét csapat (4-4 fő) egyszerre rakja a puzzle-t. Közös indítás, csapatonként független STOP gomb. A gyorsabb csapat nyer!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTempSettings(puzzleData.settings);
              setShowSettingsModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>Beállítások</span>
          </button>
        </div>
      </div>

      {/* Main Stopwatches Stage (Dual Team Arena) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TEAM A ARENA */}
        <div
          className={`p-6 rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
            puzzleData.teamAFinished
              ? 'bg-zinc-900/90 border-emerald-500/60 shadow-xl shadow-emerald-950/20'
              : puzzleData.timerRunning
              ? 'bg-gradient-to-b from-[#181124] to-[#0e0918] border-orange-500 ring-2 ring-orange-500/30 shadow-2xl'
              : 'bg-zinc-900/60 border-zinc-800'
          }`}
        >
          {/* Team A Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-orange-400">
                A CSAPAT
              </span>
              <h3 className="text-2xl font-bold font-cinzel text-white truncate max-w-xs">
                {teamA.name}
              </h3>
            </div>
            {puzzleData.teamAFinished ? (
              <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>KÉSZ</span>
              </div>
            ) : puzzleData.timerRunning ? (
              <div className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-bold font-mono animate-pulse">
                VERSENYBEN...
              </div>
            ) : (
              <span className="text-xs text-zinc-500 font-mono">Várakozik</span>
            )}
          </div>

          {/* Team A 4 Players */}
          <div className="flex flex-wrap gap-1.5 my-4">
            {teamA.players.map((p) => (
              <span
                key={p.id}
                className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs"
              >
                {p.name}
              </span>
            ))}
          </div>

          {/* Team A Big Stopwatch Display */}
          <div className="my-4 text-center py-6 rounded-2xl bg-black/40 border border-zinc-800/80">
            <span className="text-xs font-mono uppercase text-zinc-500 block mb-1">
              Időeredmény
            </span>
            <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white tabular-nums">
              {formatTime(teamADisplaySecs)}
            </div>
          </div>

          {/* Team A Independent STOP Button */}
          <div>
            {!puzzleData.teamAFinished ? (
              <button
                onClick={handleStopTeamA}
                disabled={!puzzleData.timerRunning}
                className={`w-full py-4 rounded-2xl font-extrabold text-base font-cinzel flex items-center justify-center gap-2 transition-all shadow-lg ${
                  puzzleData.timerRunning
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-950/60 active:scale-95 cursor-pointer ring-2 ring-red-500/50'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
              >
                <Square className="w-5 h-5 fill-current" />
                <span>{teamA.name} KÉSZ! (STOP A)</span>
              </button>
            ) : (
              <div className="p-3 text-center rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                ✓ Idő rögzítve: {formatTime(puzzleData.teamAElapsedSeconds)}
              </div>
            )}
          </div>
        </div>

        {/* TEAM B ARENA */}
        <div
          className={`p-6 rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
            puzzleData.teamBFinished
              ? 'bg-zinc-900/90 border-emerald-500/60 shadow-xl shadow-emerald-950/20'
              : puzzleData.timerRunning
              ? 'bg-gradient-to-b from-[#181124] to-[#0e0918] border-purple-500 ring-2 ring-purple-500/30 shadow-2xl'
              : 'bg-zinc-900/60 border-zinc-800'
          }`}
        >
          {/* Team B Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-purple-400">
                B CSAPAT
              </span>
              <h3 className="text-2xl font-bold font-cinzel text-white truncate max-w-xs">
                {teamB.name}
              </h3>
            </div>
            {puzzleData.teamBFinished ? (
              <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>KÉSZ</span>
              </div>
            ) : puzzleData.timerRunning ? (
              <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40 text-xs font-bold font-mono animate-pulse">
                VERSENYBEN...
              </div>
            ) : (
              <span className="text-xs text-zinc-500 font-mono">Várakozik</span>
            )}
          </div>

          {/* Team B 4 Players */}
          <div className="flex flex-wrap gap-1.5 my-4">
            {teamB.players.map((p) => (
              <span
                key={p.id}
                className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs"
              >
                {p.name}
              </span>
            ))}
          </div>

          {/* Team B Big Stopwatch Display */}
          <div className="my-4 text-center py-6 rounded-2xl bg-black/40 border border-zinc-800/80">
            <span className="text-xs font-mono uppercase text-zinc-500 block mb-1">
              Időeredmény
            </span>
            <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white tabular-nums">
              {formatTime(teamBDisplaySecs)}
            </div>
          </div>

          {/* Team B Independent STOP Button */}
          <div>
            {!puzzleData.teamBFinished ? (
              <button
                onClick={handleStopTeamB}
                disabled={!puzzleData.timerRunning}
                className={`w-full py-4 rounded-2xl font-extrabold text-base font-cinzel flex items-center justify-center gap-2 transition-all shadow-lg ${
                  puzzleData.timerRunning
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-950/60 active:scale-95 cursor-pointer ring-2 ring-red-500/50'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
              >
                <Square className="w-5 h-5 fill-current" />
                <span>{teamB.name} KÉSZ! (STOP B)</span>
              </button>
            ) : (
              <div className="p-3 text-center rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                ✓ Idő rögzítve: {formatTime(puzzleData.teamBElapsedSeconds)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Central Control Bar (START & RESET) */}
      <div className="p-5 rounded-2xl bg-[#15101F] border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {!puzzleData.timerRunning && !bothFinished && (
            <button
              onClick={handleStartBoth}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold font-cinzel text-base shadow-xl shadow-emerald-950/60 transition-all active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{isStarted ? 'STOPPER FOLYTATÁSA' : 'KÖZÖS START INDÍTÁSA'}</span>
            </button>
          )}

          {isStarted && (
            <button
              onClick={handleResetStopwatches}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Stopperek nullázása</span>
            </button>
          )}

          {puzzleData.settings.hasTimeLimit && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Max időkorlát: {formatTime(puzzleData.settings.timeLimitSeconds)}</span>
            </div>
          )}
        </div>

        <div className="text-xs text-zinc-400 font-mono">
          {!bothFinished && puzzleData.timerRunning && (
            <span className="text-cyan-400 animate-pulse">
              ⏳ A stopper pörög mindkét csapatnak...
            </span>
          )}
          {bothFinished && (
            <span className="text-emerald-400 font-bold">
              ✓ Mindkét csapat befejezte a puzzle-t!
            </span>
          )}
        </div>
      </div>

      {/* EVALUATION & SCORING PANEL (When both finished or manual edit) */}
      {(bothFinished || puzzleData.evaluationFinalized) && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1a1325] via-[#140e1f] to-[#0c0814] border-2 border-cyan-500/50 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-xl">
                🏆
              </div>
              <div>
                <h3 className="text-lg font-bold font-cinzel text-white">
                  Puzzle-verseny Értékelése és Eredményei
                </h3>
                <p className="text-xs text-zinc-400">
                  A rendszer automatikusan összehasonlította az időket. Szükség esetén kézzel módosíthatod az időket és a pontokat.
                </p>
              </div>
            </div>

            {adjustedTimeA < adjustedTimeB ? (
              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold font-cinzel text-xs flex items-center gap-1.5 shadow-lg">
                <Trophy className="w-4 h-4" />
                <span>Győztes: {teamA.name}! (-{formatTime(adjustedTimeB - adjustedTimeA)})</span>
              </div>
            ) : adjustedTimeB < adjustedTimeA ? (
              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-extrabold font-cinzel text-xs flex items-center gap-1.5 shadow-lg">
                <Trophy className="w-4 h-4" />
                <span>Győztes: {teamB.name}! (-{formatTime(adjustedTimeA - adjustedTimeB)})</span>
              </div>
            ) : (
              <div className="px-4 py-1.5 rounded-full bg-zinc-700 text-white font-extrabold font-cinzel text-xs flex items-center gap-1.5">
                <span>Döntetlen időeredmény!</span>
              </div>
            )}
          </div>

          {/* Time & Points inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team A Adjustments */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-orange-500/30 space-y-3">
              <span className="text-xs font-mono uppercase text-orange-400 block font-bold">
                {teamA.name} eredménye
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Rögzített idő (mp)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={adjustedTimeA}
                    onChange={(e) => setAdjustedTimeA(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 text-white text-sm font-mono outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                    Formátum: {formatTime(adjustedTimeA)}
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Csapatpontszám
                  </label>
                  <input
                    type="number"
                    value={customScoreA}
                    onChange={(e) => setCustomScoreA(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 text-white text-sm font-mono font-bold text-center outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Team B Adjustments */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-purple-500/30 space-y-3">
              <span className="text-xs font-mono uppercase text-purple-400 block font-bold">
                {teamB.name} eredménye
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Rögzített idő (mp)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={adjustedTimeB}
                    onChange={(e) => setAdjustedTimeB(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 text-white text-sm font-mono outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                    Formátum: {formatTime(adjustedTimeB)}
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Csapatpontszám
                  </label>
                  <input
                    type="number"
                    value={customScoreB}
                    onChange={(e) => setCustomScoreB(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 text-white text-sm font-mono font-bold text-center outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-zinc-400">
              * A pontok közvetlenül a csapat összeredményéhez adódnak hozzá, mesterséges egyéni pontok nélkül.
            </p>

            <button
              onClick={handleFinalizeEvaluation}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold font-cinzel text-sm shadow-xl shadow-cyan-950/60 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>EREDMÉNYEK VÉGLEGESÍTÉSE ÉS MENTÉSE</span>
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15101F] border border-cyan-500/50 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold font-cinzel text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>Puzzle-verseny Beállítások</span>
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
                    className="rounded bg-zinc-900 border-zinc-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>Maximális játékidő (időkorlát) bekapcsolása</span>
                </label>
                {tempSettings.hasTimeLimit && (
                  <div className="mt-2 pl-6">
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Időkorlát (másodperc)
                    </label>
                    <input
                      type="number"
                      min="30"
                      step="10"
                      value={tempSettings.timeLimitSeconds}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                          ...prev,
                          timeLimitSeconds: parseInt(e.target.value) || 300,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm font-mono"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                      = {Math.floor(tempSettings.timeLimitSeconds / 60)} perc{' '}
                      {tempSettings.timeLimitSeconds % 60} mp
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Győzelmi pont
                  </label>
                  <input
                    type="number"
                    value={tempSettings.winPoints}
                    onChange={(e) =>
                      setTempSettings((prev) => ({
                        ...prev,
                        winPoints: parseInt(e.target.value) || 100,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Vesztes pont
                  </label>
                  <input
                    type="number"
                    value={tempSettings.losePoints}
                    onChange={(e) =>
                      setTempSettings((prev) => ({
                        ...prev,
                        losePoints: parseInt(e.target.value) || 25,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Döntetlen pont
                  </label>
                  <input
                    type="number"
                    value={tempSettings.drawPoints}
                    onChange={(e) =>
                      setTempSettings((prev) => ({
                        ...prev,
                        drawPoints: parseInt(e.target.value) || 50,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-mono text-center"
                  />
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
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-cinzel shadow-lg cursor-pointer"
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
