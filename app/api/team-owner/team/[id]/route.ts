import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const team = await prisma.team.findUnique({
      where: {
        id,
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
            basePrice: true,
            soldPrice: true,
            stats: true,
          },
          orderBy: {
            soldPrice: "desc",
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify ownership (allow admins to view any team, team owners only their own)
    if (session.user.role !== "ADMIN" && team.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to view this team" },
        { status: 403 }
      );
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}
