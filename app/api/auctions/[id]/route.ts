import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            players: true,
            _count: {
              select: {
                players: true,
              },
            },
          },
        },
        players: {
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            teams: true,
            players: true,
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    return NextResponse.json(auction);
  } catch (error) {
    console.error("Error fetching auction:", error);
    return NextResponse.json(
      { error: "Failed to fetch auction" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, currentPlayerId, name, maxTeams, maxPlayersPerTeam, minPlayersPerTeam, minPlayerPrice } = body;

    const updateData: any = {};

    // Update auction settings
    if (name !== undefined) {
      updateData.name = name;
    }
    if (maxTeams !== undefined) {
      updateData.maxTeams = maxTeams;
    }
    if (maxPlayersPerTeam !== undefined) {
      updateData.maxPlayersPerTeam = maxPlayersPerTeam;
    }
    if (minPlayersPerTeam !== undefined) {
      updateData.minPlayersPerTeam = minPlayersPerTeam;
    }
    if (minPlayerPrice !== undefined) {
      updateData.minPlayerPrice = minPlayerPrice;
    }

    // Update status and current player
    if (status !== undefined) {
      updateData.status = status;

      // Set timestamps based on status
      if (status === "IN_PROGRESS" && !updateData.startedAt) {
        updateData.startedAt = new Date();
      } else if (status === "COMPLETED") {
        updateData.endedAt = new Date();
      }
    }
    if (currentPlayerId !== undefined) {
      updateData.currentPlayerId = currentPlayerId;
    }

    const auction = await prisma.auction.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(auction);
  } catch (error) {
    console.error("Error updating auction:", error);
    return NextResponse.json(
      { error: "Failed to update auction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.auction.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Auction deleted successfully" });
  } catch (error) {
    console.error("Error deleting auction:", error);
    return NextResponse.json(
      { error: "Failed to delete auction" },
      { status: 500 }
    );
  }
}
