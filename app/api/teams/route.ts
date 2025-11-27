import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const auctionId = searchParams.get("auctionId");

    const teams = await prisma.team.findMany({
      where: auctionId ? { auctionId } : undefined,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        players: {
          select: {
            id: true,
            name: true,
            role: true,
            soldPrice: true,
          },
        },
        _count: {
          select: {
            players: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, ownerId, auctionId, budget } = body;

    if (!name || !auctionId || budget === undefined) {
      return NextResponse.json(
        { error: "Name, auction ID, and budget are required" },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: {
        name,
        ownerId: ownerId || null,
        auctionId,
        initialBudget: budget,
        remainingBudget: budget,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
