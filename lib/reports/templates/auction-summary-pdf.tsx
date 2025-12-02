import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { AuctionSummaryData } from "../report-data";

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: "#1f2937",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
    borderBottom: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 5,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "48%",
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    border: 1,
    borderColor: "#e5e7eb",
  },
  statLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    padding: 8,
    fontWeight: "bold",
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderBottomColor: "#e5e7eb",
    padding: 8,
  },
  tableCell: {
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    borderTop: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  highlightCard: {
    backgroundColor: "#dbeafe",
    padding: 15,
    borderRadius: 4,
    border: 2,
    borderColor: "#3b82f6",
    marginBottom: 15,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 10,
    color: "#1f2937",
    marginBottom: 3,
  },
});

// Format currency
function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Format percentage
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

interface AuctionSummaryPDFProps {
  data: AuctionSummaryData;
}

export const AuctionSummaryPDF: React.FC<AuctionSummaryPDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>CRICKET AUCTION REPORT</Text>
        <Text style={styles.subtitle}>{data.auction.name}</Text>
        <Text style={styles.subtitle}>
          Status: {data.auction.status.replace("_", " ")}
        </Text>
        <Text style={styles.subtitle}>
          Generated: {new Date().toLocaleString()}
        </Text>
      </View>

      {/* Most Expensive Player Highlight */}
      {data.statistics.mostExpensivePlayer && (
        <View style={styles.highlightCard}>
          <Text style={styles.highlightTitle}>MOST EXPENSIVE PLAYER</Text>
          <Text style={styles.highlightText}>
            Name: {data.statistics.mostExpensivePlayer.name}
          </Text>
          <Text style={styles.highlightText}>
            Role: {data.statistics.mostExpensivePlayer.role.replace("_", " ")}
          </Text>
          <Text style={styles.highlightText}>
            Price: {formatCurrency(data.statistics.mostExpensivePlayer.price)}
          </Text>
          <Text style={styles.highlightText}>
            Team: {data.statistics.mostExpensivePlayer.team}
          </Text>
        </View>
      )}

      {/* Key Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KEY STATISTICS</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Players</Text>
            <Text style={styles.statValue}>{data.statistics.totalPlayers}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sold Players</Text>
            <Text style={styles.statValue}>{data.statistics.soldPlayers}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Unsold Players</Text>
            <Text style={styles.statValue}>{data.statistics.unsoldPlayers}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Purse</Text>
            <Text style={styles.statValue}>
              {formatCurrency(data.statistics.totalPurse)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>
              {formatCurrency(data.statistics.totalSpent)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Average Player Price</Text>
            <Text style={styles.statValue}>
              {formatCurrency(data.statistics.averagePlayerPrice)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Highest Price</Text>
            <Text style={styles.statValue}>
              {formatCurrency(data.statistics.highestSoldPrice)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Lowest Price</Text>
            <Text style={styles.statValue}>
              {formatCurrency(data.statistics.lowestSoldPrice)}
            </Text>
          </View>
        </View>
      </View>

      {/* Team Summary Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TEAM SUMMARY</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { width: "25%" }]}>Team</Text>
            <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>
              Players
            </Text>
            <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
              Spent
            </Text>
            <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
              Remaining
            </Text>
            <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
              Util %
            </Text>
          </View>
          {data.teamsSummary.map((team, index) => (
            <View key={team.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: "25%" }]}>{team.name}</Text>
              <Text
                style={[styles.tableCell, { width: "15%", textAlign: "right" }]}
              >
                {team.playerCount}
              </Text>
              <Text
                style={[styles.tableCell, { width: "20%", textAlign: "right" }]}
              >
                {formatCurrency(team.spent)}
              </Text>
              <Text
                style={[styles.tableCell, { width: "20%", textAlign: "right" }]}
              >
                {formatCurrency(team.remainingBudget)}
              </Text>
              <Text
                style={[styles.tableCell, { width: "20%", textAlign: "right" }]}
              >
                {formatPercent(team.budgetUtilization)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>
          Generated by Cricket Auction Management System | Page 1 of 1
        </Text>
      </View>
    </Page>
  </Document>
);
