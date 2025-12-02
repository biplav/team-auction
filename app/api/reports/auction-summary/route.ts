import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuctionSummaryData } from "@/lib/reports/report-data";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const auctionId = searchParams.get("auctionId");

    if (!auctionId) {
      return NextResponse.json(
        { error: "Auction ID is required" },
        { status: 400 }
      );
    }

    const data = await getAuctionSummaryData(auctionId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating auction summary:", error);
    return NextResponse.json(
      { error: "Failed to generate auction summary" },
      { status: 500 }
    );
  }
}
