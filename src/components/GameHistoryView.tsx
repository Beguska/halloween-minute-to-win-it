import React, { useState } from 'react';
import { GameItem, GameMatch, Player } from '../types/game';
import { TeamStats } from '../utils/calculations';
import { ChevronDown, ChevronRight, Edit3, Check, X, Users, Swords } from 'lucide-react';

interface GameHistoryViewProps {
  games: GameItem[];
  matches: Record<string, GameMatch>;
  players: Player[];
  teamA: TeamStats;
  teamB: TeamStats;
  onUpdatePastDuelScore: (
    gameId: string,
    duelIndex: number,
    scoreA: number,
    scoreB: number
  ) => void;
  onUpdatePastTeamScore?: (
    gameId: string,
    scoreA: number,
    scoreB: number
  ) => void;
}

export const GameHistoryView: React.FC<GameHistoryViewProps> = ({
  games,
  matches,
  players,
  teamA,
  teamB,
  onUpdatePastDuelScore,
  onUpdatePastTeamScore,
}) => {
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  // Edit duel state
  const [editingDuel, setEditingDuel] = useState<{
    gameId: string;
    duelIndex: number;
    scoreA: number;
    scoreB: number;
  } | null>(null);

  // Edit team match state
  const [editingTeamMatch, setEditingTeamMatch] = useState<{
    gameId: string;
    scoreA: number;
    scoreB: number;
  } | null>(null);

  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  const completedMatches = Object.values(matches).filter(
    (m) =>
      m.completed ||
      (m.duels && m.duels.some((d) => d.completed)) ||
      m.teamRoundA?.completed ||
      m.teamRoundB?.completed
  );

  const toggleExpand = (gameId: string) => {
    setExpandedGameId((prev) => (prev === gameId ? null : gameId));
  };

  const handleStartEditDuel = (
    gameId: string,
    duelIndex: number,
    scoreA: number | null,
    scoreB: number | null
  ) => {
    setEditingDuel({
      gameId,
      duelIndex,
      scoreA: scoreA ?? 0,
      scoreB: scoreB ?? 0,
    });
  };

  const handleSaveEditedDuel = () => {
    if (!editingDuel) return;
    onUpdatePastDuelScore(
      editingDuel.gameId,
      editingDuel.duelIndex,
      editingDuel.scoreA,
      editingDuel.scoreB
    );
    setEditingDuel(null);
  };

  const handleStartEditTeamMatch = (gameId: string, scoreA: number, scoreB: number) => {
    setEditingTeamMatch({ gameId, scoreA, scoreB });
  };

  const handleSaveEditedTeamMatch = () => {
    if (!editingTeamMatch || !onUpdatePastTeamScore) return;
    onUpdatePastTeamScore(
      editingTeamMatch.gameId,
      editingTeamMatch.scoreA,
      editingTeamMatch.scoreB
    );
    setEditingTeamMatch(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative z-10 space-y-8">
      <div className="text-center">
        <span className="text-xs uppercase font-mono tracking-widest text-orange-400">
          Mérkőzés Archívum és Részletek
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-orange-500 mt-1">
          JÁTÉKONKÉNTI EREDMÉNYTÁBLA
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
          Itt visszanézheted az összes eddig lejátszott Teljes csapatos és Egyéni párbaj mérkőzést, és
          szükség esetén javíthatod a pontokat.
        </p>
      </div>

      {completedMatches.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#14101A] border border-zinc-800 text-zinc-500">
          <p className="text-base font-cinzel">Még nincs rögzített játékeredmény.</p>
          <p className="text-xs mt-1 text-zinc-600">
            Indíts el egy játékot a Vezérlőpultról, és a befejezett fordulók itt fognak megjelenni!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {completedMatches.map((match, matchIndex) => {
            const game = games.find((g) => g.id === match.gameId);
            const isExpanded = expandedGameId === match.gameId;
            const isGameComplete = match.completed;
            const isTeam = match.gameType === 'TEAM' || !!match.teamRoundA;

            let winnerBadge = 'Folyamatban';
            if (isGameComplete) {
              if (match.totalScoreA > match.totalScoreB) winnerBadge = teamA.name;
              else if (match.totalScoreB > match.totalScoreA) winnerBadge = teamB.name;
              else winnerBadge = 'Döntetlen';
            }

            return (
              <div
                key={match.gameId}
                className="bg-[#14101A] border border-orange-500/25 rounded-2xl overflow-hidden shadow-xl transition-all"
              >
                {/* Game Row Header */}
                <div
                  onClick={() => toggleExpand(match.gameId)}
                  className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 text-zinc-400 hover:text-white">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-orange-400 tracking-wider">
                          {matchIndex + 1}. Játék
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            isTeam
                              ? 'bg-purple-950/70 border border-purple-500/40 text-purple-300'
                              : 'bg-orange-950/70 border border-orange-500/40 text-orange-300'
                          }`}
                        >
                          {isTeam ? '👥 TELJES CSAPATOS' : '⚔️ EGYÉNI PÁRBAJ'}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-white font-cinzel">
                        {game?.name || 'Ismeretlen játék'}
                      </h3>
                    </div>
                  </div>

                  {/* Quick score summary */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-sm font-mono">
                      <div className="text-right">
                        <span className="text-[10px] text-orange-400/80 block uppercase">{teamA.name}</span>
                        <span className="font-bold text-base text-white tabular-nums">
                          {match.totalScoreA} pont
                        </span>
                      </div>
                      <span className="text-zinc-600 font-bold">—</span>
                      <div className="text-left">
                        <span className="text-[10px] text-purple-400/80 block uppercase">{teamB.name}</span>
                        <span className="font-bold text-base text-white tabular-nums">
                          {match.totalScoreB} pont
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-mono font-bold border ${
                          winnerBadge === teamA.name
                            ? 'bg-orange-950/40 border-orange-500/40 text-orange-300'
                            : winnerBadge === teamB.name
                            ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                            : winnerBadge === 'Döntetlen'
                            ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        Győztes: {winnerBadge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-zinc-800/80 bg-black/20 space-y-3">
                    {/* TELJES CSAPATOS Details */}
                    {isTeam ? (
                      <div className="space-y-3">
                        <div className="text-xs uppercase font-mono text-zinc-400 tracking-wider">
                          Csapatkörök pontszámai:
                        </div>

                        {editingTeamMatch?.gameId === match.gameId ? (
                          <div className="p-4 rounded-xl bg-zinc-900 border border-purple-500 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-xs font-mono">
                              <div>
                                <span className="block text-orange-400 font-bold mb-1">{teamA.name} pont:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingTeamMatch.scoreA}
                                  onChange={(e) =>
                                    setEditingTeamMatch({
                                      ...editingTeamMatch,
                                      scoreA: Math.max(0, parseInt(e.target.value) || 0),
                                    })
                                  }
                                  className="w-20 px-2 py-1 rounded bg-black border border-orange-500 text-white font-mono font-bold text-center"
                                />
                              </div>
                              <div>
                                <span className="block text-purple-400 font-bold mb-1">{teamB.name} pont:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingTeamMatch.scoreB}
                                  onChange={(e) =>
                                    setEditingTeamMatch({
                                      ...editingTeamMatch,
                                      scoreB: Math.max(0, parseInt(e.target.value) || 0),
                                    })
                                  }
                                  className="w-20 px-2 py-1 rounded bg-black border border-purple-500 text-white font-mono font-bold text-center"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEditedTeamMatch}
                                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mentés</span>
                              </button>
                              <button
                                onClick={() => setEditingTeamMatch(null)}
                                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs"
                              >
                                Mégse
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-orange-400 uppercase font-mono block">
                                  1. KÖR ({teamA.name})
                                </span>
                                <span className="text-base font-bold text-white font-mono">
                                  {match.totalScoreA} pont
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  handleStartEditTeamMatch(
                                    match.gameId,
                                    match.totalScoreA,
                                    match.totalScoreB
                                  )
                                }
                                className="p-1 text-zinc-500 hover:text-orange-400"
                                title="Pontszám módosítása"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-purple-400 uppercase font-mono block">
                                  2. KÖR ({teamB.name})
                                </span>
                                <span className="text-base font-bold text-white font-mono">
                                  {match.totalScoreB} pont
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  handleStartEditTeamMatch(
                                    match.gameId,
                                    match.totalScoreA,
                                    match.totalScoreB
                                  )
                                }
                                className="p-1 text-zinc-500 hover:text-purple-400"
                                title="Pontszám módosítása"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* EGYÉNI PÁRBAJ Details */
                      <div className="space-y-2">
                        <div className="text-xs uppercase font-mono text-zinc-400 mb-2 tracking-wider">
                          A 4 egyéni párbaj részletei:
                        </div>
                        {(match.duels || []).map((duel, duelIdx) => {
                          const pA = playerMap.get(duel.playerAId);
                          const pB = playerMap.get(duel.playerBId);
                          const isCompleted = duel.completed;
                          const isEditingThis =
                            editingDuel?.gameId === match.gameId && editingDuel?.duelIndex === duelIdx;

                          let duelWinner = 'Még nincs lezárva';
                          if (isCompleted) {
                            if ((duel.scoreA ?? 0) > (duel.scoreB ?? 0)) duelWinner = `${pA?.name} nyert`;
                            else if ((duel.scoreB ?? 0) > (duel.scoreA ?? 0)) duelWinner = `${pB?.name} nyert`;
                            else duelWinner = 'Döntetlen';
                          }

                          return (
                            <div
                              key={duel.id || duelIdx}
                              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded bg-zinc-800 font-mono text-orange-400 font-bold flex items-center justify-center">
                                  {duel.duelNumber}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{pA?.name || 'A'}</span>
                                  <span className="text-zinc-500">vs</span>
                                  <span className="font-semibold text-white">{pB?.name || 'B'}</span>
                                </div>
                              </div>

                              {isEditingThis ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={editingDuel.scoreA}
                                    onChange={(e) =>
                                      setEditingDuel({
                                        ...editingDuel,
                                        scoreA: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className="w-16 py-1 rounded bg-black border border-orange-500 text-center font-mono font-bold text-white text-xs outline-none"
                                  />
                                  <span className="text-zinc-500">—</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editingDuel.scoreB}
                                    onChange={(e) =>
                                      setEditingDuel({
                                        ...editingDuel,
                                        scoreB: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className="w-16 py-1 rounded bg-black border border-purple-500 text-center font-mono font-bold text-white text-xs outline-none"
                                  />
                                  <button
                                    onClick={handleSaveEditedDuel}
                                    className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                    title="Mentés"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingDuel(null)}
                                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                    title="Mégse"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4">
                                  <div className="font-mono font-bold text-sm">
                                    <span className="text-orange-400">{duel.scoreA ?? '-'}</span>
                                    <span className="text-zinc-600 mx-1.5">:</span>
                                    <span className="text-purple-400">{duel.scoreB ?? '-'}</span>
                                  </div>
                                  <span className="text-zinc-400 italic text-[11px] min-w-[100px] text-right">
                                    {duelWinner}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleStartEditDuel(match.gameId, duelIdx, duel.scoreA, duel.scoreB)
                                    }
                                    className="p-1 text-zinc-500 hover:text-orange-400 transition-colors"
                                    title="Pontszám módosítása"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
