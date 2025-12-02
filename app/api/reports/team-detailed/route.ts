import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTeamDetailedData } from "@/lib/reports/report-data";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    const data = await getTeamDetailedData(teamId);

    // Allow team owners to access their own team data
    if (session.user?.role !== "ADMIN" && data.team.ownerName !== session.user?.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating team detailed report:", error);
    return NextResponse.json(
      { error: "Failed to generate team detailed report" },
      { status: 500 }
    );
  }
}
