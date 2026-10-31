import React, { useState } from 'react';
import { GameItem, GameMatch, GameType } from '../types/game';
import { Plus, Play, SkipForward, Check, Users, Swords, Edit2, AlertCircle } from 'lucide-react';

interface GamesListViewProps {
  games: GameItem[];
  matches: Record<string, GameMatch>;
  currentGameId: string | null;
  onSelectGame: (gameId: string) => void;
  onSkipGame: (gameId: string) => void;
  onAddGame: (name: string, description: string, gameType: GameType) => void;
  onUpdateGame?: (id: string, name: string, description: string, gameType: GameType) => void;
}

export const GamesListView: React.FC<GamesListViewProps> = ({
  games,
  matches,
  currentGameId,
  onSelectGame,
  onSkipGame,
  onAddGame,
  onUpdateGame,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<GameType>('DUEL');

  // Edit modal
  const [editingGame, setEditingGame] = useState<GameItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<GameType>('DUEL');

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddGame(newName.trim(), newDesc.trim(), newType);
    setNewName('');
    setNewDesc('');
    setNewType('DUEL');
    setShowAddForm(false);
  };

  const handleStartEdit = (g: GameItem) => {
    setEditingGame(g);
    setEditName(g.name);
    setEditDesc(g.description);
    setEditType(g.gameType || 'DUEL');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame || !editName.trim()) return;
    if (onUpdateGame) {
      onUpdateGame(editingGame.id, editName.trim(), editDesc.trim(), editType);
    }
    setEditingGame(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative z-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-orange-400">
            Versenyszámok Áttekintése
          </span>
          <h1 className="text-3xl font-extrabold font-cinzel text-white mt-1">
            JÁTÉKOK LISTÁJA
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Összes felvett Halloween játék, típusuk (Teljes csapatos vagy Egyéni párbaj) és állapotuk.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-lg shadow-orange-950/40 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Új játék hozzáadása</span>
        </button>
      </div>

      {/* Add Game Inline Form */}
      {showAddForm && (
        <form onSubmit={handleAddGame} className="p-5 rounded-2xl bg-[#15101F] border border-orange-500/40 shadow-xl space-y-4">
          <h3 className="text-sm font-bold font-cinzel text-white">Új játék rögzítése a bajnoksághoz</h3>
          <div>
            <label className="block text-xs text-zinc-300 mb-1">Játék neve *</label>
            <input
              type="text"
              placeholder="pl. Múmia tekerés, Vámpírfogó..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm outline-none focus:border-orange-500"
            />
          </div>

          {/* Game Type Picker */}
          <div>
            <label className="block text-xs text-zinc-300 mb-1">Játék típusa *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                onClick={() => setNewType('TEAM')}
                className={`p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                  newType === 'TEAM'
                    ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold font-cinzel">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>👥 TELJES CSAPATOS</span>
                </div>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Mind a 4-4 tag együtt versenyez</span>
              </div>

              <div
                onClick={() => setNewType('DUEL')}
                className={`p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                  newType === 'DUEL'
                    ? 'bg-orange-950/40 border-orange-500 text-orange-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold font-cinzel">
                  <Swords className="w-3.5 h-3.5 text-orange-400" />
                  <span>⚔️ EGYÉNI PÁRBAJ</span>
                </div>
                <span className="text-[10px] text-zinc-400 block mt-0.5">1 vs 1 küzdelem 4 párbajban</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-300 mb-1">Rövid leírás / szabály</label>
            <textarea
              placeholder="Rövid magyarázat a feladatról..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm outline-none focus:border-orange-500 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold"
            >
              Hozzáadás
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs"
            >
              Mégse
            </button>
          </div>
        </form>
      )}

      {/* Edit Game Modal */}
      {editingGame && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="p-6 rounded-2xl bg-[#15101F] border border-orange-500/50 shadow-2xl space-y-4 max-w-lg w-full">
            <h3 className="text-base font-bold font-cinzel text-white">Játék adatainak módosítása</h3>
            <div>
              <label className="block text-xs text-zinc-300 mb-1">Játék neve *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm outline-none focus:border-orange-500"
              />
            </div>

            {/* Game Type (Cannot change if completed) */}
            <div>
              <label className="block text-xs text-zinc-300 mb-1">Játék típusa</label>
              {editingGame.status === 'COMPLETED' ? (
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
                  <span className="font-bold text-white block">
                    {editingGame.gameType === 'TEAM' ? '👥 TELJES CSAPATOS' : '⚔️ EGYÉNI PÁRBAJ'}
                  </span>
                  <span className="text-[11px] text-amber-400/80">
                    A már befejezett játékok típusa az eredmények épsége miatt nem módosítható.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setEditType('TEAM')}
                    className={`p-2 rounded-xl border cursor-pointer text-xs ${
                      editType === 'TEAM'
                        ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    👥 TELJES CSAPATOS
                  </div>
                  <div
                    onClick={() => setEditType('DUEL')}
                    className={`p-2 rounded-xl border cursor-pointer text-xs ${
                      editType === 'DUEL'
                        ? 'bg-orange-950/40 border-orange-500 text-orange-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    ⚔️ EGYÉNI PÁRBAJ
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">Rövid leírás / szabály</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingGame(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs"
              >
                Mégse
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold"
              >
                Módosítás mentése
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Games Grid with Type Badges (Section 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game, index) => {
          const isCurrent = game.id === currentGameId;
          const match = matches[game.id];

          let statusBadge = (
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              Még nem játszott
            </span>
          );

          if (isCurrent) {
            statusBadge = (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-orange-950/60 border border-orange-500/50 text-orange-300 font-bold animate-pulse">
                Folyamatban
              </span>
            );
          } else if (game.status === 'COMPLETED') {
            statusBadge = (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Befejezett</span>
              </span>
            );
          } else if (game.status === 'SKIPPED') {
            statusBadge = (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500">
                Kihagyott
              </span>
            );
          }

          return (
            <div
              key={game.id}
              className={`p-5 rounded-2xl bg-[#14101A] border transition-all ${
                isCurrent
                  ? 'border-orange-500 shadow-xl shadow-orange-950/30'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-orange-400 font-mono text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white font-cinzel">{game.name}</h3>
                    {/* Clear Game Type Badge (Section 2) */}
                    <span
                      className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-md font-bold mt-1 ${
                        game.gameType === 'TEAM'
                          ? 'bg-purple-950/70 border border-purple-500/40 text-purple-300'
                          : 'bg-orange-950/70 border border-orange-500/40 text-orange-300'
                      }`}
                    >
                      {game.gameType === 'TEAM' ? '👥 TELJES CSAPATOS' : '⚔️ EGYÉNI PÁRBAJ'}
                    </span>
                  </div>
                </div>
                {statusBadge}
              </div>

              {game.description && (
                <p className="text-xs text-zinc-400 mt-2 line-clamp-3">{game.description}</p>
              )}

              {/* Match score summary if played */}
              {match && match.completed && (
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Végeredmény:</span>
                  <span className="font-bold text-white">
                    {match.totalScoreA} — {match.totalScoreB}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleStartEdit(game)}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-orange-400 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Szerkesztés</span>
                </button>

                <div className="flex items-center gap-2">
                  {game.status === 'NOT_PLAYED' && (
                    <>
                      <button
                        onClick={() => onSelectGame(game.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow transition-all active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Kijelölés játékra</span>
                      </button>
                      <button
                        onClick={() => onSkipGame(game.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs transition-colors"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Kihagyás</span>
                      </button>
                    </>
                  )}
                  {isCurrent && (
                    <span className="text-xs text-orange-400 font-mono">
                      👉 Éppen aktív a Vezérlőpulton!
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
