import prisma from "@/lib/prisma";

// Type definitions for report data
export interface AuctionSummaryData {
  auction: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    minPlayersPerTeam: number;
    maxPlayersPerTeam: number;
    minPlayerPrice: number;
  };
  statistics: {
    totalPlayers: number;
    soldPlayers: number;
    unsoldPlayers: number;
    totalPurse: number;
    totalSpent: number;
    averagePlayerPrice: number;
    highestSoldPrice: number;
    lowestSoldPrice: number;
    mostExpensivePlayer: {
      name: string;
      role: string;
      price: number;
      team: string;
    } | null;
  };
  teamsSummary: Array<{
    id: string;
    name: string;
    playerCount: number;
    initialBudget: number;
    remainingBudget: number;
    spent: number;
    budgetUtilization: number;
  }>;
}

export interface TeamDetailedData {
  team: {
    id: string;
    name: string;
    color: string | null;
    logo: string | null;
    initialBudget: number;
    remainingBudget: number;
    ownerName: string | null;
  };
  statistics: {
    playerCount: number;
    totalSpent: number;
    budgetUtilization: number;
    averagePlayerCost: number;
    mostExpensivePlayer: {
      name: string;
      role: string;
      price: number;
    } | null;
  };
  players: Array<{
    id: string;
    name: string;
    role: string;
    basePrice: number;
    soldPrice: number;
    stats: any;
  }>;
  roleDistribution: {
    BATSMAN: number;
    BOWLER: number;
    ALL_ROUNDER: number;
    WICKET_KEEPER: number;
  };
}

export interface PlayerAuctionData {
  auction: {
    id: string;
    name: string;
    status: string;
  };
  soldPlayers: Array<{
    id: string;
    name: string;
    role: string;
    basePrice: number;
    soldPrice: number;
    team: {
      id: string;
      name: string;
    };
    bidCount: number;
  }>;
  unsoldPlayers: Array<{
    id: string;
    name: string;
    role: string;
    basePrice: number;
  }>;
  roleStats: {
    role: string;
    total: number;
    sold: number;
    avgPrice: number;
  }[];
}

export interface BiddingHistoryData {
  auction: {
    id: string;
    name: string;
  };
  allBids: Array<{
    id: string;
    amount: number;
    createdAt: Date;
    player: {
      id: string;
      name: string;
      role: string;
    };
    team: {
      id: string;
      name: string;
    };
  }>;
  teamBiddingStats: Array<{
    teamId: string;
    teamName: string;
    totalBids: number;
    successfulBids: number;
    successRate: number;
    totalBidAmount: number;
  }>;
}

export interface BudgetAnalysisData {
  auction: {
    id: string;
    name: string;
  };
  teams: Array<{
    id: string;
    name: string;
    initialBudget: number;
    remainingBudget: number;
    spent: number;
    budgetUtilization: number;
    playerCount: number;
    avgPlayerCost: number;
  }>;
  roleSpending: {
    role: string;
    totalSpent: number;
    playerCount: number;
    avgCost: number;
  }[];
  priceDistribution: {
    range: string;
    count: number;
  }[];
}

/**
 * Get Auction Summary Report Data
 */
