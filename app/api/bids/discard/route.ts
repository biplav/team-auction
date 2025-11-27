import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    // Delete all bids for this player
    const result = await prisma.bid.deleteMany({
      where: {
        playerId,
      },
    });

    return NextResponse.json({
      message: "Bids discarded successfully",
      count: result.count,
    });
  } catch (error) {
    console.error("Error discarding bids:", error);
    return NextResponse.json(
      { error: "Failed to discard bids" },
      { status: 500 }
    );
  }
}
