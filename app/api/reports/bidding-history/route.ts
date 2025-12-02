import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBiddingHistoryData } from "@/lib/reports/report-data";

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

    const data = await getBiddingHistoryData(auctionId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating bidding history report:", error);
    return NextResponse.json(
      { error: "Failed to generate bidding history report" },
      { status: 500 }
    );
  }
}
