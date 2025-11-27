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

    // Get player with team details
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            remainingBudget: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // If player was sold, we need to refund the team
    if (player.status === "SOLD" && player.teamId && player.soldPrice) {
      const result = await prisma.$transaction([
        // Refund the team
        prisma.team.update({
          where: { id: player.teamId },
          data: {
            remainingBudget: {
              increment: player.soldPrice,
            },
          },
        }),
        // Mark player as unsold
        prisma.player.update({
          where: { id },
          data: {
            status: "UNSOLD",
            soldPrice: null,
            teamId: null,
          },
        }),
      ]);

      return NextResponse.json({
        player: result[1],
        refunded: true,
        refundAmount: player.soldPrice,
        teamName: player.team?.name,
      });
    }

    // Player was not sold, just update status
    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        status: "UNSOLD",
        soldPrice: null,
        teamId: null,
      },
    });

    return NextResponse.json({
      player: updatedPlayer,
      refunded: false,
    });
  } catch (error) {
    console.error("Error marking player as unsold:", error);
    return NextResponse.json(
      { error: "Failed to mark player as unsold" },
      { status: 500 }
    );
  }
}
