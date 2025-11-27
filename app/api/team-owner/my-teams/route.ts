import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Allow both ADMIN and TEAM_OWNER to access their teams
    if (session.user.role !== "ADMIN" && session.user.role !== "TEAM_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const teams = await prisma.team.findMany({
      where: {
        ownerId: session.user.id,
      },
      include: {
        auction: {
          select: {
            id: true,
            name: true,
            status: true,
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
