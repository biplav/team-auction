import { renderToBuffer } from "@react-pdf/renderer";
import type { ComprehensiveReportData } from "./report-data";

/**
 * Generate Comprehensive Report PDF
 */
export async function generateComprehensiveReportPDF(
  data: ComprehensiveReportData
): Promise<Buffer> {
  const { Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer");

  const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 9 },
    title: { fontSize: 18, marginBottom: 10, fontWeight: "bold" },
    section: { marginBottom: 12, marginTop: 8 },
    sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 5, backgroundColor: "#f0f0f0", padding: 4 },
    row: { flexDirection: "row", marginBottom: 3, fontSize: 8 },
    col: { flex: 1 },
    label: { fontWeight: "bold", fontSize: 8 },
    tableHeader: { flexDirection: "row", backgroundColor: "#e0e0e0", padding: 4, marginBottom: 2, fontSize: 8, fontWeight: "bold" },
    tableRow: { flexDirection: "row", padding: 3, borderBottom: "0.5px solid #ccc", fontSize: 7 },
    teamSection: { marginBottom: 15, padding: 8, border: "1px solid #ccc" },
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const doc = (
    <Document>
      {/* Page 1: Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>COMPREHENSIVE AUCTION REPORT</Text>
        <Text style={{ fontSize: 12, marginBottom: 15 }}>{data.auction.name} - {data.auction.sport}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KEY STATISTICS</Text>
          <View style={styles.row}><Text style={styles.label}>Total Players:</Text><Text>{data.statistics.totalPlayers}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Sold:</Text><Text>{data.statistics.soldPlayers}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Unsold:</Text><Text>{data.statistics.unsoldPlayers}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Total Purse:</Text><Text>{formatCurrency(data.statistics.totalPurse)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Total Spent:</Text><Text>{formatCurrency(data.statistics.totalSpent)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Avg Price:</Text><Text>{formatCurrency(data.statistics.averagePlayerPrice)}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TEAM SUMMARY</Text>
          <View style={styles.tableHeader}>
            <Text style={{ width: "20%" }}>Team</Text>
            <Text style={{ width: "15%" }}>Players</Text>
            <Text style={{ width: "20%" }}>Spent</Text>
            <Text style={{ width: "20%" }}>Remaining</Text>
            <Text style={{ width: "15%" }}>Util%</Text>
          </View>
          {data.teamsWithPlayers.map((team, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ width: "20%" }}>{team.name}</Text>
              <Text style={{ width: "15%" }}>{team.playerCount}</Text>
              <Text style={{ width: "20%" }}>{formatCurrency(team.spent)}</Text>
              <Text style={{ width: "20%" }}>{formatCurrency(team.remainingBudget)}</Text>
              <Text style={{ width: "15%" }}>{team.budgetUtilization.toFixed(1)}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TOP 10 MOST EXPENSIVE PLAYERS</Text>
          <View style={styles.tableHeader}>
            <Text style={{ width: "10%" }}>Rank</Text>
            <Text style={{ width: "30%" }}>Player</Text>
            <Text style={{ width: "20%" }}>Role</Text>
            <Text style={{ width: "20%" }}>Team</Text>
            <Text style={{ width: "20%" }}>Price</Text>
          </View>
          {data.top10MostExpensivePlayers.map((player, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ width: "10%" }}>{i + 1}</Text>
              <Text style={{ width: "30%" }}>{player.name}</Text>
              <Text style={{ width: "20%" }}>{player.role.replace("_", " ")}</Text>
              <Text style={{ width: "20%" }}>{player.team.name}</Text>
              <Text style={{ width: "20%" }}>{formatCurrency(player.soldPrice)}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* Page 2+: Team Squads */}
      {data.teamsWithPlayers.map((team, teamIdx) => (
        <Page key={teamIdx} size="A4" style={styles.page}>
          <Text style={styles.title}>{team.name}</Text>
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 9 }}>Owner: {team.ownerName || "N/A"}</Text>
            <Text style={{ fontSize: 9 }}>Budget: {formatCurrency(team.initialBudget)} | Spent: {formatCurrency(team.spent)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SQUAD ({team.playerCount} Players)</Text>
            <View style={styles.tableHeader}>
              <Text style={{ width: "40%" }}>Player Name</Text>
              <Text style={{ width: "25%" }}>Role</Text>
              <Text style={{ width: "20%" }}>Base</Text>
              <Text style={{ width: "20%" }}>Sold</Text>
            </View>
            {team.players.map((player, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={{ width: "40%" }}>{player.name}</Text>
                <Text style={{ width: "25%" }}>{player.role.replace("_", " ")}</Text>
                <Text style={{ width: "20%" }}>{formatCurrency(player.basePrice)}</Text>
                <Text style={{ width: "20%" }}>{formatCurrency(player.soldPrice)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ROLE DISTRIBUTION</Text>
            <View style={styles.row}><Text>Batsmen: {team.roleDistribution.BATSMAN}</Text></View>
            <View style={styles.row}><Text>Bowlers: {team.roleDistribution.BOWLER}</Text></View>
            <View style={styles.row}><Text>All-Rounders: {team.roleDistribution.ALL_ROUNDER}</Text></View>
            <View style={styles.row}><Text>Wicket-Keepers: {team.roleDistribution.WICKET_KEEPER}</Text></View>
          </View>
        </Page>
      ))}

      {/* Last Page: Analysis */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>BUDGET & ROLE ANALYSIS</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ROLE-WISE SPENDING</Text>
          <View style={styles.tableHeader}>
            <Text style={{ width: "30%" }}>Role</Text>
            <Text style={{ width: "25%" }}>Total Spent</Text>
            <Text style={{ width: "20%" }}>Players</Text>
            <Text style={{ width: "25%" }}>Avg Cost</Text>
          </View>
          {data.roleSpending.map((rs, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ width: "30%" }}>{rs.role.replace("_", " ")}</Text>
              <Text style={{ width: "25%" }}>{formatCurrency(rs.totalSpent)}</Text>
              <Text style={{ width: "20%" }}>{rs.playerCount}</Text>
              <Text style={{ width: "25%" }}>{formatCurrency(rs.avgCost)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BIDDING STATISTICS</Text>
          <View style={styles.tableHeader}>
            <Text style={{ width: "30%" }}>Team</Text>
            <Text style={{ width: "20%" }}>Bids</Text>
            <Text style={{ width: "20%" }}>Won</Text>
            <Text style={{ width: "20%" }}>Success%</Text>
          </View>
          {data.teamBiddingStats.map((stat, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ width: "30%" }}>{stat.teamName}</Text>
              <Text style={{ width: "20%" }}>{stat.totalBids}</Text>
              <Text style={{ width: "20%" }}>{stat.successfulBids}</Text>
              <Text style={{ width: "20%" }}>{stat.successRate.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );

  const pdfBuffer = await renderToBuffer(doc);
  return pdfBuffer;
}
