import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, Flame, Target, Ghost, Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';
import { HallOfFameAwards, TeamStats } from '../utils/calculations';
import { soundEngine } from '../utils/sound';

interface HallOfFameViewProps {
  awards: HallOfFameAwards;
  teamA: TeamStats;
  teamB: TeamStats;
  onBackToConsole: () => void;
}

export const HallOfFameView: React.FC<HallOfFameViewProps> = ({
  awards,
  teamA,
  teamB,
  onBackToConsole,
}) => {
  const triggerConfetti = () => {
    soundEngine.playCelebration();

    // Spooky Halloween celebration confetti: orange, gold, purple, crimson
    const count = 200;
    const defaults = {
      origin: { y: 0.6 },
      colors: ['#FF7518', '#F5B942', '#8B5CF6', '#D72638', '#ffffff'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  useEffect(() => {
    triggerConfetti();
  }, []);

  const isChampionTeamA = awards.championTeam === 'A';
  const isChampionTeamB = awards.championTeam === 'B';
  const isChampionDraw = awards.championTeam === 'DRAW';

  const winningTeamStats = isChampionTeamA ? teamA : isChampionTeamB ? teamB : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative z-10 space-y-12 animate-in fade-in duration-500">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToConsole}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Vissza a Vezérlőpultra</span>
        </button>

        <button
          onClick={triggerConfetti}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-950/40 border border-orange-500/30 text-orange-400 hover:text-orange-300 text-sm transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>Újra ünneplés & Konfetti</span>
        </button>
      </div>

      {/* 13.1 CHAMPION TEAM CELEBRATION HERO */}
      <div className="text-center relative py-8 px-6 rounded-3xl bg-gradient-to-b from-[#22132e] via-[#160d20] to-[#0d0814] border-2 border-amber-500/80 shadow-[0_0_60px_rgba(245,185,66,0.25)] overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 flex items-center justify-center shadow-2xl shadow-amber-950/80 border-2 border-amber-300 animate-pulse">
            <Trophy className="w-14 h-14 text-black" />
          </div>

          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold block">
              🏆 HALLOWEEN – MINUTE TO WIN IT BAJNOKA
            </span>
            <h1 className="text-4xl md:text-6xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-500 tracking-wider mt-2">
              {awards.championTeamName}
            </h1>
          </div>

          {winningTeamStats && (
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30">
                <span className="text-[10px] text-zinc-400 uppercase font-mono block">Összpontszám</span>
                <span className="text-2xl font-black font-cinzel text-amber-400 tabular-nums">
                  {winningTeamStats.totalScore}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30">
                <span className="text-[10px] text-zinc-400 uppercase font-mono block">Nyert játékok</span>
                <span className="text-2xl font-black font-cinzel text-white tabular-nums">
                  {winningTeamStats.wonGames}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30">
                <span className="text-[10px] text-zinc-400 uppercase font-mono block">Nyert párbaj</span>
                <span className="text-2xl font-black font-cinzel text-white tabular-nums">
                  {winningTeamStats.wonDuels}
                </span>
              </div>
            </div>
          )}

          {isChampionDraw && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-sm">
              Tökéletes holtverseny! Mindkét csapat egyenlő pontszámot szerzett ({teamA.totalScore} —{' '}
              {teamB.totalScore}), így közösen állhatnak a dobogó legfelső fokára!
            </div>
          )}
        </div>
      </div>

      {/* 13.2 INDIVIDUAL AWARDS SECTION */}
      <div className="space-y-6">
        <div className="text-center">
          <span className="text-xs uppercase font-mono tracking-widest text-orange-400">
            Különdíjak
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold font-cinzel text-white mt-1">
            HALLOWEEN HALL OF FAME DÍJAK
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 max-w-xl mx-auto mt-1">
            Az 5 hivatalos versenykategória győztesei a tényleges mérkőzésadatok alapján:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AWARD 1: A HALLOWEEN PONTKIRÁLYA */}
          <div className="p-6 rounded-2xl bg-[#14101A] border border-amber-500/40 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xl mb-4">
                🥇
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block">
                1. DÍJ
              </span>
              <h3 className="text-lg font-bold font-cinzel text-white">
                A Halloween Pontkirálya
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Az a játékos, aki az összes játék során a legtöbb pontot szerezte.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800">
              {awards.pointKings.length === 0 ? (
                <span className="text-xs text-zinc-500 italic">Még nincs pontszerző játékos</span>
              ) : (
                <div className="space-y-2">
                  {awards.pointKings.map((pk) => (
                    <div key={pk.player.id} className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{pk.player.name}</span>
                      <span className="font-mono font-bold text-amber-400 text-base tabular-nums">
                        {pk.points} pont
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AWARD 2: A LEGJOBB ÁTLAGTELJESÍTMÉNY */}
          <div className="p-6 rounded-2xl bg-[#14101A] border border-orange-500/40 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center text-xl mb-4">
                🎯
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-orange-400 block">
                2. DÍJ
              </span>
              <h3 className="text-lg font-bold font-cinzel text-white">
                A Legjobb Átlagteljesítmény
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                A legmagasabb egy párbajra jutó átlagpontszám (min. 1 párbaj).
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800">
              {awards.highestAverages.length === 0 ? (
                <span className="text-xs text-zinc-500 italic">Még nincs befejezett párbaj</span>
              ) : (
                <div className="space-y-2">
                  {awards.highestAverages.map((ha) => (
                    <div key={ha.player.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-sm block">{ha.player.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {ha.played} lejátszott párbaj
                        </span>
                      </div>
                      <span className="font-mono font-bold text-orange-400 text-base tabular-nums">
                        {ha.average} pont / párbaj
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AWARD 3: A PÁRBAJOK KIRÁLYA */}
          <div className="p-6 rounded-2xl bg-[#14101A] border border-purple-500/40 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center text-xl mb-4">
                🔥
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400 block">
                3. DÍJ
              </span>
              <h3 className="text-lg font-bold font-cinzel text-white">
                A Párbajok Királya
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Az a játékos, aki a legtöbb egyéni párbajgyőzelmet szerezte meg.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800">
              {awards.duelKings.length === 0 ? (
                <span className="text-xs text-zinc-500 italic">Még nincs párbajgyőzelem</span>
              ) : (
                <div className="space-y-2">
                  {awards.duelKings.map((dk) => (
                    <div key={dk.player.id} className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{dk.player.name}</span>
                      <span className="font-mono font-bold text-purple-400 text-base tabular-nums">
                        {dk.wins} győzelem
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AWARD 4: A LEGSZOROSABB PÁRBAJ */}
          <div className="p-6 rounded-2xl bg-[#14101A] border border-red-500/40 shadow-xl flex flex-col justify-between relative overflow-hidden md:col-span-2 lg:col-span-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center text-xl mb-4">
                👻
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-red-400 block">
                4. DÍJ
              </span>
              <h3 className="text-lg font-bold font-cinzel text-white">
                A Legszorosabb Párbaj
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                A párbaj, amelyben a két játékos közötti különbség a legkisebb volt.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800">
              {awards.tightestDuels.length === 0 ? (
                <span className="text-xs text-zinc-500 italic">Még nincs lezárt párbaj</span>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {awards.tightestDuels.map((td, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs"
                    >
                      <span className="text-orange-400 font-mono text-[10px] block uppercase truncate">
                        {td.gameName}
                      </span>
                      <div className="font-semibold text-white mt-1">
                        {td.playerAName} ({td.scoreA}p) vs {td.playerBName} ({td.scoreB}p)
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">
                        Különbség:{' '}
                        <span className="text-red-400 font-bold font-mono">
                          {td.difference === 0 ? '0 pont (Döntetlen!)' : `${td.difference} pont`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AWARD 5: A HALLOWEEN BAJNOKCSAPATA */}
          <div className="p-6 rounded-2xl bg-[#14101A] border border-amber-500/50 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xl mb-4">
                🏆
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block">
                5. DÍJ
              </span>
              <h3 className="text-lg font-bold font-cinzel text-white">
                A Halloween Bajnokcsapata
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                A legtöbb összpontszámot elérő csapat a teljes versenyben.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
              <span className="text-xl font-bold font-cinzel text-amber-400 block">
                {awards.championTeamName}
              </span>
              <span className="text-xs text-zinc-400 font-mono mt-1 block">
                {teamA.totalScore} pont ({teamA.name}) — {teamB.totalScore} pont ({teamB.name})
              </span>
            </div>
          </div>

          {/* AWARD 6: LEGGYORSABB PUZZLE MESTEREK (If played) */}
          {awards.fastestPuzzle && (
            <div className="p-6 rounded-2xl bg-[#14101A] border border-cyan-500/50 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-xl mb-4">
                  🧩
                </div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 block">
                  KÜLÖNDÍJ
                </span>
                <h3 className="text-lg font-bold font-cinzel text-white">
                  A Leggyorsabb Puzzle Mesterek
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  A legrövidebb idő alatt kirakott puzzle csapata.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
                <span className="text-lg font-bold font-cinzel text-cyan-300 block">
                  {awards.fastestPuzzle.winningTeamName}
                </span>
                <span className="text-sm text-zinc-300 font-mono mt-1 block font-bold">
                  ⏱️ {awards.fastestPuzzle.timeSeconds} másodperc
                </span>
                <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block truncate">
                  ({awards.fastestPuzzle.gameName})
                </span>
              </div>
            </div>
          )}

          {/* AWARD 7: AZ ARANY TÖKLÁMPÁS DÍJ (If played) */}
          {awards.bestPumpkinCarver && (
            <div className="p-6 rounded-2xl bg-[#14101A] border border-amber-500/50 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xl mb-4">
                  🎃
                </div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block">
                  KÜLÖNDÍJ
                </span>
                <h3 className="text-lg font-bold font-cinzel text-white">
                  Az Arany Töklámpás Bajnokai
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  A tökfaragó verseny 1. helyezettje (legszebb tök).
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
                <span className="text-lg font-bold font-cinzel text-amber-300 block">
                  {awards.bestPumpkinCarver.pairNames.join(' & ')}
                </span>
                <span className="text-xs text-orange-400 font-mono mt-1 block">
                  {awards.bestPumpkinCarver.teamName} · {awards.bestPumpkinCarver.score} pont
                </span>
                <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block truncate">
                  ({awards.bestPumpkinCarver.gameName})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
