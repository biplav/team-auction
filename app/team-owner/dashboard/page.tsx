"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Trophy, Users, DollarSign, TrendingUp } from "lucide-react";

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
  players: Array<{
    id: string;
    name: string;
    role: string;
    soldPrice: number;
  }>;
  _count: {
    players: number;
  };
}

export default function TeamOwnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
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
      fetchMyTeams();
    }
  }, [session, status, router]);

  const fetchMyTeams = async () => {
    try {
      const response = await fetch("/api/team-owner/my-teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-gray-500";
      case "IN_PROGRESS":
        return "bg-green-500";
      case "PAUSED":
        return "bg-yellow-500";
      case "COMPLETED":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const calculateTotalSpent = (team: Team) => {
    return team.initialBudget - team.remainingBudget;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <TeamOwnerNav />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Team Owner Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name}
          </p>
        </div>

        {teams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Teams Assigned</h3>
              <p className="text-muted-foreground mb-4">
                You haven't been assigned to any teams yet. Please contact the
                admin.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Teams
                  </CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teams.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Players
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {teams.reduce((sum, team) => sum + team._count.players, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Spent
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      teams.reduce((sum, team) => sum + calculateTotalSpent(team), 0)
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Remaining Budget
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      teams.reduce((sum, team) => sum + team.remainingBudget, 0)
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Teams Tabs */}
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All Teams ({teams.length})</TabsTrigger>
                <TabsTrigger value="active">
                  Active Auctions (
                  {teams.filter((t) => t.auction.status === "IN_PROGRESS").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {teams.map((team) => (
                    <Card key={team.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl mb-2">
                              {team.name}
                            </CardTitle>
                            <CardDescription>{team.auction.name}</CardDescription>
                          </div>
                          <Badge className={getStatusColor(team.auction.status)}>
                            {team.auction.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Players</p>
                              <p className="text-xl font-bold text-blue-900">
                                {team._count.players}
                              </p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Spent</p>
                              <p className="text-xl font-bold text-green-900">
                                {formatCurrency(calculateTotalSpent(team))}
                              </p>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Budget</span>
                              <span className="font-medium">
                                {formatCurrency(team.remainingBudget)} remaining
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  team.remainingBudget > team.initialBudget * 0.5
                                    ? "bg-green-500"
                                    : team.remainingBudget > team.initialBudget * 0.2
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{
                                  width: `${
                                    (team.remainingBudget / team.initialBudget) * 100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button asChild className="flex-1">
                              <Link href={`/team-owner/team/${team.id}`}>
                                View Roster
                              </Link>
                            </Button>
                            {team.auction.status === "IN_PROGRESS" && (
                              <Button asChild variant="default" className="flex-1">
                                <Link href={`/auction/${team.auction.id}/bid`}>
                                  Join Bidding
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {teams
                    .filter((team) => team.auction.status === "IN_PROGRESS")
                    .map((team) => (
                      <Card
                        key={team.id}
                        className="hover:shadow-lg transition-shadow border-green-200"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xl mb-2">
                                {team.name}
                              </CardTitle>
                              <CardDescription>{team.auction.name}</CardDescription>
                            </div>
                            <Badge className="bg-green-500 animate-pulse">
                              LIVE
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                              <p className="text-sm text-green-800 font-semibold mb-2">
                                Auction is Live!
                              </p>
                              <p className="text-sm text-green-700">
                                Join now to bid on players
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Players</p>
                                <p className="text-lg font-bold">
                                  {team._count.players}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Budget Left</p>
                                <p className="text-lg font-bold text-green-600">
                                  {formatCurrency(team.remainingBudget)}
                                </p>
                              </div>
                            </div>

                            <Button asChild size="lg" className="w-full">
                              <Link href={`/auction/${team.auction.id}/bid`}>
                                Join Bidding Now
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {teams.filter((team) => team.auction.status === "IN_PROGRESS")
                    .length === 0 && (
                    <Card className="col-span-2">
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                          No active auctions at the moment
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
