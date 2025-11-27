"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  auction: {
    id: string;
    name: string;
    status: string;
  };
  overview: {
    totalPlayers: number;
    soldPlayers: number;
    unsoldPlayers: number;
    availablePlayers: number;
    totalRevenue: number;
    totalBids: number;
  };
  roleDistribution: { [key: string]: number };
  statusDistribution: {
    SOLD: number;
    UNSOLD: number;
    AVAILABLE: number;
  };
  priceRanges: { [key: string]: number };
  teamStats: Array<{
    id: string;
    name: string;
    playersCount: number;
    totalSpent: number;
    remainingBudget: number;
    initialBudget: number;
    budgetUtilization: string;
    avgPlayerPrice: number;
  }>;
  mostExpensivePlayers: Array<{
    id: string;
    name: string;
    role: string;
    soldPrice: number;
    teamName: string;
  }>;
  unsoldPlayers: Array<{
    id: string;
    name: string;
    role: string;
    basePrice: number;
  }>;
  recentActivity: Array<{
    id: string;
    teamName: string;
    playerName: string;
    amount: number;
    createdAt: string;
  }>;
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [auctionId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}/analytics`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">No data available</div>
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
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">{data.auction.name}</p>
          </div>
          <Badge
            className={
              data.auction.status === "IN_PROGRESS"
                ? "bg-green-500"
                : data.auction.status === "COMPLETED"
                ? "bg-blue-500"
                : "bg-gray-500"
            }
          >
            {data.auction.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.soldPlayers} sold, {data.overview.unsoldPlayers} unsold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.overview.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {data.overview.soldPlayers} sold players
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalBids}</div>
            <p className="text-xs text-muted-foreground">Across all players</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Price/Player</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.soldPlayers > 0
                ? formatCurrency(
                    data.overview.totalRevenue / data.overview.soldPlayers
                  )
                : "₹0"}
            </div>
            <p className="text-xs text-muted-foreground">Average selling price</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teams">Team Analysis</TabsTrigger>
          <TabsTrigger value="players">Player Stats</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Team Analysis Tab */}
        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Statistics</CardTitle>
              <CardDescription>Budget utilization and spending analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Players</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Remaining Budget</TableHead>
                    <TableHead>Budget Used</TableHead>
                    <TableHead>Avg/Player</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.teamStats
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.playersCount}</TableCell>
                        <TableCell>{formatCurrency(team.totalSpent)}</TableCell>
                        <TableCell>
                          <span
                            className={
                              team.remainingBudget < team.initialBudget * 0.2
                                ? "text-red-600 font-semibold"
                                : ""
                            }
                          >
                            {formatCurrency(team.remainingBudget)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${team.budgetUtilization}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{team.budgetUtilization}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(team.avgPlayerPrice)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Player Stats Tab */}
        <TabsContent value="players" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Most Expensive Players</CardTitle>
                <CardDescription>Top 10 highest sold players</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.mostExpensivePlayers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{player.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {player.role.replace("_", " ")} • {player.teamName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(player.soldPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unsold Players</CardTitle>
                <CardDescription>
                  {data.unsoldPlayers.length} players remain unsold
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto space-y-2">
                  {data.unsoldPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div>
                        <p className="font-semibold">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {player.role.replace("_", " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Base Price</p>
                        <p className="font-medium">
                          {formatCurrency(player.basePrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Players by Role</CardTitle>
                <CardDescription>Distribution across different roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.roleDistribution).map(([role, count]) => (
                    <div key={role}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {role.replace("_", " ")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count} players (
                          {((count / data.overview.totalPlayers) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / data.overview.totalPlayers) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price Range Distribution</CardTitle>
                <CardDescription>Players sold in different price ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.priceRanges).map(([range, count]) => (
                    <div key={range}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{range}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} players
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${
                              data.overview.soldPlayers > 0
                                ? (count / data.overview.soldPlayers) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Overall auction progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <p className="text-3xl font-bold text-green-600">
                    {data.statusDistribution.SOLD}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Sold</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50">
                  <p className="text-3xl font-bold text-red-600">
                    {data.statusDistribution.UNSOLD}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Unsold</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <p className="text-3xl font-bold text-gray-600">
                    {data.statusDistribution.AVAILABLE}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bidding Activity</CardTitle>
              <CardDescription>Latest 20 bids across all players</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Bid Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        {new Date(activity.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {activity.teamName}
                      </TableCell>
                      <TableCell>{activity.playerName}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(activity.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