export async function getAuctionSummaryData(auctionId: string): Promise<AuctionSummaryData> {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      teams: {
        include: {
          _count: {
            select: {
              players: true,
            },
          },
        },
      },
      players: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!auction) {
    throw new Error("Auction not found");
  }

  const soldPlayers = auction.players.filter((p) => p.status === "SOLD");
  const unsoldPlayers = auction.players.filter((p) => p.status === "UNSOLD");

  const soldPrices = soldPlayers
    .map((p) => p.soldPrice)
    .filter((price): price is number => price !== null);

  const totalSpent = soldPrices.reduce((sum, price) => sum + price, 0);
  const totalPurse = auction.teams.reduce((sum, team) => sum + team.initialBudget, 0);

  const mostExpensivePlayer = soldPlayers.reduce(
    (max, player) => {
      if (!player.soldPrice) return max;
      if (!max || player.soldPrice > (max.soldPrice || 0)) {
        return player;
      }
      return max;
    },
    null as typeof soldPlayers[0] | null
  );

  const teamsSummary = auction.teams.map((team) => ({
    id: team.id,
    name: team.name,
    playerCount: team._count.players,
    initialBudget: team.initialBudget,
    remainingBudget: team.remainingBudget,
    spent: team.initialBudget - team.remainingBudget,
    budgetUtilization: ((team.initialBudget - team.remainingBudget) / team.initialBudget) * 100,
  }));

  return {
    auction: {
      id: auction.id,
      name: auction.name,
      status: auction.status,
      createdAt: auction.createdAt,
      minPlayersPerTeam: auction.minPlayersPerTeam,
      maxPlayersPerTeam: auction.maxPlayersPerTeam,
      minPlayerPrice: auction.minPlayerPrice,
    },
    statistics: {
      totalPlayers: auction.players.length,
      soldPlayers: soldPlayers.length,
      unsoldPlayers: unsoldPlayers.length,
      totalPurse,
      totalSpent,
      averagePlayerPrice: soldPrices.length > 0 ? totalSpent / soldPrices.length : 0,
      highestSoldPrice: soldPrices.length > 0 ? Math.max(...soldPrices) : 0,
      lowestSoldPrice: soldPrices.length > 0 ? Math.min(...soldPrices) : 0,
      mostExpensivePlayer: mostExpensivePlayer
        ? {
            name: mostExpensivePlayer.name,
            role: mostExpensivePlayer.role,
            price: mostExpensivePlayer.soldPrice || 0,
            team: mostExpensivePlayer.team?.name || "Unknown",
          }
        : null,
    },
    teamsSummary,
  };
}

/**
 * Get Team Detailed Report Data
 */
export async function getTeamDetailedData(teamId: string): Promise<TeamDetailedData> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: {
        select: {
          name: true,
        },
      },
      players: {
        where: {
          status: "SOLD",
        },
        orderBy: {
          soldPrice: "desc",
        },
      },
    },
  });

  if (!team) {
    throw new Error("Team not found");
  }

  const playerCount = team.players.length;
  const totalSpent = team.initialBudget - team.remainingBudget;
  const budgetUtilization = (totalSpent / team.initialBudget) * 100;
  const averagePlayerCost = playerCount > 0 ? totalSpent / playerCount : 0;

  const mostExpensivePlayer = team.players.reduce(
    (max, player) => {
      if (!player.soldPrice) return max;
      if (!max || player.soldPrice > (max.soldPrice || 0)) {
        return player;
      }
      return max;
    },
    null as typeof team.players[0] | null
  );

  const roleDistribution = team.players.reduce(
    (acc, player) => {
      acc[player.role as keyof typeof acc] = (acc[player.role as keyof typeof acc] || 0) + 1;
      return acc;
    },
    {
      BATSMAN: 0,
      BOWLER: 0,
      ALL_ROUNDER: 0,
      WICKET_KEEPER: 0,
    }
  );

  return {
    team: {
      id: team.id,
      name: team.name,
      color: team.color,
      logo: team.logo,
      initialBudget: team.initialBudget,
      remainingBudget: team.remainingBudget,
      ownerName: team.owner?.name || null,
    },
    statistics: {
      playerCount,
      totalSpent,
      budgetUtilization,
      averagePlayerCost,
      mostExpensivePlayer: mostExpensivePlayer
        ? {
            name: mostExpensivePlayer.name,
            role: mostExpensivePlayer.role,
            price: mostExpensivePlayer.soldPrice || 0,
          }
        : null,
    },
    players: team.players.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      basePrice: p.basePrice,
      soldPrice: p.soldPrice || 0,
      stats: p.stats,
    })),
    roleDistribution,
  };
}

/**
 * Get Player Auction Report Data
 */
