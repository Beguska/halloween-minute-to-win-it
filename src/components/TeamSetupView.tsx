import React, { useState } from 'react';
import {
  Shuffle,
  Users,
  Shield,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ArrowLeftRight,
} from 'lucide-react';
import { Player } from '../types/game';
import { generateTeamName } from '../utils/calculations';

interface TeamSetupViewProps {
  players: Player[];
  teamANameCustom: string | null;
  teamBNameCustom: string | null;
  onUpdatePlayers: (players: Player[]) => void;
  onUpdateTeamNames: (nameA: string | null, nameB: string | null) => void;
  onConfirmAndStartGame: () => void;
  onBackToSetup: () => void;
}

export const TeamSetupView: React.FC<TeamSetupViewProps> = ({
  players,
  teamANameCustom,
  teamBNameCustom,
  onUpdatePlayers,
  onUpdateTeamNames,
  onConfirmAndStartGame,
  onBackToSetup,
}) => {
  const [isShuffling, setIsShuffling] = useState(false);
  const [editingNameA, setEditingNameA] = useState(false);
  const [editingNameB, setEditingNameB] = useState(false);

  const teamAPlayers = players.filter((p) => p.team === 'A');
  const teamBPlayers = players.filter((p) => p.team === 'B');
  const unassignedPlayers = players.filter((p) => p.team !== 'A' && p.team !== 'B');

  const defaultNameA = generateTeamName(teamAPlayers);
  const defaultNameB = generateTeamName(teamBPlayers);

  const currentNameA = teamANameCustom || defaultNameA;
  const currentNameB = teamBNameCustom || defaultNameB;

  // Random team generation
  const handleRandomShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const shuffled = [...players];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const updated = shuffled.map((player, idx) => ({
        ...player,
        team: (idx < 4 ? 'A' : 'B') as 'A' | 'B',
      }));

      onUpdatePlayers(updated);
      setIsShuffling(false);
    }, 450);
  };

  // Move single player
  const handleMovePlayer = (playerId: string, targetTeam: 'A' | 'B' | null) => {
    const updated = players.map((p) => {
      if (p.id === playerId) {
        return { ...p, team: targetTeam };
      }
      return p;
    });
    onUpdatePlayers(updated);
  };

  // Swap two players
  const handleQuickSwap = (pAId: string, pBId: string) => {
    const updated = players.map((p) => {
      if (p.id === pAId) return { ...p, team: 'B' as const };
      if (p.id === pBId) return { ...p, team: 'A' as const };
      return p;
    });
    onUpdatePlayers(updated);
  };

  const isReady = teamAPlayers.length === 4 && teamBPlayers.length === 4;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBackToSetup}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Vissza az előkészítéshez</span>
        </button>

        <button
          onClick={handleRandomShuffle}
          disabled={isShuffling}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-600 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-950/40 border border-purple-500/30 transition-all active:scale-95"
        >
          <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
          <span>🎲 RANDOM CSAPATGENERÁLÁS</span>
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-orange-500">
          CSAPATOK KIALAKÍTÁSA
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-xl mx-auto">
          Oszd szét a 8 felnőtt játékost két darab 4 fős csapatba. A csapatnevek automatikusan a tagok
          kezdőbetűiből képződnek, de tetszés szerint át is nevezhetők.
        </p>
      </div>

      {/* Unassigned Warning if any */}
      {unassignedPlayers.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Besorolatlan játékosok ({unassignedPlayers.length}):
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassignedPlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm"
              >
                <span>{p.name}</span>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleMovePlayer(p.id, 'A')}
                    disabled={teamAPlayers.length >= 4}
                    className="px-2 py-0.5 text-xs bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded font-bold"
                  >
                    + A
                  </button>
                  <button
                    onClick={() => handleMovePlayer(p.id, 'B')}
                    disabled={teamBPlayers.length >= 4}
                    className="px-2 py-0.5 text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded font-bold"
                  >
                    + B
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* TEAM A CARD */}
        <div
          className={`rounded-2xl p-6 bg-[#15101A] border transition-all duration-300 shadow-2xl relative ${
            teamAPlayers.length === 4
              ? 'border-orange-500/50 shadow-orange-950/30'
              : 'border-zinc-800'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-orange-500/20 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-cinzel font-bold text-lg">
                A
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-orange-400 block">
                  1. CSAPAT
                </span>
                {editingNameA ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      defaultValue={currentNameA}
                      onBlur={(e) => {
                        onUpdateTeamNames(e.target.value.trim() || null, teamBNameCustom);
                        setEditingNameA(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateTeamNames(e.currentTarget.value.trim() || null, teamBNameCustom);
                          setEditingNameA(false);
                        }
                      }}
                      autoFocus
                      className="px-2 py-1 rounded bg-zinc-900 border border-orange-500 text-white font-bold text-sm outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2
                      onClick={() => setEditingNameA(true)}
                      className="text-lg md:text-xl font-bold font-cinzel text-white cursor-pointer hover:text-orange-300 transition-colors"
                      title="Kattints az átnevezéshez"
                    >
                      {currentNameA}
                    </h2>
                    {teamANameCustom && (
                      <button
                        onClick={() => onUpdateTeamNames(null, teamBNameCustom)}
                        title="Visszaállítás a kezdőbetűs generált névre"
                        className="text-zinc-500 hover:text-orange-400"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full border ${
                teamAPlayers.length === 4
                  ? 'bg-orange-950/40 border-orange-500/40 text-orange-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {teamAPlayers.length} / 4 játékos
            </div>
          </div>

          {/* Player Slots */}
          <div className="space-y-3">
            {[0, 1, 2, 3].map((slotIndex) => {
              const player = teamAPlayers[slotIndex];
              return (
                <div
                  key={player ? player.id : `empty_a_${slotIndex}`}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    player
                      ? 'bg-zinc-900/80 border-orange-500/20 text-white'
                      : 'bg-zinc-950/40 border-dashed border-zinc-800 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-orange-950/60 border border-orange-700/40 text-orange-400 font-mono text-xs font-bold flex items-center justify-center">
                      {slotIndex + 1}
                    </span>
                    <span className="text-sm font-medium">
                      {player ? player.name : 'Üres hely...'}
                    </span>
                  </div>

                  {player && (
                    <button
                      onClick={() => handleMovePlayer(player.id, 'B')}
                      disabled={teamBPlayers.length >= 4}
                      title="Átmozgatás a B csapatba"
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-purple-900/40 hover:text-purple-300 text-zinc-400 text-xs font-medium transition-colors disabled:opacity-30"
                    >
                      <span>B csapatba</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TEAM B CARD */}
        <div
          className={`rounded-2xl p-6 bg-[#130E1C] border transition-all duration-300 shadow-2xl relative ${
            teamBPlayers.length === 4
              ? 'border-purple-500/50 shadow-purple-950/30'
              : 'border-zinc-800'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-purple-500/20 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-cinzel font-bold text-lg">
                B
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400 block">
                  2. CSAPAT
                </span>
                {editingNameB ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      defaultValue={currentNameB}
                      onBlur={(e) => {
                        onUpdateTeamNames(teamANameCustom, e.target.value.trim() || null);
                        setEditingNameB(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateTeamNames(teamANameCustom, e.currentTarget.value.trim() || null);
                          setEditingNameB(false);
                        }
                      }}
                      autoFocus
                      className="px-2 py-1 rounded bg-zinc-900 border border-purple-500 text-white font-bold text-sm outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2
                      onClick={() => setEditingNameB(true)}
                      className="text-lg md:text-xl font-bold font-cinzel text-white cursor-pointer hover:text-purple-300 transition-colors"
                      title="Kattints az átnevezéshez"
                    >
                      {currentNameB}
                    </h2>
                    {teamBNameCustom && (
                      <button
                        onClick={() => onUpdateTeamNames(teamANameCustom, null)}
                        title="Visszaállítás a kezdőbetűs generált névre"
                        className="text-zinc-500 hover:text-purple-400"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full border ${
                teamBPlayers.length === 4
                  ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {teamBPlayers.length} / 4 játékos
            </div>
          </div>

          {/* Player Slots */}
          <div className="space-y-3">
            {[0, 1, 2, 3].map((slotIndex) => {
              const player = teamBPlayers[slotIndex];
              return (
                <div
                  key={player ? player.id : `empty_b_${slotIndex}`}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    player
                      ? 'bg-zinc-900/80 border-purple-500/20 text-white'
                      : 'bg-zinc-950/40 border-dashed border-zinc-800 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-700/40 text-purple-400 font-mono text-xs font-bold flex items-center justify-center">
                      {slotIndex + 1}
                    </span>
                    <span className="text-sm font-medium">
                      {player ? player.name : 'Üres hely...'}
                    </span>
                  </div>

                  {player && (
                    <button
                      onClick={() => handleMovePlayer(player.id, 'A')}
                      disabled={teamAPlayers.length >= 4}
                      title="Átmozgatás az A csapatba"
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-orange-900/40 hover:text-orange-300 text-zinc-400 text-xs font-medium transition-colors disabled:opacity-30"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>A csapatba</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4.4: CONFIRM AND START GAME BUTTON */}
      <div className="text-center pt-4">
        <button
          onClick={onConfirmAndStartGame}
          disabled={!isReady}
          className={`inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-base md:text-lg font-bold font-cinzel tracking-wider transition-all shadow-2xl ${
            isReady
              ? 'bg-gradient-to-r from-orange-600 via-amber-500 to-orange-700 hover:from-orange-500 hover:to-amber-400 text-white shadow-orange-950/60 cursor-pointer active:scale-95 animate-pulse'
              : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed opacity-60'
          }`}
        >
          <span>CSAPATOK JÓVÁHAGYÁSA ÉS JÁTÉK INDÍTÁSA</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {!isReady && (
          <p className="text-xs text-zinc-500 mt-3">
            Mindkét csapatba pontosan 4-4 játékosnak kell kerülnie a verseny indításához.
          </p>
        )}
      </div>
    </div>
  );
};
