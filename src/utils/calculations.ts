import {
  GameItem,
  GameMatch,
  Player,
  PuzzleSettings,
  PumpkinSettings,
  PumpkinPair,
} from '../types/game';

export interface TeamStats {
  name: string;
  code: string; // e.g. "ABCD"
  players: Player[];
  totalScore: number;
  wonGames: number; // includes 0.5 for ties
  drawnGames: number;
  wonDuels: number;
  isLeader: boolean;
  isTie: boolean;
  pointDiff: number;
}

export interface PlayerStats {
  player: Player;
  totalPoints: number;
  duelsPlayed: number;
  duelsWon: number;
  winRate: number; // percentage
  averagePoints: number;
  rank: number;
}

export interface TightestDuelAward {
  gameName: string;
  playerAName: string;
  playerBName: string;
  scoreA: number;
  scoreB: number;
  difference: number;
}

export interface FastestPuzzleAward {
  gameName: string;
  winningTeamName: string;
  timeSeconds: number;
}

export interface BestPumpkinCarverAward {
  gameName: string;
  pairNames: string[];
  teamName: string;
  score: number;
  rank: number;
}

export interface HallOfFameAwards {
  championTeam: 'A' | 'B' | 'DRAW';
  championTeamName: string;
  pointKings: { player: Player; points: number }[];
  highestAverages: { player: Player; average: number; played: number }[];
  duelKings: { player: Player; wins: number }[];
  tightestDuels: TightestDuelAward[];
  fastestPuzzle?: FastestPuzzleAward;
  bestPumpkinCarver?: BestPumpkinCarverAward;
}

/**
 * Generate default team name from the first letter of each player's first name
 * e.g., "Anna", "Béla", "Csilla", "Dávid" -> "ABCD TEAM"
 */
export function generateTeamName(players: Player[]): string {
  if (players.length === 0) return 'TEAM';
  const letters = players
    .map((p) => {
      const trimmed = p.name.trim();
      return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '?';
    })
    .join('');
  return `${letters} TEAM`;
}

/**
 * Pure calculation of team and player statistics from saved matches
 * Supports both TEAM (Teljes csapatos) and DUEL (Egyéni párbaj) game types!
 */
