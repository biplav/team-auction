import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/auctions - List all auctions
export async function GET() {
  try {
    const auctions = await prisma.auction.findMany({
      include: {
        _count: {
          select: {
            teams: true,
            players: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(auctions);
  } catch (error) {
    console.error("Error fetching auctions:", error);
    return NextResponse.json(
      { error: "Failed to fetch auctions" },
      { status: 500 }
    );
  }
}

// POST /api/auctions - Create new auction
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, sport, maxTeams, maxPlayersPerTeam, minPlayersPerTeam, minPlayerPrice, minBidIncrement, bidTimerSeconds, timerEnabled, useDynamicBidCalculation } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Auction name is required" },
        { status: 400 }
      );
    }

    const auction = await prisma.auction.create({
      data: {
        name,
        sport: sport || "Cricket",
        maxTeams: maxTeams || 8,
        maxPlayersPerTeam: maxPlayersPerTeam || 15,
        minPlayersPerTeam: minPlayersPerTeam || 11,
        minPlayerPrice: minPlayerPrice || 0,
        minBidIncrement: minBidIncrement || 50000,
        bidTimerSeconds: bidTimerSeconds || 90,
        timerEnabled: timerEnabled !== undefined ? timerEnabled : true,
        useDynamicBidCalculation: useDynamicBidCalculation !== undefined ? useDynamicBidCalculation : false,
        status: "NOT_STARTED",
      },
    });

    return NextResponse.json(auction, { status: 201 });
  } catch (error) {
    console.error("Error creating auction:", error);
    return NextResponse.json(
      { error: "Failed to create auction" },
      { status: 500 }
    );
  }
}
