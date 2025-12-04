import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDynamicMaxBid, calculateMaxAllowableBid } from "@/lib/budget";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    const { searchParams } = new URL(request.url);
    const currentPlayerId = searchParams.get('playerId');

    // Fetch team with auction details and player count
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
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const currentPlayerCount = team._count.players;

    // Check feature flag and use appropriate calculation
    if (team.auction.useDynamicBidCalculation) {
      const result = await calculateDynamicMaxBid(
        team.remainingBudget,
        currentPlayerCount,
        team.auction.minPlayersPerTeam,
        team.auction.id,
        currentPlayerId || undefined,
        prisma
      );
      return NextResponse.json(result);
    } else {
      // Use existing calculation for backward compatibility
      const remainingRequiredPlayers = Math.max(
        0,
        team.auction.minPlayersPerTeam - currentPlayerCount - 1
      );
      const maxAllowableBid = calculateMaxAllowableBid(
        team.remainingBudget,
        currentPlayerCount,
        team.auction.minPlayersPerTeam,
        team.auction.minPlayerPrice
      );
      return NextResponse.json({
        maxAllowableBid,
        reservedAmount: remainingRequiredPlayers * team.auction.minPlayerPrice,
        reservedPlayerCount: remainingRequiredPlayers,
      });
    }
  } catch (error) {
    console.error("Error calculating max bid:", error);
    return NextResponse.json(
      { error: "Failed to calculate maximum bid" },
      { status: 500 }
    );
  }
}
