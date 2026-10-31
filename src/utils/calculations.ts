import { GameItem, GameMatch, Player } from '../types/game';

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

export interface HallOfFameAwards {
  championTeam: 'A' | 'B' | 'DRAW';
  championTeamName: string;
  pointKings: { player: Player; points: number }[];
  highestAverages: { player: Player; average: number; played: number }[];
  duelKings: { player: Player; wins: number }[];
  tightestDuels: TightestDuelAward[];
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

  // Iterate over matches
  Object.values(matches).forEach((match) => {
    const game = gameMap.get(match.gameId);
    const gameName = game ? game.name : 'Ismeretlen játék';

    // 1. TELJES CSAPATOS JÁTÉK (TEAM)
    if (match.gameType === 'TEAM' || match.teamRoundA || match.teamRoundB) {
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
      // 2. EGYÉNI PÁRBAJ (DUEL)
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
