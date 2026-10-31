import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, X, Trophy, Users, Swords } from 'lucide-react';
import { GameItem, GameMatch, Player } from '../types/game';
import { TeamStats } from '../utils/calculations';

interface ProjectorViewProps {
  onClose: () => void;
  teamA: TeamStats;
  teamB: TeamStats;
  currentGame: GameItem | null;
  currentMatch: GameMatch | null;
  currentDuelIndex: number;
  currentTeamStage: 'TEAM_A' | 'TEAM_B' | 'SUMMARY' | null;
  players: Player[];
  timerSecondsSetting: number;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({
  onClose,
  teamA,
  teamB,
  currentGame,
  currentMatch,
  currentDuelIndex,
  currentTeamStage,
  players,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  const isTeamGame = currentGame?.gameType === 'TEAM';
  const activeDuel = !isTeamGame && currentMatch?.duels ? currentMatch.duels[currentDuelIndex] || null : null;
  const playerA = activeDuel ? playerMap.get(activeDuel.playerAId) : null;
  const playerB = activeDuel ? playerMap.get(activeDuel.playerBId) : null;

  const activeTeamStage = currentTeamStage || 'TEAM_A';

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#0B090D] flex flex-col justify-between p-6 md:p-12 text-white overflow-hidden select-none">
      {/* Top Bar: TV Broadcast Header */}
      <div className="flex items-center justify-between border-b border-orange-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-cinzel font-bold text-xl shadow-lg">
            🎃
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-orange-500 tracking-wider">
              HALLOWEEN · 1 PERC ÉS NYERSZ
            </span>
            <span className="text-xs font-mono uppercase text-zinc-400 block tracking-widest">
              ÉLŐ KÖZVETÍTÉS
            </span>
          </div>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Teljes képernyő"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            title="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Spectator Stage */}
      <div className="my-auto py-6 space-y-8">
        {/* Giant Team Scoreboard Row */}
        <div className="grid grid-cols-2 gap-8 md:gap-16 max-w-6xl mx-auto">
          {/* Team A Spectator Score */}
          <div
            className={`p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#1c1324] to-[#110c17] border-2 transition-all ${
              teamA.isLeader
                ? 'border-amber-500 shadow-2xl shadow-amber-950/60 ring-2 ring-amber-500/40'
                : 'border-orange-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs md:text-sm uppercase font-mono tracking-widest text-orange-400">
                  {teamA.code}
                </span>
                <h2 className="text-2xl md:text-4xl font-extrabold font-cinzel text-white truncate max-w-md">
                  {teamA.name}
                </h2>
              </div>
              {teamA.isLeader && (
                <div className="px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-bold uppercase font-cinzel flex items-center gap-1 shadow-md">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Vezet (+{teamA.pointDiff})</span>
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <div className="text-7xl md:text-9xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-orange-400 via-amber-200 to-orange-500 tabular-nums">
                {teamA.totalScore}
              </div>
              <span className="text-xs uppercase font-mono text-orange-400/80 tracking-widest -mt-2 block">
                PONT
              </span>
            </div>
          </div>

          {/* Team B Spectator Score */}
          <div
            className={`p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#1a1128] to-[#0e0918] border-2 transition-all ${
              teamB.isLeader
                ? 'border-purple-400 shadow-2xl shadow-purple-950/60 ring-2 ring-purple-400/40'
                : 'border-purple-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs md:text-sm uppercase font-mono tracking-widest text-purple-400">
                  {teamB.code}
                </span>
                <h2 className="text-2xl md:text-4xl font-extrabold font-cinzel text-white truncate max-w-md">
                  {teamB.name}
                </h2>
              </div>
              {teamB.isLeader && (
                <div className="px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-bold uppercase font-cinzel flex items-center gap-1 shadow-md">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Vezet (+{teamB.pointDiff})</span>
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <div className="text-7xl md:text-9xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-purple-300 via-indigo-200 to-purple-400 tabular-nums">
                {teamB.totalScore}
              </div>
              <span className="text-xs uppercase font-mono text-purple-400/80 tracking-widest -mt-2 block">
                PONT
              </span>
            </div>
          </div>
        </div>

        {/* Active Game Stage Details */}
        {currentGame ? (
          <div className="max-w-4xl mx-auto rounded-3xl p-8 bg-[#140f1f]/90 border border-orange-500/40 shadow-2xl text-center">
            {/* Game Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-orange-950/60 border border-orange-500/40 text-orange-400 text-xs font-mono uppercase tracking-widest mb-3">
              <span>{currentGame.name}</span>
              <span>·</span>
              <span>
                {isTeamGame
                  ? activeTeamStage === 'TEAM_A'
                    ? '1. FORDULÓ · A CSAPAT TELJESÍT'
                    : '2. FORDULÓ · B CSAPAT TELJESÍT'
                  : `${currentDuelIndex + 1}. PÁRBAJ A 4-BŐL`}
              </span>
            </div>

            {/* If TELJES CSAPATOS: Show 4 members of the active team */}
            {currentGame.gameType === 'TEAM' && (
              <div className="my-4">
                <span className="text-xs font-mono uppercase tracking-wider text-purple-400 block mb-2">
                  Aktív Csapat Versenyzői:
                </span>
                <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
                  {(activeTeamStage === 'TEAM_A' ? teamA.players : teamB.players).map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center"
                    >
                      <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center font-cinzel font-bold text-lg mb-2">
                        {idx + 1}
                      </div>
                      <span className="text-base font-bold text-white block truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If PUZZLE-VERSENY: Show both teams stopwatches side by side */}
            {currentGame.gameType === 'PUZZLE' && (
              <div className="my-4">
                <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* Team A Puzzle Status */}
                  <div className="p-6 rounded-2xl bg-zinc-900/90 border-2 border-orange-500/40 text-center">
                    <span className="text-xs font-mono uppercase tracking-widest text-orange-400 block mb-1">
                      {teamA.name}
                    </span>
                    <div className="text-5xl md:text-6xl font-black font-mono text-white tabular-nums my-2">
                      {currentMatch?.puzzleData?.teamAFinished
                        ? `${Math.floor((currentMatch.puzzleData.teamAElapsedSeconds ?? 0) / 60)
                            .toString()
                            .padStart(2, '0')}:${Math.floor(
                            (currentMatch.puzzleData.teamAElapsedSeconds ?? 0) % 60
                          )
                            .toString()
                            .padStart(2, '0')}.${Math.floor(
                            ((currentMatch.puzzleData.teamAElapsedSeconds ?? 0) * 10) % 10
                          )}`
                        : currentMatch?.puzzleData?.timerRunning
                        ? 'FUT...'
                        : '00:00.0'}
                    </div>
                    <div className="text-xs font-mono font-bold">
                      {currentMatch?.puzzleData?.teamAFinished ? (
                        <span className="text-emerald-400">✓ KÉSZ</span>
                      ) : currentMatch?.puzzleData?.timerRunning ? (
                        <span className="text-orange-400 animate-pulse">⏳ VERSENYBEN</span>
                      ) : (
                        <span className="text-zinc-500">VÁRAKOZIK</span>
                      )}
                    </div>
                  </div>

                  {/* Team B Puzzle Status */}
                  <div className="p-6 rounded-2xl bg-zinc-900/90 border-2 border-purple-500/40 text-center">
                    <span className="text-xs font-mono uppercase tracking-widest text-purple-400 block mb-1">
                      {teamB.name}
                    </span>
                    <div className="text-5xl md:text-6xl font-black font-mono text-white tabular-nums my-2">
                      {currentMatch?.puzzleData?.teamBFinished
                        ? `${Math.floor((currentMatch.puzzleData.teamBElapsedSeconds ?? 0) / 60)
                            .toString()
                            .padStart(2, '0')}:${Math.floor(
                            (currentMatch.puzzleData.teamBElapsedSeconds ?? 0) % 60
                          )
                            .toString()
                            .padStart(2, '0')}.${Math.floor(
                            ((currentMatch.puzzleData.teamBElapsedSeconds ?? 0) * 10) % 10
                          )}`
                        : currentMatch?.puzzleData?.timerRunning
                        ? 'FUT...'
                        : '00:00.0'}
                    </div>
                    <div className="text-xs font-mono font-bold">
                      {currentMatch?.puzzleData?.teamBFinished ? (
                        <span className="text-emerald-400">✓ KÉSZ</span>
                      ) : currentMatch?.puzzleData?.timerRunning ? (
                        <span className="text-purple-400 animate-pulse">⏳ VERSENYBEN</span>
                      ) : (
                        <span className="text-zinc-500">VÁRAKOZIK</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* If TÖKFARAGÓ VERSENY: Show all 4 pairs */}
            {currentGame.gameType === 'PUMPKIN' && (
              <div className="my-4">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 block mb-3">
                  🎃 4 Faragó Pár Egyidejű Küzdelme:
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {currentMatch?.pumpkinData?.pairs.map((pair) => {
                    const isTeamA = pair.team === 'A';
                    const p1 = playerMap.get(pair.playerIds[0]);
                    const p2 = playerMap.get(pair.playerIds[1]);
                    return (
                      <div
                        key={pair.id}
                        className={`p-4 rounded-2xl border ${
                          isTeamA
                            ? 'bg-orange-950/30 border-orange-500/40'
                            : 'bg-purple-950/30 border-purple-500/40'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-mono uppercase font-bold block ${
                            isTeamA ? 'text-orange-400' : 'text-purple-400'
                          }`}
                        >
                          {isTeamA ? teamA.name : teamB.name} · {pair.pairNumber}. pár
                        </span>
                        <div className="text-sm font-bold text-white mt-1">
                          {p1?.name} & {p2?.name}
                        </div>
                        {pair.rank && (
                          <div className="text-xs font-bold text-amber-400 mt-2">
                            {pair.rank}. hely · {pair.score} pont
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If EGYÉNI PÁRBAJ: Show Duelists */}
            {currentGame.gameType === 'DUEL' && activeDuel && (
              <div className="flex items-center justify-center gap-8 md:gap-16 my-4">
                <div className="text-right">
                  <span className="text-xs font-mono uppercase text-orange-400 block">{teamA.name}</span>
                  <span className="text-3xl md:text-5xl font-extrabold font-cinzel text-white block">
                    {playerA?.name || 'A Játékos'}
                  </span>
                </div>

                <div className="text-2xl md:text-3xl font-black font-cinzel text-amber-400 px-4 py-2 rounded-2xl bg-zinc-900 border border-amber-500/30">
                  VS
                </div>

                <div className="text-left">
                  <span className="text-xs font-mono uppercase text-purple-400 block">{teamB.name}</span>
                  <span className="text-3xl md:text-5xl font-extrabold font-cinzel text-white block">
                    {playerB?.name || 'B Játékos'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500 text-lg font-cinzel">
            Várakozás a következő játék kisorsolására...
          </div>
        )}
      </div>

      {/* Footer Banner */}
      <div className="text-center text-xs font-mono text-zinc-600 border-t border-zinc-900 pt-4">
        Halloween Minute to Win It · The Ultimate Challenge
      </div>
    </div>
  );
};
