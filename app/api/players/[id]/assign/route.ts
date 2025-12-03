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
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
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
          error: `Cannot assign player: Player is already ${player.status}. Only UNSOLD players can be assigned.`,
        },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        auction: {
          select: {
            maxPlayersPerTeam: true,
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
    if (team._count.players >= team.auction.maxPlayersPerTeam) {
      return NextResponse.json(
        {
          error: `${team.name} has reached the maximum squad size of ${team.auction.maxPlayersPerTeam} players. Cannot assign more players to this team.`,
        },
        { status: 400 }
      );
    }

    // Update player - assign to team with soldPrice = 0 (complimentary)
    // No budget deduction since this is a free assignment
    const updatedPlayer = await prisma.player.update({
      where: { id: id },
      data: {
        status: "SOLD",
        soldPrice: 0, // Free assignment
        teamId: teamId,
      },
    });

    return NextResponse.json({
      player: updatedPlayer,
      message: `${player.name} has been assigned to ${team.name} as a complimentary player (no budget deduction)`,
    });
  } catch (error) {
    console.error("Error assigning player:", error);
    return NextResponse.json(
      { error: "Failed to assign player" },
      { status: 500 }
    );
  }
}
