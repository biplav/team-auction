import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auctions = await prisma.auction.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
          },
        },
        players: {
          select: {
            id: true,
            name: true,
            status: true,
            soldPrice: true,
          },
        },
        currentPlayer: {
          select: {
            id: true,
            name: true,
            role: true,
            basePrice: true,
          },
        },
      },
    });

    // Transform data for public consumption
    const publicAuctions = auctions.map((auction) => {
      const totalPlayers = auction.players.length;
      const soldPlayers = auction.players.filter((p) => p.status === "SOLD").length;
      const unsoldPlayers = auction.players.filter((p) => p.status === "UNSOLD").length;
      const remainingPlayers = totalPlayers - soldPlayers - unsoldPlayers;

      // Get latest bid if auction is in progress
      const latestBidAmount = auction.status === "IN_PROGRESS"
        ? auction.players
            .filter((p) => p.soldPrice !== null)
            .sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))[0]?.soldPrice || 0
        : 0;

      return {
        id: auction.id,
        name: auction.name,
        status: auction.status,
        totalTeams: auction.teams.length,
        totalPlayers,
        soldPlayers,
        remainingPlayers,
        currentPlayer: auction.currentPlayer ? {
          name: auction.currentPlayer.name,
          role: auction.currentPlayer.role,
          basePrice: auction.currentPlayer.basePrice,
        } : null,
        latestBidAmount,
        createdAt: auction.createdAt,
      };
    });

    return NextResponse.json(publicAuctions);
  } catch (error) {
    console.error("Error fetching public auctions:", error);
    return NextResponse.json(
      { error: "Failed to fetch auctions" },
      { status: 500 }
    );
  }
}
