import React, { useState } from 'react';
import {
  Flame,
  Tv,
  Volume2,
  VolumeX,
  Settings as SettingsIcon,
  Trophy,
  Menu,
  X,
  Swords,
  ListOrdered,
  Users,
  BarChart3,
  CalendarCheck,
} from 'lucide-react';
import { DashboardTab, ScreenMode } from '../types/game';

interface HeaderNavProps {
  screen: ScreenMode;
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onOpenProjector: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHallOfFame: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  screen,
  activeTab,
  onSelectTab,
  onOpenProjector,
  soundEnabled,
  onToggleSound,
  onOpenHallOfFame,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'CONSOLE', label: 'Vezérlőpult', icon: <Swords className="w-4 h-4" /> },
    { id: 'GAMES', label: 'Játékok', icon: <ListOrdered className="w-4 h-4" /> },
    { id: 'TEAMS', label: 'Csapatok', icon: <Users className="w-4 h-4" /> },
    { id: 'SCOREBOARD', label: 'Scoreboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'HISTORY', label: 'Eredménytábla', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'HALL_OF_FAME', label: 'Hall of Fame', icon: <Trophy className="w-4 h-4" /> },
    { id: 'SETTINGS', label: 'Beállítások', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <header className="relative z-30 border-b border-orange-500/20 bg-[#0E0B12]/85 backdrop-blur-md sticky top-0 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF7518] to-[#D72638] flex items-center justify-center shadow-lg shadow-orange-950/50">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-cinzel text-base md:text-lg font-bold tracking-wider text-orange-400 whitespace-nowrap block">
              HALLOWEEN
            </span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 -mt-1 block font-mono">
              Minute to Win It
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        {screen === 'DASHBOARD' && (
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'HALL_OF_FAME') {
                      onOpenHallOfFame();
                    } else {
                      onSelectTab(item.id);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 text-xs xl:text-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500/20 to-purple-500/20 text-orange-300 border border-orange-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Zone 3: Primary Action Zone */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Hangok némítása' : 'Hangok bekapcsolása'}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-orange-950/30 border-orange-500/40 text-orange-400 hover:bg-orange-900/40'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Projector Mode CTA */}
          {screen === 'DASHBOARD' && (
            <button
              onClick={onOpenProjector}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg text-xs md:text-sm font-medium shadow-md shadow-purple-950/40 border border-purple-500/30 transition-all whitespace-nowrap shrink-0 active:scale-95"
            >
              <Tv className="w-4 h-4 text-purple-200" />
              <span>Kivetítő mód</span>
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          {screen === 'DASHBOARD' && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && screen === 'DASHBOARD' && (
        <div className="lg:hidden mt-3 pt-3 border-t border-zinc-800 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'HALL_OF_FAME') {
                    onOpenHallOfFame();
                  } else {
                    onSelectTab(item.id);
                  }
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    : 'text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
