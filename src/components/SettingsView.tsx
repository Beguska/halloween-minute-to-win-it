import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Clock,
  Download,
  Upload,
  RotateCcw,
  Tv,
  Maximize2,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  FileCode,
  Sliders,
  Play,
  Flame,
  Bell,
  Sparkles,
} from 'lucide-react';
import { AppSettings, AppState } from '../types/game';
import { exportResultsAsCSV, exportStateAsJSON, validateAndImportJSON } from '../utils/storage';
import { soundEngine } from '../utils/sound';

interface SettingsViewProps {
  settings: AppSettings;
  fullState: AppState;
  teamAName: string;
  teamBName: string;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenProjector: () => void;
  onResetCompetition: () => void;
  onImportState: (imported: Partial<AppState>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  fullState,
  teamAName,
  teamBName,
  onUpdateSettings,
  onOpenProjector,
  onResetCompetition,
  onImportState,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(
    null
  );

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundEngine.setVolume(val);
    onUpdateSettings({ volume: val });
  };

  const handleToggleSound = () => {
    const nextVal = !settings.soundEnabled;
    soundEngine.setMuted(!nextVal);
    onUpdateSettings({ soundEnabled: nextVal });
    if (nextVal) {
      soundEngine.playTick();
    }
  };

  const handleToggleMysticStart = () => {
    const nextVal = !settings.mysticStartSoundEnabled;
    soundEngine.startSoundEnabled = nextVal;
    onUpdateSettings({ mysticStartSoundEnabled: nextVal });
  };

  const handleToggleUrgentCountdown = () => {
    const nextVal = !settings.urgentCountdownBeepEnabled;
    soundEngine.urgentTickEnabled = nextVal;
    onUpdateSettings({ urgentCountdownBeepEnabled: nextVal });
  };

  const handleToggleTimesUpGong = () => {
    const nextVal = !settings.timesUpGongEnabled;
    soundEngine.gongEnabled = nextVal;
    onUpdateSettings({ timesUpGongEnabled: nextVal });
  };

