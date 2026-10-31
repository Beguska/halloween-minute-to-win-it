import React, { useState } from 'react';
import { Trophy, Users, Award, Percent, Flame } from 'lucide-react';
import { PlayerStats, TeamStats } from '../utils/calculations';

interface ScoreboardViewProps {
  teamA: TeamStats;
  teamB: TeamStats;
  playerStats: PlayerStats[];
}

export const ScoreboardView: React.FC<ScoreboardViewProps> = ({
  teamA,
  teamB,
  playerStats,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'TEAMS' | 'PLAYERS'>('TEAMS');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative z-10 space-y-8">
      {/* Header */}
      <div className="text-center">
        <span className="text-xs uppercase font-mono tracking-widest text-orange-400">
          Versenyzők és Csapatok Állása
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-orange-500 mt-1">
          ÉLŐ SCOREBOARD
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
          Kövesd a két csapat összecsapásának folyamatosan frissülő eredményeit és az egyéni játékosok
          teljesítményét.
        </p>

        {/* Tab switch */}
        <div className="inline-flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl mt-6">
          <button
            onClick={() => setActiveSubTab('TEAMS')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              activeSubTab === 'TEAMS'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Csapatranglista</span>
          </button>
          <button
            onClick={() => setActiveSubTab('PLAYERS')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              activeSubTab === 'PLAYERS'
                ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Egyéni ranglista</span>
          </button>
        </div>
      </div>

      {/* 12.1 TEAM LEADERBOARD */}
      {activeSubTab === 'TEAMS' && (
        <div className="space-y-6">
          <div className="bg-[#14101A] border border-orange-500/20 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Csapat</th>
                    <th className="py-4 px-4 text-center">Csapattagok</th>
                    <th className="py-4 px-4 text-center">Nyert Játékok</th>
                    <th className="py-4 px-4 text-center">Döntetlen Játék</th>
                    <th className="py-4 px-4 text-center">Nyert Párbajok</th>
                    <th className="py-4 px-4 text-center">Pontkülönbség</th>
                    <th className="py-4 px-6 text-right">Összesített Pont</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-sm">
                  {/* Team A Row */}
                  <tr
                    className={`transition-colors ${
                      teamA.isLeader ? 'bg-orange-950/20' : 'hover:bg-zinc-900/40'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-cinzel font-bold text-sm">
                          A
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white font-cinzel text-base">
                              {teamA.name}
                            </span>
                            {teamA.isLeader && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                                VEZETŐ
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-orange-400/80 font-mono">{teamA.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-xs text-zinc-300">
                      {teamA.players.map((p) => p.name).join(', ')}
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-zinc-200 tabular-nums">
                      {teamA.wonGames}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-zinc-400 tabular-nums">
                      {teamA.drawnGames}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-orange-300 font-bold tabular-nums">
                      {teamA.wonDuels}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-zinc-300 tabular-nums">
                      {teamA.isLeader ? `+${teamA.pointDiff}` : teamA.pointDiff === 0 ? '0' : `-${teamA.pointDiff}`}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-2xl font-black font-cinzel text-orange-400 tabular-nums">
                        {teamA.totalScore}
                      </span>
                    </td>
                  </tr>

                  {/* Team B Row */}
                  <tr
                    className={`transition-colors ${
                      teamB.isLeader ? 'bg-purple-950/20' : 'hover:bg-zinc-900/40'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-cinzel font-bold text-sm">
                          B
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white font-cinzel text-base">
                              {teamB.name}
                            </span>
                            {teamB.isLeader && (
                              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                                VEZETŐ
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-purple-400/80 font-mono">{teamB.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-xs text-zinc-300">
                      {teamB.players.map((p) => p.name).join(', ')}
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-zinc-200 tabular-nums">
                      {teamB.wonGames}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-zinc-400 tabular-nums">
                      {teamB.drawnGames}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-purple-300 font-bold tabular-nums">
                      {teamB.wonDuels}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-zinc-300 tabular-nums">
                      {teamB.isLeader ? `+${teamB.pointDiff}` : teamB.pointDiff === 0 ? '0' : `-${teamB.pointDiff}`}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-2xl font-black font-cinzel text-purple-400 tabular-nums">
                        {teamB.totalScore}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 12.2 INDIVIDUAL PLAYER LEADERBOARD */}
      {activeSubTab === 'PLAYERS' && (
        <div className="bg-[#14101A] border border-orange-500/20 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="py-4 px-5 text-center">Helyezés</th>
                  <th className="py-4 px-6">Játékos Neve</th>
                  <th className="py-4 px-4">Csapat</th>
                  <th className="py-4 px-4 text-center">Lejátszott Párbajok</th>
                  <th className="py-4 px-4 text-center">Megnyert Párbajok</th>
                  <th className="py-4 px-4 text-center">Győzelmi Arány</th>
                  <th className="py-4 px-4 text-center">Átlagpontszám</th>
                  <th className="py-4 px-6 text-right">Összes Megszerzett Pont</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm">
                {playerStats.map((stat, idx) => {
                  const isTop3 = stat.rank <= 3 && stat.totalPoints > 0;
                  const rankColor =
                    stat.rank === 1
                      ? 'text-amber-400 font-bold'
                      : stat.rank === 2
                      ? 'text-slate-300 font-bold'
                      : stat.rank === 3
                      ? 'text-amber-600 font-bold'
                      : 'text-zinc-500';

                  return (
                    <tr
                      key={stat.player.id}
                      className="hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-5 text-center">
                        <span className={`font-mono text-base ${rankColor} tabular-nums`}>
                          {stat.rank === 1 && stat.totalPoints > 0 ? '🥇' : `${stat.rank}.`}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{stat.player.name}</span>
                          {stat.rank === 1 && stat.totalPoints > 0 && (
                            <Flame className="w-4 h-4 text-orange-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-md font-mono ${
                            stat.player.team === 'A'
                              ? 'bg-orange-950/40 border border-orange-500/30 text-orange-300'
                              : 'bg-purple-950/40 border border-purple-500/30 text-purple-300'
                          }`}
                        >
                          {stat.player.team === 'A' ? teamA.name : teamB.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-zinc-300 tabular-nums">
                        {stat.duelsPlayed}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400 tabular-nums">
                        {stat.duelsWon}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-zinc-300 tabular-nums">
                        {stat.winRate}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-300 tabular-nums">
                        {stat.averagePoints}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="text-xl font-bold font-cinzel text-orange-400 tabular-nums">
                          {stat.totalPoints}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
