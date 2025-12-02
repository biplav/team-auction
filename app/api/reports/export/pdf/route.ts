import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getComprehensiveReportData } from "@/lib/reports/report-data";
import { generateComprehensiveReportPDF } from "@/lib/reports/pdf-generator";

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

    const comprehensiveData = await getComprehensiveReportData(auctionId);
    const pdfBuffer = await generateComprehensiveReportPDF(comprehensiveData);
    const filename = `comprehensive-report-${comprehensiveData.auction.name.replace(/\s+/g, "-")}.pdf`;

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
