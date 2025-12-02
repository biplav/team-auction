import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getComprehensiveReportData } from "@/lib/reports/report-data";
import {
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
    const auctionId = searchParams.get("auctionId");

    if (!auctionId) {
      return NextResponse.json(
        { error: "Auction ID is required" },
        { status: 400 }
      );
    }

    const comprehensiveData = await getComprehensiveReportData(auctionId);
    const workbook = generateComprehensiveReportExcel(comprehensiveData);
    const filename = `comprehensive-report-${comprehensiveData.auction.name.replace(/\s+/g, "-")}.xlsx`;
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
