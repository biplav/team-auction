import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const team = await prisma.team.findUnique({
      where: { id: id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        players: {
          include: {
            bids: {
              orderBy: {
                amount: "desc",
              },
              take: 1,
            },
          },
        },
        auction: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
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

export async function PATCH(
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
    const { name, ownerId, budget } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (ownerId !== undefined) updateData.ownerId = ownerId || null;
    if (budget !== undefined) {
      const currentTeam = await prisma.team.findUnique({
        where: { id: id },
      });

      if (currentTeam) {
        const budgetDiff = budget - currentTeam.initialBudget;
        updateData.initialBudget = budget;
        updateData.remainingBudget = currentTeam.remainingBudget + budgetDiff;
      }
    }

    const team = await prisma.team.update({
      where: { id: id },
      data: updateData,
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

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.team.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
