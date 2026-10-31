import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Users,
  Gamepad2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Swords,
  ShieldAlert,
} from 'lucide-react';
import { GameItem, GameType, Player } from '../types/game';

interface SetupViewProps {
  games: GameItem[];
  players: Player[];
  onAddGame: (name: string, description: string, gameType: GameType) => void;
  onUpdateGame: (id: string, name: string, description: string, gameType: GameType) => void;
  onDeleteGame: (id: string) => void;
  onMoveGame: (id: string, direction: 'UP' | 'DOWN') => void;
  onAddPlayer: (name: string) => void;
  onUpdatePlayer: (id: string, name: string) => void;
  onDeletePlayer: (id: string) => void;
  onLoadSampleData: () => void;
  onProceedToTeams: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({
  games,
  players,
  onAddGame,
  onUpdateGame,
  onDeleteGame,
  onMoveGame,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onLoadSampleData,
  onProceedToTeams,
}) => {
  // Game input state
  const [gameName, setGameName] = useState('');
  const [gameDesc, setGameDesc] = useState('');
  const [gameType, setGameType] = useState<GameType>('DUEL');
  const [editingGameId, setEditingGameId] = useState<string | null>(null);

  // Player input state
  const [playerName, setPlayerName] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  // Errors / warnings
  const [gameError, setGameError] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const handleSaveGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim()) {
      setGameError('A játék nevének megadása kötelező.');
      return;
    }
    setGameError(null);

