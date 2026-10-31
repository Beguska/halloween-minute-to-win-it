import React from 'react';
import { Player } from '../types/game';
import { PlayerStats, TeamStats } from '../utils/calculations';
import { Users, Shield, Trophy, Flame } from 'lucide-react';

interface TeamsListViewProps {
  teamA: TeamStats;
  teamB: TeamStats;
  playerStats: PlayerStats[];
}

export const TeamsListView: React.FC<TeamsListViewProps> = ({
  teamA,
  teamB,
  playerStats,
}) => {
  const playerStatsMap = new Map<string, PlayerStats>();
  playerStats.forEach((ps) => playerStatsMap.set(ps.player.id, ps));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative z-10 space-y-8">
      <div className="text-center">
        <span className="text-xs uppercase font-mono tracking-widest text-orange-400">
          Csapatfelállások és Játékosprofilok
        </span>
        <h1 className="text-3xl font-extrabold font-cinzel text-white mt-1">
          CSAPATOK ÉS JÁTÉKOSOK
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-lg mx-auto">
          A két 4 fős csapat hivatalos összeállítása és a tagok egyéni párbajteljesítménye.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* TEAM A CARD */}
        <div className="p-6 rounded-3xl bg-[#15101F] border border-orange-500/30 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 font-cinzel font-black text-xl flex items-center justify-center">
                A
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-orange-400 block">
                  1. CSAPAT · {teamA.code}
                </span>
                <h2 className="text-2xl font-bold font-cinzel text-white">{teamA.name}</h2>
              </div>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black font-cinzel text-orange-400 tabular-nums">
                {teamA.totalScore}
              </span>
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">Összpont</span>
            </div>
          </div>

          {/* Player Roster */}
          <div className="space-y-3">
            {teamA.players.map((p, idx) => {
              const stat = playerStatsMap.get(p.id);
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-orange-950/60 border border-orange-500/30 font-mono text-xs font-bold text-orange-300 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-white">{p.name}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-zinc-400 text-[10px] block">Párbaj</span>
                      <span className="text-zinc-200 font-bold tabular-nums">
                        {stat?.duelsWon || 0}/{stat?.duelsPlayed || 0} győzelem
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-orange-400 text-[10px] block">Pont</span>
                      <span className="text-orange-400 font-bold text-sm tabular-nums">
                        {stat?.totalPoints || 0}p
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TEAM B CARD */}
        <div className="p-6 rounded-3xl bg-[#130E1C] border border-purple-500/30 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-400 font-cinzel font-black text-xl flex items-center justify-center">
                B
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400 block">
                  2. CSAPAT · {teamB.code}
                </span>
                <h2 className="text-2xl font-bold font-cinzel text-white">{teamB.name}</h2>
              </div>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black font-cinzel text-purple-400 tabular-nums">
                {teamB.totalScore}
              </span>
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">Összpont</span>
            </div>
          </div>

          {/* Player Roster */}
          <div className="space-y-3">
            {teamB.players.map((p, idx) => {
              const stat = playerStatsMap.get(p.id);
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-500/30 font-mono text-xs font-bold text-purple-300 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-white">{p.name}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-zinc-400 text-[10px] block">Párbaj</span>
                      <span className="text-zinc-200 font-bold tabular-nums">
                        {stat?.duelsWon || 0}/{stat?.duelsPlayed || 0} győzelem
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-purple-400 text-[10px] block">Pont</span>
                      <span className="text-purple-400 font-bold text-sm tabular-nums">
                        {stat?.totalPoints || 0}p
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
