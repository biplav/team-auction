import * as XLSX from "xlsx";
import type { ComprehensiveReportData } from "./report-data";

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Generate Comprehensive Auction Report Excel - All reports combined
 */
export function generateComprehensiveReportExcel(data: ComprehensiveReportData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Auction Summary
  const summaryData = [
    ["COMPREHENSIVE AUCTION REPORT"],
    [`Auction: ${data.auction.name}`],
    [`Sport: ${data.auction.sport}`],
    [`Status: ${data.auction.status.replace("_", " ")}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ["KEY STATISTICS"],
    ["Total Players", data.statistics.totalPlayers],
    ["Sold Players", data.statistics.soldPlayers],
    ["Unsold Players", data.statistics.unsoldPlayers],
    ["Total Purse", formatCurrency(data.statistics.totalPurse)],
    ["Total Spent", formatCurrency(data.statistics.totalSpent)],
    ["Average Player Price", formatCurrency(data.statistics.averagePlayerPrice)],
    ["Highest Sold Price", formatCurrency(data.statistics.highestSoldPrice)],
    ["Lowest Sold Price", formatCurrency(data.statistics.lowestSoldPrice)],
  ];

  if (data.statistics.mostExpensivePlayer) {
    summaryData.push(
      [],
      ["MOST EXPENSIVE PLAYER"],
      ["Name", data.statistics.mostExpensivePlayer.name],
      ["Role", data.statistics.mostExpensivePlayer.role.replace("_", " ")],
      ["Price", formatCurrency(data.statistics.mostExpensivePlayer.price)],
      ["Team", data.statistics.mostExpensivePlayer.team]
    );
  }

  // Add top 10 most expensive players to summary
  if (data.top10MostExpensivePlayers.length > 0) {
    summaryData.push(
      [],
      ["TOP 10 MOST EXPENSIVE PLAYERS"],
      ["Rank", "Player Name", "Role", "Team", "Base Price", "Sold Price"]
    );
    data.top10MostExpensivePlayers.forEach((p, idx) => {
      summaryData.push([
        idx + 1,
        p.name,
        p.role.replace("_", " "),
        p.team.name,
        formatCurrency(p.basePrice),
        formatCurrency(p.soldPrice),
      ]);
    });
  }

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  // Sheet 2: Team-wise Players
  const teamData: any[] = [["TEAM-WISE PLAYER BREAKDOWN"], []];

  data.teamsWithPlayers.forEach((team) => {
    teamData.push(
      [`TEAM: ${team.name}`],
      [`Owner: ${team.ownerName || "N/A"}`],
      [`Budget: ${formatCurrency(team.initialBudget)} | Spent: ${formatCurrency(team.spent)} | Remaining: ${formatCurrency(team.remainingBudget)}`],
      [`Players: ${team.playerCount} | Avg Cost: ${formatCurrency(team.avgPlayerCost)} | Utilization: ${team.budgetUtilization.toFixed(1)}%`],
      [],
      ["Player Name", "Role", "Base Price", "Sold Price"],
      ...team.players.map((p) => [
        p.name,
        p.role.replace("_", " "),
        formatCurrency(p.basePrice),
        formatCurrency(p.soldPrice),
      ]),
      [],
      ["ROLE DISTRIBUTION"],
      ["Batsmen", team.roleDistribution.BATSMAN],
      ["Bowlers", team.roleDistribution.BOWLER],
      ["All-Rounders", team.roleDistribution.ALL_ROUNDER],
      ["Wicket-Keepers", team.roleDistribution.WICKET_KEEPER],
      [],
      []
    );
  });

  const ws2 = XLSX.utils.aoa_to_sheet(teamData);
  ws2["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Team Squads");

  // Sheet 3: All Sold Players
  const soldHeaders = [["ALL SOLD PLAYERS"], [], ["Player", "Role", "Base Price", "Sold Price", "Team", "Bid Count"]];
  const soldRows = data.soldPlayers.map((p) => [
    p.name,
    p.role.replace("_", " "),
    formatCurrency(p.basePrice),
    formatCurrency(p.soldPrice),
    p.team.name,
    p.bidCount,
  ]);

  const ws3 = XLSX.utils.aoa_to_sheet([...soldHeaders, ...soldRows]);
  ws3["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Sold Players");

  // Sheet 4: Unsold Players
  if (data.unsoldPlayers.length > 0) {
    const unsoldHeaders = [["UNSOLD PLAYERS"], [], ["Player", "Role", "Base Price"]];
    const unsoldRows = data.unsoldPlayers.map((p) => [
      p.name,
      p.role.replace("_", " "),
      formatCurrency(p.basePrice),
    ]);

    const ws4 = XLSX.utils.aoa_to_sheet([...unsoldHeaders, ...unsoldRows]);
    ws4["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws4, "Unsold Players");
  }

  // Sheet 5: Budget Analysis
  const budgetHeaders = [
    ["BUDGET ANALYSIS"],
    [],
    ["Team", "Initial Budget", "Spent", "Remaining", "Utilization %", "Players", "Avg Cost"],
  ];
  const budgetRows = data.teamsWithPlayers.map((t) => [
    t.name,
    formatCurrency(t.initialBudget),
    formatCurrency(t.spent),
    formatCurrency(t.remainingBudget),
    `${t.budgetUtilization.toFixed(1)}%`,
    t.playerCount,
    formatCurrency(t.avgPlayerCost),
  ]);

  const budgetData = [...budgetHeaders, ...budgetRows];

  // Add role-wise spending
  if (data.roleSpending.length > 0) {
    budgetData.push(
      [],
      ["ROLE-WISE SPENDING"],
      ["Role", "Total Spent", "Players", "Avg Cost"]
    );
    data.roleSpending.forEach((rs) => {
      budgetData.push([
        rs.role.replace("_", " "),
        formatCurrency(rs.totalSpent),
        rs.playerCount,
        formatCurrency(rs.avgCost),
      ]);
    });
  }

  // Add price distribution
  if (data.priceDistribution.length > 0) {
    budgetData.push(
      [],
      ["PRICE DISTRIBUTION"],
      ["Price Range", "Player Count"]
    );
    data.priceDistribution.forEach((pd) => {
      budgetData.push([pd.range, pd.count]);
    });
  }

  const ws5 = XLSX.utils.aoa_to_sheet(budgetData);
  ws5["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws5, "Budget Analysis");

  // Sheet 6: Bidding Statistics
  const biddingHeaders = [
    ["BIDDING STATISTICS"],
    [],
    ["Team", "Total Bids", "Successful Bids", "Success Rate", "Total Bid Amount"],
  ];
  const biddingRows = data.teamBiddingStats.map((t) => [
    t.teamName,
    t.totalBids,
    t.successfulBids,
    `${t.successRate.toFixed(1)}%`,
    formatCurrency(t.totalBidAmount),
  ]);

  const ws6 = XLSX.utils.aoa_to_sheet([...biddingHeaders, ...biddingRows]);
  ws6["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws6, "Bidding Stats");

  // Sheet 7: Role Statistics
  const roleStatsHeaders = [
    ["ROLE-WISE STATISTICS"],
    [],
    ["Role", "Total Players", "Sold", "Avg Price"],
  ];
  const roleStatsRows = data.roleStats.map((rs) => [
    rs.role.replace("_", " "),
    rs.total,
    rs.sold,
    formatCurrency(rs.avgPrice),
  ]);

  const ws7 = XLSX.utils.aoa_to_sheet([...roleStatsHeaders, ...roleStatsRows]);
  ws7["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws7, "Role Stats");

  return wb;
}

/**
 * Convert workbook to buffer for download
 */
export function workbookToBuffer(wb: XLSX.WorkBook): Buffer {
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  return buf;
}