    if (editingGameId) {
      onUpdateGame(editingGameId, gameName.trim(), gameDesc.trim(), gameType);
      setEditingGameId(null);
    } else {
      onAddGame(gameName.trim(), gameDesc.trim(), gameType);
    }
    setGameName('');
    setGameDesc('');
    setGameType('DUEL');
  };

  const handleEditGameStart = (game: GameItem) => {
    setEditingGameId(game.id);
    setGameName(game.name);
    setGameDesc(game.description);
    setGameType(game.gameType || 'DUEL');
  };

  const handleCancelGameEdit = () => {
    setEditingGameId(null);
    setGameName('');
    setGameDesc('');
    setGameType('DUEL');
    setGameError(null);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = playerName.trim();
    if (!trimmed) {
      setPlayerError('A játékos nevének megadása kötelező.');
      return;
    }

    // Check duplicate
    const isDuplicate = players.some(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase() && p.id !== editingPlayerId
    );
    if (isDuplicate) {
      setPlayerError('Figyelem: Ezen a néven már szerepel játékos a listában.');
      return;
    }

    if (players.length >= 8 && !editingPlayerId) {
      setPlayerError('Már pontosan 8 játékos van rögzítve! Új hozzáadásához előbb törölj egyet.');
      return;
    }

    setPlayerError(null);

    if (editingPlayerId) {
      onUpdatePlayer(editingPlayerId, trimmed);
      setEditingPlayerId(null);
    } else {
      onAddPlayer(trimmed);
    }
    setPlayerName('');
  };

  const handleEditPlayerStart = (player: Player) => {
    setEditingPlayerId(player.id);
    setPlayerName(player.name);
  };

  const handleCancelPlayerEdit = () => {
    setEditingPlayerId(null);
    setPlayerName('');
    setPlayerError(null);
  };

  const isPlayerCountValid = players.length === 8;
  const isGamesCountValid = games.length >= 1;
  const canProceed = isPlayerCountValid && isGamesCountValid;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
      {/* Hero Welcome Banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/40 border border-orange-500/30 text-orange-400 text-xs font-mono uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Felnőtt Halloween Versenyelőkészítő</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-orange-500 tracking-wide drop-shadow-sm">
          HALLOWEEN – MINUTE TO WIN IT
        </h1>
        <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto mt-2">
          Adja meg a verseny állomásait (játékait) a játéktípus kiválasztásával, és a pontosan 8 résztvevő felnőtt nevét a 2x4 fős
          halloween-kihívások elindításához.
        </p>

        {/* Optional quick sample data loader for testing */}
        {games.length === 0 && players.length === 0 && (
          <div className="mt-4">
            <button
              onClick={onLoadSampleData}
              className="text-xs text-orange-400/80 hover:text-orange-300 underline decoration-dotted transition-colors"
            >
              Teszteléshez: Kattints ide vegyes típusú játékok és 8 mintajátékos gyors betöltéséhez
            </button>
          </div>
        )}
      </div>

      {/* Two Column Setup Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* SECTION 1: GAMES MANAGEMENT */}
        <div className="bg-[#14101A] border border-orange-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-cinzel">1. Játékok Hozzáadása</h2>
                <p className="text-xs text-zinc-400">Válassz típust minden játékhoz</p>
              </div>
            </div>
            <div className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-orange-400">
              {games.length} játék felvéve
            </div>
          </div>

          {/* Add / Edit Game Form */}
          <form onSubmit={handleSaveGame} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Játék neve <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="pl. Múmia tekerés, Szellemvadászat, Vámpírfogó..."
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white text-sm placeholder:text-zinc-500 outline-none transition-colors"
              />
            </div>

            {/* NEW REQUIRED FIELD: GAME TYPE SELECTION (Section 1) */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">
                Milyen típusú játék? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option A: Full Team Game */}
                <div
                  onClick={() => setGameType('TEAM')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    gameType === 'TEAM'
                      ? 'bg-purple-950/40 border-purple-500 text-purple-200 ring-1 ring-purple-500/60 shadow-md'
                      : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold font-cinzel">👥 TELJES CSAPATOS</span>
                  </div>
                  <p className="text-[11px] leading-snug opacity-85">
                    Mindkét csapat mind a 4 tagja együtt versenyez két külön körben (A és B kör).
                  </p>
                </div>

                {/* Option B: Individual Duel */}
                <div
                  onClick={() => setGameType('DUEL')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    gameType === 'DUEL'
                      ? 'bg-orange-950/40 border-orange-500 text-orange-200 ring-1 ring-orange-500/60 shadow-md'
                      : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Swords className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold font-cinzel">⚔️ EGYÉNI PÁRBAJ</span>
                  </div>
                  <p className="text-[11px] leading-snug opacity-85">
                    1 vs 1 küzdelem 4 párbajban. Minden csapattag pontosan 1 párbajt vív.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Rövid leírás / szabályok (opcionális)
              </label>
              <textarea
                placeholder="Rövid magyarázat a játékosoknak és a játékmesternek..."
                value={gameDesc}
                onChange={(e) => setGameDesc(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white text-sm placeholder:text-zinc-500 outline-none transition-colors resize-none"
              />
            </div>

            {gameError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{gameError}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-950/40 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>{editingGameId ? 'Játék módosítása' : 'Játék felvétele'}</span>
              </button>
              {editingGameId && (
                <button
                  type="button"
                  onClick={handleCancelGameEdit}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-xl transition-colors"
                >
                  Mégse
                </button>
              )}
            </div>
          </form>

          {/* Games List (Section 2: Showing Game Type Badges) */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {games.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                Még nincs játék hozzáadva. Vegyél fel egyet a fenti űrlappal!
              </div>
            ) : (
              games.map((game, index) => (
                <div
                  key={game.id}
                  className="group flex items-start justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-orange-500/30 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded bg-zinc-800 text-orange-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-zinc-100 truncate">{game.name}</h4>
                        {/* Game Type Badge */}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                            game.gameType === 'TEAM'
                              ? 'bg-purple-950/70 border border-purple-500/40 text-purple-300'
                              : 'bg-orange-950/70 border border-orange-500/40 text-orange-300'
                          }`}
                        >
                          {game.gameType === 'TEAM' ? '👥 TELJES CSAPATOS' : '⚔️ EGYÉNI PÁRBAJ'}
                        </span>
                      </div>
                      {game.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{game.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onMoveGame(game.id, 'UP')}
                      disabled={index === 0}
                      title="Mozgatás fel"
                      className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-20 hover:bg-zinc-800"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onMoveGame(game.id, 'DOWN')}
                      disabled={index === games.length - 1}
                      title="Mozgatás le"
                      className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-20 hover:bg-zinc-800"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditGameStart(game)}
                      title="Szerkesztés"
                      className="p-1 rounded text-zinc-400 hover:text-orange-400 hover:bg-zinc-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteGame(game.id)}
                      title="Törlés"
                      className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 2: PLAYERS MANAGEMENT */}
        <div className="bg-[#14101A] border border-orange-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-cinzel">2. Játékosok Hozzáadása</h2>
                <p className="text-xs text-zinc-400">Pontosan 8 játékos szükséges (2 x 4 fős csapat)</p>
              </div>
            </div>
            <div
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                isPlayerCountValid
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-900 text-orange-400 border-zinc-800'
              }`}
            >
              {players.length} / 8 játékos
            </div>
          </div>

          {/* Add / Edit Player Form */}
          <form onSubmit={handleSavePlayer} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Játékos teljes neve <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="pl. Kovács Anna, Tóth Péter..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                disabled={players.length >= 8 && !editingPlayerId}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white text-sm placeholder:text-zinc-500 outline-none transition-colors disabled:opacity-50"
              />
            </div>

            {playerError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{playerError}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={players.length >= 8 && !editingPlayerId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md shadow-purple-950/40 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>{editingPlayerId ? 'Játékos módosítása' : 'Játékos felvétele'}</span>
              </button>
              {editingPlayerId && (
                <button
                  type="button"
                  onClick={handleCancelPlayerEdit}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-xl transition-colors"
                >
                  Mégse
                </button>
              )}
            </div>
          </form>

          {/* Player Count Warning / Status */}
          <div className="mb-4">
            {!isPlayerCountValid && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  {players.length < 8
                    ? `Még ${8 - players.length} játékos hiányzik a két 4 fős csapathoz.`
                    : 'Túl sok játékos van megadva! Pontosan 8 szükséges.'}
                </span>
              </div>
            )}
            {isPlayerCountValid && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Megvan mind a 8 játékos! Készen állsz a csapatok kialakítására.</span>
              </div>
            )}
          </div>

          {/* Players List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {players.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                Még nincs játékos hozzáadva. Írd be a neveket egyesével!
              </div>
            ) : (
              players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-950 text-purple-300 font-mono text-xs font-bold flex items-center justify-center border border-purple-800">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-zinc-100">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditPlayerStart(player)}
                      title="Név módosítása"
                      className="p-1 rounded text-zinc-400 hover:text-purple-400 hover:bg-zinc-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeletePlayer(player.id)}
                      title="Játékos törlése"
                      className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3.3: PROCEED TO TEAMS BUTTON */}
      <div className="text-center pt-2">
        <button
          onClick={onProceedToTeams}
          disabled={!canProceed}
          className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base md:text-lg font-bold font-cinzel tracking-wider transition-all shadow-xl ${
            canProceed
              ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-950/60 cursor-pointer active:scale-95 animate-pulse'
              : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed opacity-60'
          }`}
        >
          <span>CSAPATOK KIALAKÍTÁSA</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {!canProceed && (
          <p className="text-xs text-zinc-500 mt-3">
            A továbblépéshez vegyél fel legalább 1 játékot és pontosan 8 játékost.
          </p>
        )}
      </div>
    </div>
  );
};