export async function getPlayerAuctionData(auctionId: string): Promise<PlayerAuctionData> {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      players: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          bids: true,
        },
        orderBy: {
          soldPrice: "desc",
        },
      },
    },
  });

  if (!auction) {
    throw new Error("Auction not found");
  }

  const soldPlayers = auction.players
    .filter((p) => p.status === "SOLD")
    .map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      basePrice: p.basePrice,
      soldPrice: p.soldPrice || 0,
      team: {
        id: p.team?.id || "",
        name: p.team?.name || "Unknown",
      },
      bidCount: p.bids.length,
    }));

  const unsoldPlayers = auction.players
    .filter((p) => p.status === "UNSOLD")
    .map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      basePrice: p.basePrice,
    }));

  // Calculate role-wise statistics
  const roleStats = Object.entries(
    auction.players.reduce((acc, player) => {
      if (!acc[player.role]) {
        acc[player.role] = { total: 0, sold: 0, totalPrice: 0 };
      }
      acc[player.role].total += 1;
      if (player.status === "SOLD") {
        acc[player.role].sold += 1;
        acc[player.role].totalPrice += player.soldPrice || 0;
      }
      return acc;
    }, {} as Record<string, { total: number; sold: number; totalPrice: number }>)
  ).map(([role, stats]) => ({
    role,
    total: stats.total,
    sold: stats.sold,
    avgPrice: stats.sold > 0 ? stats.totalPrice / stats.sold : 0,
  }));

  return {
    auction: {
      id: auction.id,
      name: auction.name,
      status: auction.status,
    },
    soldPlayers,
    unsoldPlayers,
    roleStats,
  };
}

/**
 * Get Bidding History Report Data
 */