export function calculateAllStats(
  players: Player[],
  games: GameItem[],
  matches: Record<string, GameMatch>,
  teamANameCustom: string | null,
  teamBNameCustom: string | null
): {
  teamA: TeamStats;
  teamB: TeamStats;
  playerStats: PlayerStats[];
  awards: HallOfFameAwards;
} {
  const teamAPlayers = players.filter((p) => p.team === 'A');
  const teamBPlayers = players.filter((p) => p.team === 'B');

  const teamACode = generateTeamName(teamAPlayers);
  const teamBCode = generateTeamName(teamBPlayers);

  const teamAName = teamANameCustom && teamANameCustom.trim() ? teamANameCustom.trim() : teamACode;
  const teamBName = teamBNameCustom && teamBNameCustom.trim() ? teamBNameCustom.trim() : teamBCode;

  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  const gameMap = new Map<string, GameItem>();
  games.forEach((g) => gameMap.set(g.id, g));

  // Initialize player accumulators
  const playerAcc: Record<
    string,
    { totalPoints: number; duelsPlayed: number; duelsWon: number }
  > = {};
  players.forEach((p) => {
    playerAcc[p.id] = { totalPoints: 0, duelsPlayed: 0, duelsWon: 0 };
  });

  let totalScoreA = 0;
  let totalScoreB = 0;
  let wonGamesA = 0;
  let wonGamesB = 0;
  let drawnGames = 0;
  let wonDuelsA = 0;
  let wonDuelsB = 0;

  const completedDuelsList: {
    gameName: string;
    duel: NonNullable<GameMatch['duels']>[0];
  }[] = [];

  let fastestPuzzle: FastestPuzzleAward | undefined = undefined;
  let minPuzzleTime = Infinity;
  let bestPumpkinCarver: BestPumpkinCarverAward | undefined = undefined;

  // Iterate over matches
  Object.values(matches).forEach((match) => {
    const game = gameMap.get(match.gameId);
    const gameName = game ? game.name : 'Ismeretlen játék';

    // 1. PUZZLE-VERSENY (PUZZLE)
    if (match.gameType === 'PUZZLE' || match.puzzleData) {
      const pData = match.puzzleData;
      const scoreA = pData ? pData.scoreA : (match.totalScoreA ?? 0);
      const scoreB = pData ? pData.scoreB : (match.totalScoreB ?? 0);

      if (match.completed || pData?.evaluationFinalized) {
        totalScoreA += scoreA;
        totalScoreB += scoreB;

        if (scoreA > scoreB) {
          wonGamesA += 1;
        } else if (scoreB > scoreA) {
          wonGamesB += 1;
        } else {
          drawnGames += 1;
          wonGamesA += 0.5;
          wonGamesB += 0.5;
        }

        // Track fastest puzzle team award
        const timeA = pData?.teamAElapsedSeconds;
        const timeB = pData?.teamBElapsedSeconds;
        if (timeA || timeB) {
          let winningTime = Infinity;
          let winningTeam = teamAName;
          if (timeA && (!timeB || timeA < timeB)) {
            winningTime = timeA;
            winningTeam = teamAName;
          } else if (timeB && (!timeA || timeB < timeA)) {
            winningTime = timeB;
            winningTeam = teamBName;
          } else if (timeA && timeB) {
            winningTime = timeA;
            winningTeam = `${teamAName} & ${teamBName}`;
          }

          if (winningTime < minPuzzleTime) {
            minPuzzleTime = winningTime;
            fastestPuzzle = {
              gameName,
              winningTeamName: winningTeam,
              timeSeconds: winningTime,
            };
          }
        }
      }
    }
    // 2. TÖKFARAGÓ VERSENY (PUMPKIN)
    else if (match.gameType === 'PUMPKIN' || match.pumpkinData) {
      const pData = match.pumpkinData;
      const scoreA = pData ? pData.scoreA : (match.totalScoreA ?? 0);
      const scoreB = pData ? pData.scoreB : (match.totalScoreB ?? 0);

      if (match.completed || pData?.evaluationFinalized) {
        totalScoreA += scoreA;
        totalScoreB += scoreB;

        if (scoreA > scoreB) {
          wonGamesA += 1;
        } else if (scoreB > scoreA) {
          wonGamesB += 1;
        } else {
          drawnGames += 1;
          wonGamesA += 0.5;
          wonGamesB += 0.5;
        }

        // Track 1st place pumpkin carver pair
        if (pData?.pairs && !bestPumpkinCarver) {
          const rank1Pairs = pData.pairs.filter((pair) => pair.rank === 1);
          if (rank1Pairs.length > 0) {
            const firstPair = rank1Pairs[0];
            const p1 = playerMap.get(firstPair.playerIds[0]);
            const p2 = playerMap.get(firstPair.playerIds[1]);
            const pairTeamName = firstPair.team === 'A' ? teamAName : teamBName;
            bestPumpkinCarver = {
              gameName,
              pairNames: [p1 ? p1.name : 'Játékos 1', p2 ? p2.name : 'Játékos 2'],
              teamName: pairTeamName,
              score: firstPair.score,
              rank: 1,
            };
          }
        }
      }
    }
    // 3. TELJES CSAPATOS JÁTÉK (TEAM)
    else if (match.gameType === 'TEAM' || match.teamRoundA || match.teamRoundB) {
      const roundA = match.teamRoundA;
      const roundB = match.teamRoundB;

      const scoreA = roundA ? roundA.totalScore : (match.totalScoreA ?? 0);
      const scoreB = roundB ? roundB.totalScore : (match.totalScoreB ?? 0);

      if (roundA?.completed || match.completed) {
        totalScoreA += scoreA;
        // Distribute or accumulate individual player points for Team A
        teamAPlayers.forEach((p) => {
          const individualPts = roundA?.playerScores?.[p.id];
          if (individualPts !== undefined) {
            playerAcc[p.id].totalPoints += individualPts;
            playerAcc[p.id].duelsPlayed += 1;
          } else if (scoreA > 0 && roundA?.completed) {
            // If direct team score without individual breakdown, give each 1/4 share (rounded)
            const share = Math.round((scoreA / 4) * 10) / 10;
            playerAcc[p.id].totalPoints += share;
            playerAcc[p.id].duelsPlayed += 1;
          }
        });
      }

      if (roundB?.completed || match.completed) {
        totalScoreB += scoreB;
        // Distribute or accumulate individual player points for Team B
        teamBPlayers.forEach((p) => {
          const individualPts = roundB?.playerScores?.[p.id];
          if (individualPts !== undefined) {
            playerAcc[p.id].totalPoints += individualPts;
            playerAcc[p.id].duelsPlayed += 1;
          } else if (scoreB > 0 && roundB?.completed) {
            const share = Math.round((scoreB / 4) * 10) / 10;
            playerAcc[p.id].totalPoints += share;
            playerAcc[p.id].duelsPlayed += 1;
          }
        });
      }

      // Check game completion and awards
      if (match.completed) {
        if (scoreA > scoreB) {
          wonGamesA += 1;
        } else if (scoreB > scoreA) {
          wonGamesB += 1;
        } else {
          drawnGames += 1;
          wonGamesA += 0.5;
          wonGamesB += 0.5;
        }
      }
    } else {
      // 4. EGYÉNI PÁRBAJ (DUEL)
      let matchScoreA = 0;
      let matchScoreB = 0;
      let matchCompletedDuels = 0;

      if (match.duels && Array.isArray(match.duels)) {
        match.duels.forEach((duel) => {
          if (duel.completed && duel.scoreA !== null && duel.scoreB !== null) {
            matchCompletedDuels++;
            matchScoreA += duel.scoreA;
            matchScoreB += duel.scoreB;
            totalScoreA += duel.scoreA;
            totalScoreB += duel.scoreB;

            // Player A accum
            if (playerAcc[duel.playerAId]) {
              playerAcc[duel.playerAId].totalPoints += duel.scoreA;
              playerAcc[duel.playerAId].duelsPlayed += 1;
              if (duel.scoreA > duel.scoreB) {
                playerAcc[duel.playerAId].duelsWon += 1;
                wonDuelsA += 1;
              }
            }

            // Player B accum
            if (playerAcc[duel.playerBId]) {
              playerAcc[duel.playerBId].totalPoints += duel.scoreB;
              playerAcc[duel.playerBId].duelsPlayed += 1;
              if (duel.scoreB > duel.scoreA) {
                playerAcc[duel.playerBId].duelsWon += 1;
                wonDuelsB += 1;
              }
            }

            completedDuelsList.push({ gameName, duel });
          }
        });
      }

      // Check if match was fully completed
      if (match.completed || matchCompletedDuels === 4) {
        if (matchScoreA > matchScoreB) {
          wonGamesA += 1;
        } else if (matchScoreB > matchScoreA) {
          wonGamesB += 1;
        } else {
          drawnGames += 1;
          wonGamesA += 0.5;
          wonGamesB += 0.5;
        }
      }
    }
  });

  const isTie = totalScoreA === totalScoreB;
  const isLeaderA = totalScoreA > totalScoreB;
  const isLeaderB = totalScoreB > totalScoreA;

  const teamA: TeamStats = {
    name: teamAName,
    code: teamACode,
    players: teamAPlayers,
    totalScore: Math.round(totalScoreA * 10) / 10,
    wonGames: wonGamesA,
    drawnGames: drawnGames,
    wonDuels: wonDuelsA,
    isLeader: isLeaderA,
    isTie: isTie,
    pointDiff: Math.round(Math.abs(totalScoreA - totalScoreB) * 10) / 10,
  };

  const teamB: TeamStats = {
    name: teamBName,
    code: teamBCode,
    players: teamBPlayers,
    totalScore: Math.round(totalScoreB * 10) / 10,
    wonGames: wonGamesB,
    drawnGames: drawnGames,
    wonDuels: wonDuelsB,
    isLeader: isLeaderB,
    isTie: isTie,
    pointDiff: Math.round(Math.abs(totalScoreA - totalScoreB) * 10) / 10,
  };

  // Compile individual player stats
  const rawPlayerStats: PlayerStats[] = players.map((p) => {
    const acc = playerAcc[p.id] || { totalPoints: 0, duelsPlayed: 0, duelsWon: 0 };
    const winRate = acc.duelsPlayed > 0 ? (acc.duelsWon / acc.duelsPlayed) * 100 : 0;
    const averagePoints = acc.duelsPlayed > 0 ? acc.totalPoints / acc.duelsPlayed : 0;
    return {
      player: p,
      totalPoints: Math.round(acc.totalPoints * 10) / 10,
      duelsPlayed: acc.duelsPlayed,
      duelsWon: acc.duelsWon,
      winRate: Math.round(winRate * 10) / 10,
      averagePoints: Math.round(averagePoints * 10) / 10,
      rank: 1,
    };
  });

  // Sort by totalPoints desc, then duelsWon desc, then averagePoints desc
  rawPlayerStats.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.duelsWon !== a.duelsWon) return b.duelsWon - a.duelsWon;
    return b.averagePoints - a.averagePoints;
  });

  // Assign rankings (handle ties)
  for (let i = 0; i < rawPlayerStats.length; i++) {
    if (i > 0) {
      const prev = rawPlayerStats[i - 1];
      const curr = rawPlayerStats[i];
      if (
        curr.totalPoints === prev.totalPoints &&
        curr.duelsWon === prev.duelsWon &&
        curr.averagePoints === prev.averagePoints
      ) {
        curr.rank = prev.rank;
      } else {
        curr.rank = i + 1;
      }
    } else {
      rawPlayerStats[0].rank = 1;
    }
  }

  // Calculate Hall of Fame awards
  let championTeam: 'A' | 'B' | 'DRAW' = 'DRAW';
  let championTeamName = 'Döntetlen';
  if (totalScoreA > totalScoreB) {
    championTeam = 'A';
    championTeamName = teamAName;
  } else if (totalScoreB > totalScoreA) {
    championTeam = 'B';
    championTeamName = teamBName;
  } else {
    championTeamName = `${teamAName} & ${teamBName}`;
  }

  // Point Kings
  let maxPoints = -1;
  rawPlayerStats.forEach((ps) => {
    if (ps.totalPoints > maxPoints) maxPoints = ps.totalPoints;
  });
  const pointKings =
    maxPoints > 0
      ? rawPlayerStats
          .filter((ps) => ps.totalPoints === maxPoints)
          .map((ps) => ({ player: ps.player, points: ps.totalPoints }))
      : [];

  // Highest Averages (min 1 duel / game played)
  const playersWithDuels = rawPlayerStats.filter((ps) => ps.duelsPlayed > 0);
  let maxAverage = -1;
  playersWithDuels.forEach((ps) => {
    if (ps.averagePoints > maxAverage) maxAverage = ps.averagePoints;
  });
  const highestAverages =
    maxAverage >= 0
      ? playersWithDuels
          .filter((ps) => ps.averagePoints === maxAverage)
          .map((ps) => ({
            player: ps.player,
            average: ps.averagePoints,
            played: ps.duelsPlayed,
          }))
      : [];

  // Duel Kings
  let maxWins = -1;
  rawPlayerStats.forEach((ps) => {
    if (ps.duelsWon > maxWins) maxWins = ps.duelsWon;
  });
  const duelKings =
    maxWins > 0
      ? rawPlayerStats
          .filter((ps) => ps.duelsWon === maxWins)
          .map((ps) => ({ player: ps.player, wins: ps.duelsWon }))
      : [];

  // Tightest Duels
  let tightestDuels: TightestDuelAward[] = [];
  if (completedDuelsList.length > 0) {
    let minDiff = Infinity;
    completedDuelsList.forEach(({ duel }) => {
      const diff = Math.abs((duel.scoreA ?? 0) - (duel.scoreB ?? 0));
      if (diff < minDiff) minDiff = diff;
    });

    tightestDuels = completedDuelsList
      .filter(({ duel }) => Math.abs((duel.scoreA ?? 0) - (duel.scoreB ?? 0)) === minDiff)
      .map(({ gameName, duel }) => {
        const playerA = playerMap.get(duel.playerAId);
        const playerB = playerMap.get(duel.playerBId);
        return {
          gameName,
          playerAName: playerA ? playerA.name : 'A Játékos',
          playerBName: playerB ? playerB.name : 'B Játékos',
          scoreA: duel.scoreA ?? 0,
          scoreB: duel.scoreB ?? 0,
          difference: minDiff,
        };
      });
  }

  const awards: HallOfFameAwards = {
    championTeam,
    championTeamName,
    pointKings,
    highestAverages,
    duelKings,
    tightestDuels,
    fastestPuzzle,
    bestPumpkinCarver,
  };

  return {
    teamA,
    teamB,
    playerStats: rawPlayerStats,
    awards,
  };
}

