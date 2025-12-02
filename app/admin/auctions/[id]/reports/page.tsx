"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Download, FileSpreadsheet, BarChart3, Users, TrendingUp, DollarSign, Activity } from "lucide-react";

interface Auction {
  id: string;
  name: string;
  status: string;
}

type ReportType = "comprehensive-report";

interface ReportCard {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export default function ReportsPage() {
  const params = useParams();
  const auctionId = params.id as string;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState<ReportType | null>(null);
  const [downloadingExcel, setDownloadingExcel] = useState<ReportType | null>(null);

  useEffect(() => {
    fetchAuction();
  }, [auctionId]);

  const fetchAuction = async () => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}`);
      if (res.ok) {
        const data = await res.json();
        setAuction(data);
      }
    } catch (error) {
      console.error("Error fetching auction:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportType: ReportType, format: "pdf" | "excel") => {
    try {
      if (format === "pdf") {
        setDownloadingPDF(reportType);
      } else {
        setDownloadingExcel(reportType);
      }

      const url = `/api/reports/export/${format}?type=${reportType}&auctionId=${auctionId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to download report");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `report.${format === "pdf" ? "pdf" : "xlsx"}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloadingPDF(null);
      setDownloadingExcel(null);
    }
  };

  const reports: ReportCard[] = [
    {
      id: "comprehensive-report",
      title: "Comprehensive Auction Report",
      description: "Complete auction analysis including team-wise player rosters, auction summary, player details, bidding history, budget analysis, and role distribution - all in one comprehensive report",
      icon: <FileText className="h-8 w-8" />,
      color: "from-blue-500 to-purple-600",
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/auctions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Auctions
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            {auction && (
              <p className="text-muted-foreground mt-1">{auction.name}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mb-8">
        {reports.map((report) => (
          <Card key={report.id} className="overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${report.color}`} />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${report.color} text-white`}>
                      {report.icon}
                    </div>
                    <CardTitle className="text-xl">{report.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    {report.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  onClick={() => downloadReport(report.id, "pdf")}
                  disabled={downloadingPDF === report.id || downloadingExcel === report.id}
                  className="flex-1"
                  variant="default"
                  size="lg"
                >
                  {downloadingPDF === report.id ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => downloadReport(report.id, "excel")}
                  disabled={downloadingPDF === report.id || downloadingExcel === report.id}
                  className="flex-1"
                  variant="outline"
                  size="lg"
                >
                  {downloadingExcel === report.id ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Download Excel
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">What's Included in the Report</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">PDF Report Includes:</h4>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Complete auction summary with key statistics</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Team-wise player rosters (each team on a separate page)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Budget analysis and role distribution</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Bidding statistics for all teams</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Excel Report Includes:</h4>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>7 comprehensive sheets: Summary, Team Squads, Sold Players, Unsold Players, Budget Analysis, Bidding Stats, and Role Stats</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Complete player details for each team with base and sold prices</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>All data formatted for easy analysis and pivot tables</span>
                  </li>
                </ul>
              </div>
              <div className="pt-2 border-t border-blue-300">
                <p className="text-xs">
                  Reports are generated in real-time with the latest auction data. All financial figures are displayed in Indian Rupees (₹).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
