import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, amount } = body;

    if (!teamId || !amount) {
      return NextResponse.json(
        { error: "Team ID and amount are required" },
        { status: 400 }
      );
    }

    // Get player and team
    const player = await prisma.player.findUnique({
      where: { id: id },
      include: { auction: true },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Verify player is UNSOLD
    if (player.status !== "UNSOLD") {
      return NextResponse.json(
        {
          error: `Cannot sell player: Player is already ${player.status}. Only UNSOLD players can be sold.`,
        },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify there are active bids for this player
    const bids = await prisma.bid.findMany({
      where: { playerId: id },
      orderBy: [
        { amount: "desc" },
        { createdAt: "asc" }, // First-come-first-served for same amount
      ],
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (bids.length === 0) {
      return NextResponse.json(
        { error: "Cannot sell player: No active bids found" },
        { status: 400 }
      );
    }

    // Verify the bid matches the highest bid
    const highestBid = bids[0];
    if (highestBid.teamId !== teamId) {
      return NextResponse.json(
        {
          error: `Cannot sell player: The highest bid is from ${highestBid.team.name}, not ${team.name}`,
        },
        { status: 400 }
      );
    }

    if (highestBid.amount !== amount) {
      const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(amt);
      };

      return NextResponse.json(
        {
          error: `Cannot sell player: The highest bid is ${formatCurrency(highestBid.amount)}, not ${formatCurrency(amount)}`,
        },
        { status: 400 }
      );
    }

    // Verify team has enough budget
    if (team.remainingBudget < amount) {
      const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(amt);
      };

      return NextResponse.json(
        {
          error: `${team.name} has insufficient budget. Available: ${formatCurrency(team.remainingBudget)}, Required: ${formatCurrency(amount)}`,
        },
        { status: 400 }
      );
    }

    // Update player and team in transaction
    const result = await prisma.$transaction([
      // Update player
      prisma.player.update({
        where: { id: id },
        data: {
          status: "SOLD",
          soldPrice: amount,
          teamId: teamId,
        },
      }),
      // Update team budget
      prisma.team.update({
        where: { id: teamId },
        data: {
          remainingBudget: team.remainingBudget - amount,
        },
      }),
      // Create final bid record
      prisma.bid.create({
        data: {
          playerId: id,
          teamId: teamId,
          auctionId: player.auctionId,
          amount: amount,
        },
      }),
    ]);

    return NextResponse.json({
      player: result[0],
      team: result[1],
      bid: result[2],
    });
  } catch (error) {
    console.error("Error selling player:", error);
    return NextResponse.json(
      { error: "Failed to sell player" },
      { status: 500 }
    );
  }
}
