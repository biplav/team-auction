import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateDynamicMaxBid, formatCurrency } from "@/lib/budget";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { playerId, teamId, amount } = body;

    console.log("Bid request:", { playerId, teamId, amount });

    if (!playerId || !teamId || !amount) {
      return NextResponse.json(
        { error: "Player ID, team ID, and amount are required" },
        { status: 400 }
      );
    }

    // Get team with player count
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        auction: {
          select: {
            id: true,
            minPlayersPerTeam: true,
            maxPlayersPerTeam: true,
            minPlayerPrice: true,
            useDynamicBidCalculation: true,
          },
        },
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if team has reached maximum squad size
    const currentPlayerCount = team._count.players;
    if (currentPlayerCount >= team.auction.maxPlayersPerTeam) {
      return NextResponse.json(
        {
          error: `Your team has reached the maximum squad size of ${team.auction.maxPlayersPerTeam} players. You cannot bid on more players.`
        },
        { status: 400 }
      );
    }

    // Check basic budget
    if (team.remainingBudget < amount) {
      return NextResponse.json(
        { error: "Insufficient budget" },
        { status: 400 }
      );
    }

    // Check if bid would leave enough budget for minimum squad requirements
    let maxAllowableBid: number;
    let reservedAmount: number;
    let reservedPlayerCount: number;

    if (team.auction.useDynamicBidCalculation) {
      // Use dynamic calculation based on actual base prices of remaining unsold players
      const result = await calculateDynamicMaxBid(
        team.remainingBudget,
        currentPlayerCount,
        team.auction.minPlayersPerTeam,
        team.auction.id,
        playerId,
        prisma
      );
      maxAllowableBid = result.maxAllowableBid;
      reservedAmount = result.reservedAmount;
      reservedPlayerCount = result.reservedPlayerCount;
    } else {
      // Use existing calculation for backward compatibility
      const remainingRequiredPlayers = Math.max(
        0,
        team.auction.minPlayersPerTeam - currentPlayerCount - 1
      );
      maxAllowableBid =
        team.remainingBudget - remainingRequiredPlayers * team.auction.minPlayerPrice;
      reservedAmount = remainingRequiredPlayers * team.auction.minPlayerPrice;
      reservedPlayerCount = remainingRequiredPlayers;
    }

    if (amount > maxAllowableBid) {
      return NextResponse.json(
        {
          error: `Bid exceeds maximum allowable amount. Reserved ${formatCurrency(reservedAmount)} for ${reservedPlayerCount} player(s). Maximum bid: ${formatCurrency(maxAllowableBid)}`,
        },
        { status: 400 }
      );
    }

    // Get player to check current auction
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { auction: true },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (player.auction.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Auction is not in progress" },
        { status: 400 }
      );
    }

    // Get highest current bid for this player
    const highestBid = await prisma.bid.findFirst({
      where: { playerId },
      orderBy: { amount: "desc" },
    });

    // Calculate minimum required bid
    const minRequired = highestBid
      ? highestBid.amount + player.auction.minBidIncrement
      : player.basePrice;

    if (amount < minRequired) {
      return NextResponse.json(
        {
          error: highestBid
            ? `Bid must be at least ${formatCurrency(minRequired)} (current highest: ${formatCurrency(highestBid.amount)} + increment: ${formatCurrency(player.auction.minBidIncrement)})`
            : `Bid must be at least the base price of ${formatCurrency(minRequired)}`,
        },
        { status: 400 }
      );
    }

    // Create bid
    const bid = await prisma.bid.create({
      data: {
        playerId,
        teamId,
        auctionId: player.auctionId,
        amount,
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
            role: true,
          },
        },
      },
    });

    return NextResponse.json(bid, { status: 201 });
  } catch (error) {
    console.error("Error creating bid:", error);
    return NextResponse.json(
      { error: "Failed to create bid" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // No authentication required - bids are public for display page
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");
    const teamId = searchParams.get("teamId");

    const bids = await prisma.bid.findMany({
      where: {
        ...(playerId && { playerId }),
        ...(teamId && { teamId }),
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
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bids);
  } catch (error) {
    console.error("Error fetching bids:", error);
    return NextResponse.json(
      { error: "Failed to fetch bids" },
      { status: 500 }
    );
  }
}
