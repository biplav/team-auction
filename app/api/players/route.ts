import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PlayerRole } from "@prisma/client";

// GET /api/players - List all players for an auction
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const auctionId = searchParams.get("auctionId");

    if (!auctionId) {
      return NextResponse.json(
        { error: "auctionId is required" },
        { status: 400 }
      );
    }

    const players = await prisma.player.findMany({
      where: {
        auctionId,
      },
      include: {
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

    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}

// POST /api/players - Create a single player
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
    const { name, role, basePrice, auctionId, phoneNumber, stats } = body;

    if (!name || !role || !basePrice || !auctionId) {
      return NextResponse.json(
        { error: "Name, role, basePrice, and auctionId are required" },
        { status: 400 }
      );
    }

    // Verify auction exists
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    const player = await prisma.player.create({
      data: {
        name,
        role: role as PlayerRole,
        basePrice: parseInt(basePrice),
        auctionId,
        stats: {
          phoneNumber,
          ...stats,
        },
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json(
      { error: "Failed to create player" },
      { status: 500 }
    );
  }
}

// DELETE /api/players - Delete a player
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get("id");

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    await prisma.player.delete({
      where: { id: playerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting player:", error);
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 }
    );
  }
}

// PUT /api/players - Update a player
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, role, basePrice, phoneNumber, stats } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role as PlayerRole;
    if (basePrice) updateData.basePrice = parseInt(basePrice);
    if (phoneNumber || stats) {
      updateData.stats = {
        phoneNumber,
        ...stats,
      };
    }

    const player = await prisma.player.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}
