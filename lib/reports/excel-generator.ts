import * as XLSX from "xlsx";
import type {
  AuctionSummaryData,
  TeamDetailedData,
  PlayerAuctionData,
  BiddingHistoryData,
  BudgetAnalysisData,
  ComprehensiveReportData,
} from "./report-data";

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Generate Auction Summary Excel Report
 */
export function generateAuctionSummaryExcel(data: AuctionSummaryData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Overview
  const overviewData = [
    ["CRICKET AUCTION REPORT"],
    [`Auction: ${data.auction.name}`],
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
    overviewData.push(
      [],
      ["MOST EXPENSIVE PLAYER"],
      ["Name", data.statistics.mostExpensivePlayer.name],
      ["Role", data.statistics.mostExpensivePlayer.role.replace("_", " ")],
      ["Price", formatCurrency(data.statistics.mostExpensivePlayer.price)],
      ["Team", data.statistics.mostExpensivePlayer.team]
    );
  }

  const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
  ws1["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Overview");

  // Sheet 2: Team Summary
  const teamHeaders = [
    ["Team Name", "Players", "Initial Budget", "Spent", "Remaining", "Utilization %"],
  ];
  const teamRows = data.teamsSummary.map((team) => [
    team.name,
    team.playerCount,
    formatCurrency(team.initialBudget),
    formatCurrency(team.spent),
    formatCurrency(team.remainingBudget),
    `${team.budgetUtilization.toFixed(1)}%`,
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet([...teamHeaders, ...teamRows]);
  ws2["!cols"] = [
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Team Summary");

  return wb;
}

/**
 * Generate Team Detailed Excel Report
 */
export function generateTeamDetailedExcel(data: TeamDetailedData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Team Overview
  const overviewData = [
    ["TEAM DETAILED REPORT"],
    [`Team: ${data.team.name}`],
    [`Owner: ${data.team.ownerName || "N/A"}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ["FINANCIAL SUMMARY"],
    ["Initial Budget", formatCurrency(data.team.initialBudget)],
    ["Remaining Budget", formatCurrency(data.team.remainingBudget)],
    ["Total Spent", formatCurrency(data.statistics.totalSpent)],
    ["Budget Utilization", `${data.statistics.budgetUtilization.toFixed(1)}%`],
    [],
    ["SQUAD SUMMARY"],
    ["Total Players", data.statistics.playerCount],
    ["Average Player Cost", formatCurrency(data.statistics.averagePlayerCost)],
  ];

  if (data.statistics.mostExpensivePlayer) {
    overviewData.push(
      [],
      ["MOST EXPENSIVE PLAYER"],
      ["Name", data.statistics.mostExpensivePlayer.name],
      ["Role", data.statistics.mostExpensivePlayer.role.replace("_", " ")],
      ["Price", formatCurrency(data.statistics.mostExpensivePlayer.price)]
    );
  }

  const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
  ws1["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Overview");

  // Sheet 2: Player Roster
  const playerHeaders = [["Player Name", "Role", "Base Price", "Sold Price"]];
  const playerRows = data.players.map((player) => [
    player.name,
    player.role.replace("_", " "),
    formatCurrency(player.basePrice),
    formatCurrency(player.soldPrice),
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet([...playerHeaders, ...playerRows]);
  ws2["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Player Roster");

  // Sheet 3: Role Distribution
  const roleData = [
    ["ROLE DISTRIBUTION"],
    [],
    ["Role", "Count"],
    ["Batsman", data.roleDistribution.BATSMAN],
    ["Bowler", data.roleDistribution.BOWLER],
    ["All-Rounder", data.roleDistribution.ALL_ROUNDER],
    ["Wicket Keeper", data.roleDistribution.WICKET_KEEPER],
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(roleData);
  ws3["!cols"] = [{ wch: 20 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Role Distribution");

  return wb;
}

/**
 * Generate Player Auction Excel Report
 */
export function generatePlayerAuctionExcel(data: PlayerAuctionData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Sold Players
  const soldHeaders = [
    ["Player Name", "Role", "Base Price", "Sold Price", "Team", "No. of Bids"],
  ];
  const soldRows = data.soldPlayers.map((player) => [
    player.name,
    player.role.replace("_", " "),
    formatCurrency(player.basePrice),
    formatCurrency(player.soldPrice),
    player.team.name,
    player.bidCount,
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet([...soldHeaders, ...soldRows]);
  ws1["!cols"] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Sold Players");

  // Sheet 2: Unsold Players
  if (data.unsoldPlayers.length > 0) {
    const unsoldHeaders = [["Player Name", "Role", "Base Price"]];
    const unsoldRows = data.unsoldPlayers.map((player) => [
      player.name,
      player.role.replace("_", " "),
      formatCurrency(player.basePrice),
    ]);

    const ws2 = XLSX.utils.aoa_to_sheet([...unsoldHeaders, ...unsoldRows]);
    ws2["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Unsold Players");
  }

  // Sheet 3: Role Statistics
  const roleHeaders = [["Role", "Total", "Sold", "Average Price"]];
  const roleRows = data.roleStats.map((stat) => [
    stat.role.replace("_", " "),
    stat.total,
    stat.sold,
    formatCurrency(stat.avgPrice),
  ]);

  const ws3 = XLSX.utils.aoa_to_sheet([...roleHeaders, ...roleRows]);
  ws3["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Role Statistics");

  return wb;
}

/**
 * Generate Bidding History Excel Report
 */
export function generateBiddingHistoryExcel(data: BiddingHistoryData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: All Bids
  const bidHeaders = [
    ["Date/Time", "Player", "Role", "Team", "Bid Amount"],
  ];
  const bidRows = data.allBids.map((bid) => [
    new Date(bid.createdAt).toLocaleString(),
    bid.player.name,
    bid.player.role.replace("_", " "),
    bid.team.name,
    formatCurrency(bid.amount),
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet([...bidHeaders, ...bidRows]);
  ws1["!cols"] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws1, "All Bids");

  // Sheet 2: Team Bidding Statistics
  const statsHeaders = [
    ["Team", "Total Bids", "Successful Bids", "Success Rate", "Total Bid Amount"],
  ];
  const statsRows = data.teamBiddingStats.map((stat) => [
    stat.teamName,
    stat.totalBids,
    stat.successfulBids,
    `${stat.successRate.toFixed(1)}%`,
    formatCurrency(stat.totalBidAmount),
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet([...statsHeaders, ...statsRows]);
  ws2["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Team Stats");

  return wb;
}

/**
 * Generate Budget Analysis Excel Report
 */
export function generateBudgetAnalysisExcel(data: BudgetAnalysisData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Team Budget Analysis
  const teamHeaders = [
    [
      "Team",
      "Initial Budget",
      "Spent",
      "Remaining",
      "Utilization %",
      "Players",
      "Avg Player Cost",
    ],
  ];
  const teamRows = data.teams.map((team) => [
    team.name,
    formatCurrency(team.initialBudget),
    formatCurrency(team.spent),
    formatCurrency(team.remainingBudget),
    `${team.budgetUtilization.toFixed(1)}%`,
    team.playerCount,
    formatCurrency(team.avgPlayerCost),
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet([...teamHeaders, ...teamRows]);
  ws1["!cols"] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Team Budgets");

  // Sheet 2: Role-wise Spending
  const roleHeaders = [["Role", "Total Spent", "Player Count", "Average Cost"]];
  const roleRows = data.roleSpending.map((role) => [
    role.role.replace("_", " "),
    formatCurrency(role.totalSpent),
    role.playerCount,
    formatCurrency(role.avgCost),
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet([...roleHeaders, ...roleRows]);
  ws2["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Role Spending");

  // Sheet 3: Price Distribution
  const priceHeaders = [["Price Range", "Number of Players"]];
  const priceRows = data.priceDistribution.map((dist) => [dist.range, dist.count]);

  const ws3 = XLSX.utils.aoa_to_sheet([...priceHeaders, ...priceRows]);
  ws3["!cols"] = [{ wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Price Distribution");

  return wb;
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
