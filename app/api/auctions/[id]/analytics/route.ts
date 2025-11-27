import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params;

    // Fetch auction details
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    // Fetch all players
    const players = await prisma.player.findMany({
      where: { auctionId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Fetch all teams
    const teams = await prisma.team.findMany({
      where: { auctionId },
      include: {
        players: true,
      },
    });

    // Fetch all bids
    const bids = await prisma.bid.findMany({
      where: {
        player: {
          auctionId,
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        player: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // Calculate statistics
    const totalPlayers = players.length;
    const soldPlayers = players.filter((p) => p.status === "SOLD").length;
    const unsoldPlayers = players.filter((p) => p.status === "UNSOLD").length;
    const availablePlayers = totalPlayers - soldPlayers - unsoldPlayers;

    // Calculate total revenue
    const totalRevenue = players.reduce(
      (sum, player) => sum + (player.soldPrice || 0),
      0
    );

    // Player distribution by role
    const roleDistribution = players.reduce((acc: any, player) => {
      acc[player.role] = (acc[player.role] || 0) + 1;
      return acc;
    }, {});

    // Players by status
    const statusDistribution = {
      SOLD: soldPlayers,
      UNSOLD: unsoldPlayers,
      AVAILABLE: availablePlayers,
    };

    // Team statistics
    const teamStats = teams.map((team) => {
      const teamPlayers = team.players;
      const totalSpent = team.initialBudget - team.remainingBudget;
      const avgPlayerPrice =
        teamPlayers.length > 0 ? totalSpent / teamPlayers.length : 0;

      return {
        id: team.id,
        name: team.name,
        playersCount: teamPlayers.length,
        totalSpent,
        remainingBudget: team.remainingBudget,
        initialBudget: team.initialBudget,
        budgetUtilization:
          ((totalSpent / team.initialBudget) * 100).toFixed(1),
        avgPlayerPrice: Math.round(avgPlayerPrice),
      };
    });

    // Most expensive players
    const mostExpensivePlayers = players
      .filter((p) => p.soldPrice !== null)
      .sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        soldPrice: p.soldPrice,
        teamName: p.team?.name || "N/A",
      }));

    // Unsold players
    const unsoldPlayersList = players
      .filter((p) => p.status === "UNSOLD")
      .map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        basePrice: p.basePrice,
      }));

    // Price range distribution
    const priceRanges = {
      "0-1L": 0,
      "1L-5L": 0,
      "5L-10L": 0,
      "10L-25L": 0,
      "25L+": 0,
    };

    players.forEach((player) => {
      const price = player.soldPrice || 0;
      if (price === 0) return;
      if (price < 100000) priceRanges["0-1L"]++;
      else if (price < 500000) priceRanges["1L-5L"]++;
      else if (price < 1000000) priceRanges["5L-10L"]++;
      else if (price < 2500000) priceRanges["10L-25L"]++;
      else priceRanges["25L+"]++;
    });

    // Recent activity
    const recentActivity = bids.slice(0, 20).map((bid) => ({
      id: bid.id,
      teamName: bid.team.name,
      playerName: bid.player.name,
      amount: bid.amount,
      createdAt: bid.createdAt,
    }));

    // Total bids count
    const totalBids = bids.length;

    return NextResponse.json({
      auction: {
        id: auction.id,
        name: auction.name,
        status: auction.status,
      },
      overview: {
        totalPlayers,
        soldPlayers,
        unsoldPlayers,
        availablePlayers,
        totalRevenue,
        totalBids,
      },
      roleDistribution,
      statusDistribution,
      priceRanges,
      teamStats,
      mostExpensivePlayers,
      unsoldPlayers: unsoldPlayersList,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
