"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TeamOwnerNav } from "@/components/team-owner-nav";
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
import { ArrowLeft, Users, DollarSign } from "lucide-react";
import Link from "next/link";

interface Player {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  soldPrice: number | null;
  stats: any;
}

interface Team {
  id: string;
  name: string;
  initialBudget: number;
  remainingBudget: number;
  auction: {
    id: string;
    name: string;
    status: string;
  };
  players: Player[];
}

export default function TeamRosterPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // Allow both ADMIN and TEAM_OWNER roles
    if (status === "authenticated" && session?.user) {
      if (session.user.role !== "ADMIN" && session.user.role !== "TEAM_OWNER") {
        router.push("/");
        return;
      }
      fetchTeam();
    }
  }, [session, status, router, teamId]);

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/team-owner/team/${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setTeam(data);
      } else {
        router.push("/team-owner/dashboard");
      }
    } catch (error) {
      console.error("Error fetching team:", error);
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

  const calculateTotalSpent = () => {
    if (!team) return 0;
    return team.initialBudget - team.remainingBudget;
  };

  const groupPlayersByRole = () => {
    if (!team) return {};

    return team.players.reduce((acc: any, player) => {
      if (!acc[player.role]) {
        acc[player.role] = [];
      }
      acc[player.role].push(player);
      return acc;
    }, {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card>
          <CardContent className="py-12">
            <p className="text-center">Team not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const playersByRole = groupPlayersByRole();

  return (
    <>
      <TeamOwnerNav />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/team-owner/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
              <p className="text-muted-foreground">{team.auction.name}</p>
            </div>
            {team.auction.status === "IN_PROGRESS" && (
              <Button asChild size="lg">
                <Link href={`/auction/${team.auction.id}/bid`}>
                  Join Bidding
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{team.players.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(team.initialBudget)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(calculateTotalSpent())}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(team.remainingBudget)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>
              {((calculateTotalSpent() / team.initialBudget) * 100).toFixed(1)}% of
              budget used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${
                  team.remainingBudget > team.initialBudget * 0.5
                    ? "bg-green-500"
                    : team.remainingBudget > team.initialBudget * 0.2
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${(calculateTotalSpent() / team.initialBudget) * 100}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        {team.players.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Players Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't bought any players yet
              </p>
              {team.auction.status === "IN_PROGRESS" && (
                <Button asChild>
                  <Link href={`/auction/${team.auction.id}/bid`}>
                    Start Bidding
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* All Players Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Players ({team.players.length})</CardTitle>
                <CardDescription>Complete roster of your team</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Bought For</TableHead>
                      <TableHead>Batting</TableHead>
                      <TableHead>Bowling</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {player.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(player.basePrice)}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatCurrency(player.soldPrice || 0)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {player.stats?.battingStyle || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {player.stats?.bowlingStyle || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Players by Role */}
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(playersByRole).map(([role, players]: [string, any]) => (
                <Card key={role}>
                  <CardHeader>
                    <CardTitle>
                      {role.replace("_", " ")} ({players.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {players.map((player: Player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                        >
                          <div>
                            <p className="font-semibold">{player.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {player.stats?.battingStyle || ""}{" "}
                              {player.stats?.bowlingStyle
                                ? `• ${player.stats.bowlingStyle}`
                                : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {formatCurrency(player.soldPrice || 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Base: {formatCurrency(player.basePrice)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