  const handleTimerDefaultChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(5, Math.min(300, parseInt(e.target.value) || 60));
    onUpdateSettings({ defaultTimerSeconds: val });
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateAndImportJSON(content);
      if (res.success) {
        onImportState({
          games: res.games,
          players: res.players,
          matches: res.matches,
          teamANameCustom: res.teamAName,
          teamBNameCustom: res.teamBName,
        });
        setImportStatus({
          success: true,
          message: 'Sikeres importálás! A verseny adatai helyreállítva.',
        });
      } else {
        setImportStatus({
          success: false,
          message: res.error || 'Hibás vagy sérült JSON fájl.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 space-y-8">
      {/* Title */}
      <div className="text-center">
        <span className="text-xs uppercase font-mono tracking-widest text-orange-400">
          Rendszer és Játékbeállítások
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-orange-500 mt-1">
          BEÁLLÍTÁSOK
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-lg mx-auto">
          Hangok, időzítő finomhangolása, adatexport és biztonsági mentések kezelése.
        </p>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: AUDIO SETTINGS (Section 4 requirements) */}
        <div className="p-6 rounded-2xl bg-[#14101A] border border-orange-500/25 shadow-xl space-y-6">
          <h2 className="text-lg font-bold font-cinzel text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-orange-400" />
            <span>Halloween Hangrendszer Beállításai</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Master Sound & Volume */}
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white block">Fő Hangkapcsoló</span>
                  <span className="text-xs text-zinc-400">Minden hangeffektus engedélyezése</span>
                </div>
                <button
                  onClick={handleToggleSound}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    settings.soundEnabled
                      ? 'bg-orange-950/40 border-orange-500/50 text-orange-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>

              {settings.soundEnabled && (
                <div>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>Hangerő</span>
                    <span className="font-mono text-white">{Math.round(settings.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-orange-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-500 block mt-1">
                    Ajánlott: 80-100% hangosabb teremben vagy rendezvényen.
                  </span>
                </div>
              )}
            </div>

            {/* Default Timer */}
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-4">
              <div>
                <span className="text-sm font-semibold text-white block">Visszaszámláló Alapérték</span>
                <span className="text-xs text-zinc-400">Alapértelmezett 60 másodperc fordulónként</span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="300"
                  step="5"
                  value={settings.defaultTimerSeconds}
                  onChange={handleTimerDefaultChange}
                  className="w-24 px-3 py-2 rounded-xl bg-black border border-zinc-700 text-white font-mono font-bold text-center outline-none focus:border-orange-500"
                />
                <span className="text-xs font-mono text-zinc-400">másodperc</span>

                <button
                  onClick={() => onUpdateSettings({ defaultTimerSeconds: 60 })}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors ml-auto"
                >
                  60 mp-re visszaállítás
                </button>
              </div>
            </div>
          </div>

          {/* Granular Sound Effect Toggles & Previews (Section 4) */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <span className="text-xs font-mono uppercase text-orange-400 tracking-wider block">
              Egyesített Hanghatások Finomhangolása:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Mystic Start Sound */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-white">Misztikus indulóhang</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.mysticStartSoundEnabled}
                    onChange={handleToggleMysticStart}
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Sötét, baljós horrorfilm hang a timer indításakor.
                </p>
                <button
                  type="button"
                  onClick={() => soundEngine.playMysticStart()}
                  className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-zinc-800 hover:bg-orange-950/40 hover:text-orange-300 text-[11px] font-mono text-zinc-300 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Kipróbálás</span>
                </button>
              </div>

              {/* Last 10s Ticking */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-white">Utolsó 10 mp pittyegése</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.urgentCountdownBeepEnabled}
                    onChange={handleToggleUrgentCountdown}
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Csak 10 másodpercnél kezdődik, fokozatosan gyorsuló feszültséggel.
                </p>
                <button
                  type="button"
                  onClick={() => soundEngine.playUrgentTick(3)}
                  className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-zinc-800 hover:bg-red-950/40 hover:text-red-300 text-[11px] font-mono text-zinc-300 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Kipróbálás</span>
                </button>
              </div>

              {/* Times-up Gong */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Lejárati gong / harang</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.timesUpGongEnabled}
                    onChange={handleToggleTimesUpGong}
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Erőteljes mély misztikus gonghang, amikor a timer eléri a nullát.
                </p>
                <button
                  type="button"
                  onClick={() => soundEngine.playTimesUpGong()}
                  className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-zinc-800 hover:bg-amber-950/40 hover:text-amber-300 text-[11px] font-mono text-zinc-300 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Kipróbálás</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: DISPLAY MODES */}
        <div className="p-6 rounded-2xl bg-[#14101A] border border-orange-500/25 shadow-xl space-y-4">
          <h2 className="text-lg font-bold font-cinzel text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-purple-400" />
            <span>Kijelző és Kivetítés</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={onOpenProjector}
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 hover:border-purple-500/60 text-left transition-all group"
            >
              <div>
                <span className="text-sm font-bold text-white group-hover:text-purple-300 block transition-colors">
                  Kivetítő / Spectator Mód Megnyitása
                </span>
                <span className="text-xs text-zinc-400">
                  Letisztult, óriási TV nézet a közönségnek és a versenyzőknek
                </span>
              </div>
              <Tv className="w-5 h-5 text-purple-400 shrink-0" />
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-left transition-all"
            >
              <div>
                <span className="text-sm font-bold text-white block">Teljes Képernyős Mód</span>
                <span className="text-xs text-zinc-400">F11 / Böngésző ablakkeret elrejtése</span>
              </div>
              <Maximize2 className="w-5 h-5 text-zinc-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* SECTION 3: DATA EXPORT & BACKUP */}
        <div className="p-6 rounded-2xl bg-[#14101A] border border-orange-500/25 shadow-xl space-y-6">
          <h2 className="text-lg font-bold font-cinzel text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-400" />
            <span>Adatmentés és Exportálás</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export JSON */}
            <button
              onClick={() => exportStateAsJSON(fullState)}
              className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 text-left transition-all"
            >
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">Teljes mentés (JSON)</span>
                <span className="text-xs text-zinc-400">Minden játék, játéktípus és párbaj</span>
              </div>
            </button>

            {/* Export CSV */}
            <button
              onClick={() => exportResultsAsCSV(fullState, teamAName, teamBName)}
              className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/40 text-left transition-all"
            >
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">Táblázat export (CSV)</span>
                <span className="text-xs text-zinc-400">Excelben és Sheetsben megnyitható</span>
              </div>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-dashed border-zinc-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-white block">Mentés visszatöltése (JSON)</span>
                <span className="text-xs text-zinc-400">
                  Tölts vissza egy korábban exportált versenyállást
                </span>
              </div>
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer transition-colors shrink-0">
                <Upload className="w-4 h-4" />
                <span>Fájl kiválasztása</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {importStatus && (
              <div
                className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
                  importStatus.success
                    ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/40 border border-red-500/30 text-red-300'
                }`}
              >
                {importStatus.success ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: HARD RESET */}
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-cinzel text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Verseny Teljes Újraindítása</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Törli az összes rögzített párbajt, pontszámot, csapatot és játékost a kezdeti állapothoz.
              </p>
            </div>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 border border-red-600/50 text-white font-semibold text-xs transition-colors shrink-0"
            >
              Verseny törlése & Újrakezdés
            </button>
          </div>

          {showResetConfirm && (
            <div className="p-4 rounded-xl bg-black/70 border border-red-500 text-center space-y-3 mt-4">
              <span className="text-sm font-bold text-white block">
                Biztosan törölni szeretnéd a teljes versenyt?
              </span>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Ez a művelet visszavonhatatlan. Javasoljuk, hogy előbb mentsd le az adatokat JSON
                formátumban!
              </p>
              <div className="flex justify-center gap-3 pt-1">
                <button
                  onClick={() => {
                    onResetCompetition();
                    setShowResetConfirm(false);
                  }}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                >
                  Igen, mindent törlök
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
                >
                  Mégse
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