/**
 * Pre-generate the 4 duels for an active DUEL game by shuffling Team A and Team B players.
 * Guarantees each player participates in exactly 1 duel.
 */
export function generateFourDuels(
  gameId: string,
  players: Player[]
): GameMatch {
  const teamAPlayers = [...players.filter((p) => p.team === 'A')];
  const teamBPlayers = [...players.filter((p) => p.team === 'B')];

  // Fisher-Yates shuffle
  for (let i = teamAPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [teamAPlayers[i], teamAPlayers[j]] = [teamAPlayers[j], teamAPlayers[i]];
  }
  for (let i = teamBPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [teamBPlayers[i], teamBPlayers[j]] = [teamBPlayers[j], teamBPlayers[i]];
  }

  const duels: GameMatch['duels'] = [1, 2, 3, 4].map((num, idx) => ({
    id: `${gameId}_duel_${num}_${Date.now()}_${idx}`,
    duelNumber: num as 1 | 2 | 3 | 4,
    playerAId: teamAPlayers[idx]?.id || '',
    playerBId: teamBPlayers[idx]?.id || '',
    scoreA: null,
    scoreB: null,
    winnerPlayerId: null,
    completed: false,
  }));

  return {
    gameId,
    gameType: 'DUEL',
    duels,
    winnerTeam: null,
    totalScoreA: 0,
    totalScoreB: 0,
    completed: false,
  };
}

