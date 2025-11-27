"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Gavel,
  Users,
  TrendingUp,
  Upload,
  Eye,
  BarChart3,
  Clock,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  Zap,
  Shield,
  Sparkles
} from "lucide-react";

interface PublicAuction {
  id: string;
  name: string;
  status: "DRAFT" | "UPCOMING" | "IN_PROGRESS" | "COMPLETED";
  totalTeams: number;
  totalPlayers: number;
  soldPlayers: number;
  remainingPlayers: number;
  currentPlayer: {
    name: string;
    role: string;
    basePrice: number;
  } | null;
  latestBidAmount: number;
  createdAt: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [auctions, setAuctions] = useState<PublicAuction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const res = await fetch("/api/auctions/public");
      if (res.ok) {
        const data = await res.json();
        setAuctions(data);
      }
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return <Badge className="bg-green-500">LIVE</Badge>;
      case "UPCOMING":
        return <Badge className="bg-blue-500">UPCOMING</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary">COMPLETED</Badge>;
      default:
        return <Badge variant="outline">DRAFT</Badge>;
    }
  };

  const getDashboardLink = () => {
    if (!session?.user) return null;
    if (session.user.role === "ADMIN") return "/admin/auctions";
    if (session.user.role === "TEAM_OWNER") return "/team-owner/dashboard";
    return null;
  };

  const liveAuctions = auctions.filter(a => a.status === "IN_PROGRESS");
  const upcomingAuctions = auctions.filter(a => a.status === "UPCOMING" || a.status === "DRAFT");

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Gavel className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">Cricket Auction</span>
          </div>
          <div className="flex gap-3">
            {session?.user ? (
              <Button asChild>
                <Link href={getDashboardLink() || "/"}>
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Dashboard Banner for Logged-in Users */}
      {session?.user && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-900">
                Signed in as <strong>{session.user.name}</strong> ({session.user.role})
              </span>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={getDashboardLink() || "/"}>Continue to Dashboard</Link>
            </Button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4" variant="outline">
              <Sparkles className="h-3 w-3 mr-1" />
              Professional Auction Platform
            </Badge>
            <h1 className="text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Host Cricket Player
              <br />
              <span className="text-blue-600">Auctions in Real-Time</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Complete auction management platform for cricket tournaments.
              Real-time bidding, team management, analytics, and public display screens.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {!session?.user && (
                <Button size="lg" asChild>
                  <Link href="/auth/signin">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Start Your Auction
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild>
                <Link href="#live-auctions">
                  <Eye className="mr-2 h-5 w-5" />
                  Watch Live Auctions
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Live Auctions Section */}
        <section id="live-auctions" className="py-16 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              {liveAuctions.length > 0 ? "Live Auctions" : "Recent Auctions"}
            </h2>
            <p className="text-lg text-slate-600">
              {liveAuctions.length > 0
                ? "Watch auctions happening right now"
                : "Check out our auction platform"}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : liveAuctions.length > 0 || upcomingAuctions.length > 0 ? (
            <>
              {/* Live Auctions */}
              {liveAuctions.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Live Now
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {liveAuctions.map((auction) => (
                      <Card key={auction.id} className="border-2 border-green-200 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start mb-2">
                            <CardTitle className="text-xl">{auction.name}</CardTitle>
                            {getStatusBadge(auction.status)}
                          </div>
                          {auction.currentPlayer && (
                            <CardDescription className="text-base">
                              <strong>Current:</strong> {auction.currentPlayer.name}
                              <br />
                              <span className="text-xs">{auction.currentPlayer.role}</span>
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 mb-4">
                            {auction.latestBidAmount > 0 && (
                              <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                                <span className="text-sm font-medium">Latest Bid</span>
                                <span className="text-lg font-bold text-green-600">
                                  {formatCurrency(auction.latestBidAmount)}
                                </span>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <div className="text-slate-600">Teams</div>
                                <div className="font-semibold">{auction.totalTeams}</div>
                              </div>
                              <div>
                                <div className="text-slate-600">Remaining</div>
                                <div className="font-semibold">{auction.remainingPlayers}</div>
                              </div>
                            </div>
                            <div className="text-xs text-slate-500">
                              {auction.soldPlayers} / {auction.totalPlayers} players sold
                            </div>
                          </div>
                          <Button asChild className="w-full">
                            <Link href={`/auction/${auction.id}/display`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Watch Live
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Auctions */}
              {upcomingAuctions.length > 0 && (
                <div>
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {liveAuctions.length > 0 ? "Upcoming" : "Available Auctions"}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingAuctions.slice(0, 6).map((auction) => (
                      <Card key={auction.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start mb-2">
                            <CardTitle className="text-xl">{auction.name}</CardTitle>
                            {getStatusBadge(auction.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <div className="text-slate-600">Teams</div>
                              <div className="font-semibold">{auction.totalTeams}</div>
                            </div>
                            <div>
                              <div className="text-slate-600">Players</div>
                              <div className="font-semibold">{auction.totalPlayers}</div>
                            </div>
                          </div>
                          <Button asChild className="w-full" variant="outline">
                            <Link href={`/auction/${auction.id}/display`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card className="max-w-md mx-auto text-center py-12">
              <CardContent>
                <Gavel className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 mb-4">No auctions available yet</p>
                {!session?.user && (
                  <Button asChild>
                    <Link href="/auth/signin">Sign In to Create Auction</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-slate-50 -mx-4 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
              <p className="text-lg text-slate-600">Three simple steps to run your cricket auction</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-blue-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">1. Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Create your auction, add teams, and upload players via CSV.
                    Set budgets and configure auction rules.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-green-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                    <Gavel className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">2. Auction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Conduct live auctions with real-time bidding.
                    Teams bid on players, with instant updates across all screens.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-purple-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">3. Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    View comprehensive analytics, export team rosters,
                    and share results with participants.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features</h2>
              <p className="text-lg text-slate-600">Everything you need to run professional cricket auctions</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 text-yellow-500 mb-2" />
                  <CardTitle>Real-Time Bidding</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Lightning-fast bid updates using Socket.IO. All screens sync instantly.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-blue-500 mb-2" />
                  <CardTitle>Team Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Manage multiple teams, track budgets, and view complete rosters.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Eye className="h-8 w-8 text-green-500 mb-2" />
                  <CardTitle>Public Display</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Full-screen display mode perfect for projectors and large screens.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-purple-500 mb-2" />
                  <CardTitle>Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Comprehensive stats, price trends, and team performance insights.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Upload className="h-8 w-8 text-orange-500 mb-2" />
                  <CardTitle>CSV Import</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Bulk upload players from spreadsheets. Simple format, quick setup.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-red-500 mb-2" />
                  <CardTitle>Secure & Reliable</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Role-based access, data validation, and audit trails for all actions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!session?.user && (
          <section className="py-16 text-center">
            <Card className="max-w-3xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 border-2">
              <CardContent className="py-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  Ready to host your cricket auction?
                </h2>
                <p className="text-lg text-slate-600 mb-6">
                  Sign in to create your first auction in minutes
                </p>
                <Button size="lg" asChild>
                  <Link href="/auth/signin">
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Gavel className="h-5 w-5 text-blue-600" />
                <span className="font-bold">Cricket Auction</span>
              </div>
              <p className="text-sm text-slate-600">
                Professional auction management platform for cricket tournaments.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <Link href="/auth/signin" className="text-slate-600 hover:text-blue-600">
                    Sign In
                  </Link>
                </div>
                <div>
                  <Link href="#live-auctions" className="text-slate-600 hover:text-blue-600">
                    Live Auctions
                  </Link>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <p className="text-sm text-slate-600">
                Built with Next.js, React, TypeScript, Prisma, and Socket.IO
              </p>
            </div>
          </div>
          <div className="text-center text-sm text-slate-500 pt-8 border-t">
            <p>&copy; {new Date().getFullYear()} Cricket Auction Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
