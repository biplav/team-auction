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
  generateAuctionSummaryPDF,
  generateTeamDetailedPDF,
  generatePlayerAuctionPDF,
  generateBiddingHistoryPDF,
  generateBudgetAnalysisPDF,
  generateComprehensiveReportPDF,
} from "@/lib/reports/pdf-generator";

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

    let pdfBuffer: Buffer;
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
        pdfBuffer = await generateAuctionSummaryPDF(auctionData);
        filename = `auction-summary-${auctionData.auction.name.replace(/\s+/g, "-")}.pdf`;
        break;

      case "team-detailed":
        if (!teamId) {
          return NextResponse.json(
            { error: "Team ID is required" },
            { status: 400 }
          );
        }
        const teamData = await getTeamDetailedData(teamId);
        pdfBuffer = await generateTeamDetailedPDF(teamData);
        filename = `team-report-${teamData.team.name.replace(/\s+/g, "-")}.pdf`;
        break;

      case "player-auction":
        if (!auctionId) {
          return NextResponse.json(
            { error: "Auction ID is required" },
            { status: 400 }
          );
        }
        const playerData = await getPlayerAuctionData(auctionId);
        pdfBuffer = await generatePlayerAuctionPDF(playerData);
        filename = `player-auction-${playerData.auction.name.replace(/\s+/g, "-")}.pdf`;
        break;

      case "bidding-history":
        if (!auctionId) {
          return NextResponse.json(
            { error: "Auction ID is required" },
            { status: 400 }
          );
        }
        const biddingData = await getBiddingHistoryData(auctionId);
        pdfBuffer = await generateBiddingHistoryPDF(biddingData);
        filename = `bidding-history-${biddingData.auction.name.replace(/\s+/g, "-")}.pdf`;
        break;

      case "budget-analysis":
        if (!auctionId) {
          return NextResponse.json(
            { error: "Auction ID is required" },
            { status: 400 }
          );
        }
        const budgetData = await getBudgetAnalysisData(auctionId);
        pdfBuffer = await generateBudgetAnalysisPDF(budgetData);
        filename = `budget-analysis-${budgetData.auction.name.replace(/\s+/g, "-")}.pdf`;
        break;

      case "comprehensive-report":
        if (!auctionId) {
          return NextResponse.json(
            { error: "Auction ID is required" },
            { status: 400 }
          );
        }
        const comprehensiveData = await getComprehensiveReportData(auctionId);
        pdfBuffer = await generateComprehensiveReportPDF(comprehensiveData);
        filename = `comprehensive-report-${comprehensiveData.auction.name.replace(/\s+/g, "-")}.pdf`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF report" },
      { status: 500 }
    );
  }
}