export async function getBiddingHistoryData(auctionId: string): Promise<BiddingHistoryData> {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!auction) {
    throw new Error("Auction not found");
  }

  const allBids = await prisma.bid.findMany({
    where: { auctionId },
    include: {
      player: {
        select: {
          id: true,
          name: true,
          role: true,
          status: true,
          teamId: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate team bidding statistics
  const teamStatsMap = new Map<
    string,
    { teamName: string; totalBids: number; successfulBids: number; totalBidAmount: number }
  >();

  allBids.forEach((bid) => {
    const stats = teamStatsMap.get(bid.teamId) || {
      teamName: bid.team.name,
      totalBids: 0,
      successfulBids: 0,
      totalBidAmount: 0,
    };

    stats.totalBids += 1;
    stats.totalBidAmount += bid.amount;

    // Check if this bid won the player
    if (bid.player.status === "SOLD" && bid.player.teamId === bid.teamId) {
      stats.successfulBids += 1;
    }

    teamStatsMap.set(bid.teamId, stats);
  });

  const teamBiddingStats = Array.from(teamStatsMap.entries()).map(([teamId, stats]) => ({
    teamId,
    teamName: stats.teamName,
    totalBids: stats.totalBids,
    successfulBids: stats.successfulBids,
    successRate: (stats.successfulBids / stats.totalBids) * 100,
    totalBidAmount: stats.totalBidAmount,
  }));

  return {
    auction,
    allBids: allBids.map((bid) => ({
      id: bid.id,
      amount: bid.amount,
      createdAt: bid.createdAt,
      player: {
        id: bid.player.id,
        name: bid.player.name,
        role: bid.player.role,
      },
      team: {
        id: bid.team.id,
        name: bid.team.name,
      },
    })),
    teamBiddingStats,
  };
}

/**
 * Get Budget Analysis Report Data
 */
export async function getBudgetAnalysisData(auctionId: string): Promise<BudgetAnalysisData> {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      teams: {
        include: {
          players: {
            where: {
              status: "SOLD",
            },
          },
        },
      },
      players: {
        where: {
          status: "SOLD",
        },
      },
    },
  });

  if (!auction) {
    throw new Error("Auction not found");
  }

  const teams = auction.teams.map((team) => {
    const spent = team.initialBudget - team.remainingBudget;
    const playerCount = team.players.length;
    return {
      id: team.id,
      name: team.name,
      initialBudget: team.initialBudget,
      remainingBudget: team.remainingBudget,
      spent,
      budgetUtilization: (spent / team.initialBudget) * 100,
      playerCount,
      avgPlayerCost: playerCount > 0 ? spent / playerCount : 0,
    };
  });

  // Role-wise spending
  const roleSpending = Object.entries(
    auction.players.reduce((acc, player) => {
      if (!acc[player.role]) {
        acc[player.role] = { totalSpent: 0, playerCount: 0 };
      }
      acc[player.role].totalSpent += player.soldPrice || 0;
      acc[player.role].playerCount += 1;
      return acc;
    }, {} as Record<string, { totalSpent: number; playerCount: number }>)
  ).map(([role, data]) => ({
    role,
    totalSpent: data.totalSpent,
    playerCount: data.playerCount,
    avgCost: data.playerCount > 0 ? data.totalSpent / data.playerCount : 0,
  }));

  // Price distribution
  const priceRanges = [
    { min: 0, max: 500000, label: "0-5L" },
    { min: 500000, max: 1000000, label: "5-10L" },
    { min: 1000000, max: 2000000, label: "10-20L" },
    { min: 2000000, max: 5000000, label: "20-50L" },
    { min: 5000000, max: 10000000, label: "50L-1Cr" },
    { min: 10000000, max: Infinity, label: "1Cr+" },
  ];

  const priceDistribution = priceRanges.map((range) => ({
    range: range.label,
    count: auction.players.filter(
      (p) => p.soldPrice && p.soldPrice >= range.min && p.soldPrice < range.max
    ).length,
  }));

  return {
    auction: {
      id: auction.id,
      name: auction.name,
    },
    teams,
    roleSpending,
    priceDistribution,
  };
}

/**
 * Comprehensive Report Data - Combines all reports
 */
export interface ComprehensiveReportData {
  auction: {
    id: string;
    name: string;
    sport: string;
    status: string;
    createdAt: Date;
    minPlayersPerTeam: number;
    maxPlayersPerTeam: number;
    minPlayerPrice: number;
    minBidIncrement: number;
  };
  statistics: {
    totalPlayers: number;
    soldPlayers: number;
    unsoldPlayers: number;
    totalPurse: number;
    totalSpent: number;
    averagePlayerPrice: number;
    highestSoldPrice: number;
    lowestSoldPrice: number;
    mostExpensivePlayer: {
      name: string;
      role: string;
      price: number;
      team: string;
    } | null;
  };
  teamsWithPlayers: Array<{
    id: string;
    name: string;
    ownerName: string | null;
    initialBudget: number;
    remainingBudget: number;
    spent: number;
    budgetUtilization: number;
    playerCount: number;
    avgPlayerCost: number;
    players: Array<{
      id: string;
      name: string;
      role: string;
      basePrice: number;
      soldPrice: number;
    }>;
    roleDistribution: {
      BATSMAN: number;
      BOWLER: number;
      ALL_ROUNDER: number;
      WICKET_KEEPER: number;
    };
  }>;
  soldPlayers: Array<{
    id: string;
    name: string;
    role: string;
    basePrice: number;
    soldPrice: number;
    team: {
      id: string;
      name: string;
    };
    bidCount: number;
  }>;
  unsoldPlayers: Array<{
    id: string;
    name: string;
    role: string;
    basePrice: number;
  }>;
  roleStats: {
    role: string;
    total: number;
    sold: number;
    avgPrice: number;
  }[];
  roleSpending: {
    role: string;
    totalSpent: number;
    playerCount: number;
    avgCost: number;
  }[];
  priceDistribution: {
    range: string;
    count: number;
  }[];
  teamBiddingStats: Array<{
    teamId: string;
    teamName: string;
    totalBids: number;
    successfulBids: number;
    successRate: number;
    totalBidAmount: number;
  }>;
  recentBids: Array<{
    id: string;
    amount: number;
    createdAt: Date;
    player: {
      id: string;
      name: string;
      role: string;
    };
    team: {
      id: string;
      name: string;
    };
  }>;
  top10MostExpensivePlayers: Array<{
    id: string;
    name: string;
    role: string;
    basePrice: number;
    soldPrice: number;
    team: {
      id: string;
      name: string;
    };
  }>;
}

/**
 * Get Comprehensive Report Data - All reports combined
 */
export async function getComprehensiveReportData(
  auctionId: string
): Promise<ComprehensiveReportData> {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      teams: {
        include: {
          owner: {
            select: {
              name: true,
            },
          },
          players: {
            where: {
              status: "SOLD",
            },
            orderBy: {
              soldPrice: "desc",
            },
          },
        },
      },
      players: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          bids: true,
        },
        orderBy: {
          soldPrice: "desc",
        },
      },
    },
  });

  if (!auction) {
    throw new Error("Auction not found");
  }

  const soldPlayers = auction.players.filter((p) => p.status === "SOLD");
  const unsoldPlayers = auction.players.filter((p) => p.status === "UNSOLD");

  const soldPrices = soldPlayers
    .map((p) => p.soldPrice)
    .filter((price): price is number => price !== null);

  const totalSpent = soldPrices.reduce((sum, price) => sum + price, 0);
  const totalPurse = auction.teams.reduce((sum, team) => sum + team.initialBudget, 0);

  const mostExpensivePlayer = soldPlayers.reduce(
    (max, player) => {
      if (!player.soldPrice) return max;
      if (!max || player.soldPrice > (max.soldPrice || 0)) {
        return player;
      }
      return max;
    },
    null as typeof soldPlayers[0] | null
  );

  // Teams with players
  const teamsWithPlayers = auction.teams.map((team) => {
    const spent = team.initialBudget - team.remainingBudget;
    const playerCount = team.players.length;

    const roleDistribution = team.players.reduce(
      (acc, player) => {
        acc[player.role as keyof typeof acc] = (acc[player.role as keyof typeof acc] || 0) + 1;
        return acc;
      },
      {
        BATSMAN: 0,
        BOWLER: 0,
        ALL_ROUNDER: 0,
        WICKET_KEEPER: 0,
      }
    );

    return {
      id: team.id,
      name: team.name,
      ownerName: team.owner?.name || null,
      initialBudget: team.initialBudget,
      remainingBudget: team.remainingBudget,
      spent,
      budgetUtilization: (spent / team.initialBudget) * 100,
      playerCount,
      avgPlayerCost: playerCount > 0 ? spent / playerCount : 0,
      players: team.players.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        basePrice: p.basePrice,
        soldPrice: p.soldPrice || 0,
      })),
      roleDistribution,
    };
  });

  // Sold players with bid count
  const soldPlayersData = soldPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    basePrice: p.basePrice,
    soldPrice: p.soldPrice || 0,
    team: {
      id: p.team?.id || "",
      name: p.team?.name || "Unknown",
    },
    bidCount: p.bids.length,
  }));

  // Unsold players
  const unsoldPlayersData = unsoldPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    basePrice: p.basePrice,
  }));

  // Role-wise statistics
  const roleStats = Object.entries(
    auction.players.reduce((acc, player) => {
      if (!acc[player.role]) {
        acc[player.role] = { total: 0, sold: 0, totalPrice: 0 };
      }
      acc[player.role].total += 1;
      if (player.status === "SOLD") {
        acc[player.role].sold += 1;
        acc[player.role].totalPrice += player.soldPrice || 0;
      }
      return acc;
    }, {} as Record<string, { total: number; sold: number; totalPrice: number }>)
  ).map(([role, stats]) => ({
    role,
    total: stats.total,
    sold: stats.sold,
    avgPrice: stats.sold > 0 ? stats.totalPrice / stats.sold : 0,
  }));

  // Role-wise spending
  const roleSpending = Object.entries(
    soldPlayers.reduce((acc, player) => {
      if (!acc[player.role]) {
        acc[player.role] = { totalSpent: 0, playerCount: 0 };
      }
      acc[player.role].totalSpent += player.soldPrice || 0;
      acc[player.role].playerCount += 1;
      return acc;
    }, {} as Record<string, { totalSpent: number; playerCount: number }>)
  ).map(([role, data]) => ({
    role,
    totalSpent: data.totalSpent,
    playerCount: data.playerCount,
    avgCost: data.playerCount > 0 ? data.totalSpent / data.playerCount : 0,
  }));

  // Price distribution
  const priceRanges = [
    { min: 0, max: 500000, label: "0-5L" },
    { min: 500000, max: 1000000, label: "5-10L" },
    { min: 1000000, max: 2000000, label: "10-20L" },
    { min: 2000000, max: 5000000, label: "20-50L" },
    { min: 5000000, max: 10000000, label: "50L-1Cr" },
    { min: 10000000, max: Infinity, label: "1Cr+" },
  ];

  const priceDistribution = priceRanges.map((range) => ({
    range: range.label,
    count: soldPlayers.filter(
      (p) => p.soldPrice && p.soldPrice >= range.min && p.soldPrice < range.max
    ).length,
  }));

  // Get bidding data
  const allBids = await prisma.bid.findMany({
    where: { auctionId },
    include: {
      player: {
        select: {
          id: true,
          name: true,
          role: true,
          status: true,
          teamId: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100, // Limit to recent 100 bids
  });

  // Team bidding statistics
  const teamStatsMap = new Map<
    string,
    { teamName: string; totalBids: number; successfulBids: number; totalBidAmount: number }
  >();

  const allFullBids = await prisma.bid.findMany({
    where: { auctionId },
    include: {
      player: {
        select: {
          status: true,
          teamId: true,
        },
      },
      team: {
        select: {
          name: true,
        },
      },
    },
  });

  allFullBids.forEach((bid) => {
    const stats = teamStatsMap.get(bid.teamId) || {
      teamName: bid.team.name,
      totalBids: 0,
      successfulBids: 0,
      totalBidAmount: 0,
    };

    stats.totalBids += 1;
    stats.totalBidAmount += bid.amount;

    if (bid.player.status === "SOLD" && bid.player.teamId === bid.teamId) {
      stats.successfulBids += 1;
    }

    teamStatsMap.set(bid.teamId, stats);
  });

  const teamBiddingStats = Array.from(teamStatsMap.entries()).map(([teamId, stats]) => ({
    teamId,
    teamName: stats.teamName,
    totalBids: stats.totalBids,
    successfulBids: stats.successfulBids,
    successRate: stats.totalBids > 0 ? (stats.successfulBids / stats.totalBids) * 100 : 0,
    totalBidAmount: stats.totalBidAmount,
  }));

  // Top 10 Most Expensive Players
  const top10MostExpensivePlayers = soldPlayers
    .sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      basePrice: p.basePrice,
      soldPrice: p.soldPrice || 0,
      team: {
        id: p.team?.id || "",
        name: p.team?.name || "Unknown",
      },
    }));

  return {
    auction: {
      id: auction.id,
      name: auction.name,
      sport: auction.sport,
      status: auction.status,
      createdAt: auction.createdAt,
      minPlayersPerTeam: auction.minPlayersPerTeam,
      maxPlayersPerTeam: auction.maxPlayersPerTeam,
      minPlayerPrice: auction.minPlayerPrice,
      minBidIncrement: auction.minBidIncrement,
    },
    statistics: {
      totalPlayers: auction.players.length,
      soldPlayers: soldPlayers.length,
      unsoldPlayers: unsoldPlayers.length,
      totalPurse,
      totalSpent,
      averagePlayerPrice: soldPrices.length > 0 ? totalSpent / soldPrices.length : 0,
      highestSoldPrice: soldPrices.length > 0 ? Math.max(...soldPrices) : 0,
      lowestSoldPrice: soldPrices.length > 0 ? Math.min(...soldPrices) : 0,
      mostExpensivePlayer: mostExpensivePlayer
        ? {
            name: mostExpensivePlayer.name,
            role: mostExpensivePlayer.role,
            price: mostExpensivePlayer.soldPrice || 0,
            team: mostExpensivePlayer.team?.name || "Unknown",
          }
        : null,
    },
    teamsWithPlayers,
    soldPlayers: soldPlayersData,
    unsoldPlayers: unsoldPlayersData,
    roleStats,
    roleSpending,
    priceDistribution,
    teamBiddingStats,
    recentBids: allBids.map((bid) => ({
      id: bid.id,
      amount: bid.amount,
      createdAt: bid.createdAt,
      player: {
        id: bid.player.id,
        name: bid.player.name,
        role: bid.player.role,
      },
      team: {
        id: bid.team.id,
        name: bid.team.name,
      },
    })),
    top10MostExpensivePlayers,
  };
}