/**
 * Pre-generate match state for a TELJES CSAPATOS (TEAM) game.
 */
export function generateTeamMatch(
  gameId: string
): GameMatch {
  return {
    gameId,
    gameType: 'TEAM',
    duels: [],
    teamRoundA: {
      team: 'A',
      totalScore: 0,
      playerScores: {},
      completed: false,
    },
    teamRoundB: {
      team: 'B',
      totalScore: 0,
      playerScores: {},
      completed: false,
    },
    winnerTeam: null,
    totalScoreA: 0,
    totalScoreB: 0,
    completed: false,
  };
}

/**
 * Pre-generate match state for a PUZZLE-VERSENY (PUZZLE) game.
 * Features parallel stopwatches for Team A and Team B.
 */
export function generatePuzzleMatch(
  gameId: string,
  customSettings?: Partial<PuzzleSettings>
): GameMatch {
  const defaultSettings: PuzzleSettings = {
    hasTimeLimit: false,
    timeLimitSeconds: 300,
    winPoints: 100,
    losePoints: 25,
    drawPoints: 50,
  };

  const settings: PuzzleSettings = {
    ...defaultSettings,
    ...(customSettings || {}),
  };

  return {
    gameId,
    gameType: 'PUZZLE',
    duels: [],
    puzzleData: {
      settings,
      timerRunning: false,
      startTime: null,
      elapsedBeforePause: 0,
      isPaused: false,
      teamAFinished: false,
      teamAElapsedSeconds: null,
      teamBFinished: false,
      teamBElapsedSeconds: null,
      scoreA: 0,
      scoreB: 0,
      winnerTeam: null,
      evaluationFinalized: false,
    },
    winnerTeam: null,
    totalScoreA: 0,
    totalScoreB: 0,
    completed: false,
  };
}

