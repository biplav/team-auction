import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getAuctionSummaryData,
  getTeamDetailedData,
  getPlayerAuctionData,
  getBiddingHistoryData,
  getBudgetAnalysisData,
  getComprehensiveReportData,
} from "@/lib/reports/report-data";
import {
  generateAuctionSummaryExcel,
  generateTeamDetailedExcel,
  generatePlayerAuctionExcel,
  generateBiddingHistoryExcel,
  generateBudgetAnalysisExcel,
  generateComprehensiveReportExcel,
  workbookToBuffer,
} from "@/lib/reports/excel-generator";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");
    const auctionId = searchParams.get("auctionId");
    const teamId = searchParams.get("teamId");

    if (!reportType) {
      return NextResponse.json(
        { error: "Report type is required" },
        { status: 400 }
      );
    }

    let workbook: any;
    let filename: string;

    switch (reportType) {
      case "auction-summary":
        if (!auctionId) {
          return NextResponse.json(
            { error: "Auction ID is required" },
            { status: 400 }
          );
        }
        const auctionData = await getAuctionSummaryData(auctionId);
        workbook = generateAuctionSummaryExcel(auctionData);
        filename = `auction-summary-${auctionData.auction.name.replace(/\s+/g, "-")}.xlsx`;
        break;

      case "team-detailed":
        if (!teamId) {
          return NextResponse.json(
            { error: "Team ID is required" },
            { status: 400 }
          );
        }
        const teamData = await getTeamDetailedData(teamId);
        workbook = generateTeamDetailedExcel(teamData);
        filename = `team-report-${teamData.team.name.replace(/\s+/g, "-")}.xlsx`;
        break;

      case "player-auction":
        if (!auctionId) {
          return NextResponse.json(
            { error: "Auction ID is required" },
            { status: 400 }
          );
        }
        const playerData = await getPlayerAuctionData(auctionId);
        workbook = generatePlayerAuctionExcel(playerData);
        filename = `player-auction-${playerData.auction.name.replace(/\s+/g, "-")}.xlsx`;
        break;

      case "bidding-history":
        if (!auctionId) {
          return NextResponse.json(
            { error: "Auction ID is required" },
            { status: 400 }
          );
        }
        const biddingData = await getBiddingHistoryData(auctionId);
        workbook = generateBiddingHistoryExcel(biddingData);
        filename = `bidding-history-${biddingData.auction.name.replace(/\s+/g, "-")}.xlsx`;
        break;

      case "budget-analysis":
        if (!auctionId) {
          return NextResponse.json(
            { error: "Auction ID is required" },
            { status: 400 }
          );
        }
        const budgetData = await getBudgetAnalysisData(auctionId);
        workbook = generateBudgetAnalysisExcel(budgetData);
        filename = `budget-analysis-${budgetData.auction.name.replace(/\s+/g, "-")}.xlsx`;
        break;

      case "comprehensive-report":
        if (!auctionId) {
          return NextResponse.json(
            { error: "Auction ID is required" },
            { status: 400 }
          );
        }
        const comprehensiveData = await getComprehensiveReportData(auctionId);
        workbook = generateComprehensiveReportExcel(comprehensiveData);
        filename = `comprehensive-report-${comprehensiveData.auction.name.replace(/\s+/g, "-")}.xlsx`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    const excelBuffer = workbookToBuffer(workbook);

    // Return Excel as downloadable file
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel report" },
      { status: 500 }
    );
  }
}