/**
 * Pre-generate match state for a TÖKFARAGÓ VERSENY (PUMPKIN) game.
 * Splits existing Team A into 2 pairs and Team B into 2 pairs (4 pairs total).
 */
export function generatePumpkinMatch(
  gameId: string,
  players: Player[],
  customSettings?: Partial<PumpkinSettings>
): GameMatch {
  const teamAPlayers = [...players.filter((p) => p.team === 'A')];
  const teamBPlayers = [...players.filter((p) => p.team === 'B')];

  // Fisher-Yates shuffle within team
  for (let i = teamAPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [teamAPlayers[i], teamAPlayers[j]] = [teamAPlayers[j], teamAPlayers[i]];
  }
  for (let i = teamBPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [teamBPlayers[i], teamBPlayers[j]] = [teamBPlayers[j], teamBPlayers[i]];
  }

  const pairs: PumpkinPair[] = [
    {
      id: `${gameId}_pair_A1`,
      team: 'A',
      pairNumber: 1,
      playerIds: [teamAPlayers[0]?.id || '', teamAPlayers[1]?.id || ''],
      rank: null,
      score: 0,
    },
    {
      id: `${gameId}_pair_A2`,
      team: 'A',
      pairNumber: 2,
      playerIds: [teamAPlayers[2]?.id || '', teamAPlayers[3]?.id || ''],
      rank: null,
      score: 0,
    },
    {
      id: `${gameId}_pair_B1`,
      team: 'B',
      pairNumber: 1,
      playerIds: [teamBPlayers[0]?.id || '', teamBPlayers[1]?.id || ''],
      rank: null,
      score: 0,
    },
    {
      id: `${gameId}_pair_B2`,
      team: 'B',
      pairNumber: 2,
      playerIds: [teamBPlayers[2]?.id || '', teamBPlayers[3]?.id || ''],
      rank: null,
      score: 0,
    },
  ];

  const defaultSettings: PumpkinSettings = {
    hasTimeLimit: true,
    timeLimitSeconds: 1800, // 30 minutes
    rankPoints: {
      1: 100,
      2: 75,
      3: 50,
      4: 25,
    },
    drawPoints: 50,
  };

  const settings: PumpkinSettings = {
    ...defaultSettings,
    ...(customSettings || {}),
    rankPoints: {
      ...defaultSettings.rankPoints,
      ...(customSettings?.rankPoints || {}),
    },
  };

  return {
    gameId,
    gameType: 'PUMPKIN',
    duels: [],
    pumpkinData: {
      settings,
      pairs,
      timerRunning: false,
      startTime: null,
      elapsedBeforePause: 0,
      isPaused: false,
      evaluationFinalized: false,
      scoreA: 0,
      scoreB: 0,
      winnerTeam: null,
    },
    winnerTeam: null,
    totalScoreA: 0,
    totalScoreB: 0,
    completed: false,
  };
}
