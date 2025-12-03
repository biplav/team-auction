"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Socket } from "socket.io-client";
import { createSocketClient } from "@/lib/socket-client";
import confetti from "canvas-confetti";
import { getDisplayablePlayerStats } from "@/lib/utils/player-utils";
import { BidCountdownTimer } from "@/components/BidCountdownTimer";

interface Player {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  soldPrice: number | null;
  status: string;
  stats: any;
}

interface TeamPlayer {
  id: string;
  name: string;
  role: string;
  soldPrice: number | null;
}

interface Team {
  id: string;
  name: string;
  logo: string | null;
  color: string | null;
  initialBudget: number;
  remainingBudget: number;
  _count: {
    players: number;
  };
  players?: TeamPlayer[];
}

interface SoldPlayerData {
  playerName: string;
  playerRole: string;
  teamName: string;
  teamColor: string | null;
  soldPrice: number;
}

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  team: {
    id: string;
    name: string;
  };
}

interface Auction {
  id: string;
  name: string;
  status: string;
  currentPlayerId: string | null;
  currentPlayerSetAt: string | null;
  bidTimerSeconds: number;
  timerEnabled: boolean;
}

export default function AuctionDisplayPage() {
  const params = useParams();
  const auctionId = params.id as string;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [soldPlayer, setSoldPlayer] = useState<SoldPlayerData | null>(null);
  const [showSoldAnimation, setShowSoldAnimation] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loadingTeamPlayers, setLoadingTeamPlayers] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchData(true); // Show loader on initial load
    fetchAnalytics(); // Fetch analytics for statistics
  }, [auctionId]);

  useEffect(() => {
    if (auction?.currentPlayerId) {
      fetchCurrentPlayer(auction.currentPlayerId);
    }
  }, [auction?.currentPlayerId]);

  // Poll for bid updates when auction is in progress
  useEffect(() => {
    if (auction?.status === "IN_PROGRESS" && currentPlayer) {
      const interval = setInterval(() => {
        fetchBids(currentPlayer.id);
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [auction?.status, currentPlayer]);

  // Poll for auction updates (current player, status, teams)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false); // Don't show loader during polling
      fetchAnalytics(); // Fetch analytics for statistics
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [auctionId]);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = createSocketClient();

    socketInstance.on("connect", () => {
      console.log("Connected to socket server");
      socketInstance.emit("join-auction", auctionId);
    });

    socketInstance.on("bid-placed", (data) => {
      console.log("New bid received:", data);
      if (data.playerId) {
        fetchBids(data.playerId);
      }
    });

    socketInstance.on("current-player-changed", (data) => {
      console.log("Player changed:", data);
      fetchCurrentPlayer(data.playerId);
    });

    socketInstance.on("player-sold", (data) => {
      console.log("Player sold:", data);

      // Trigger sold animation
      if (data.player && data.team) {
        setSoldPlayer({
          playerName: data.player.name,
          playerRole: data.player.role,
          teamName: data.team.name,
          teamColor: data.team.color,
          soldPrice: data.soldPrice,
        });
        setShowSoldAnimation(true);

        // Fire confetti
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: data.team.color ? [data.team.color] : undefined,
          });
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: data.team.color ? [data.team.color] : undefined,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());

        // Hide animation after 4 seconds
        setTimeout(() => {
          setShowSoldAnimation(false);
          setSoldPlayer(null);
        }, 4000);
      }

      fetchData(false); // Don't show loader on socket updates
    });

    socketInstance.on("auction-paused", () => {
      if (auction) {
        setAuction({ ...auction, status: "PAUSED" });
      }
    });

    socketInstance.on("auction-resumed", () => {
      if (auction) {
        setAuction({ ...auction, status: "IN_PROGRESS" });
      }
    });

    socketInstance.on("bids-discarded", (data) => {
      console.log("Bids discarded:", data);
      if (currentPlayer && data.playerId === currentPlayer.id) {
        setBids([]);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit("leave-auction", auctionId);
      socketInstance.disconnect();
    };
  }, [auctionId]);

  const fetchData = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const auctionRes = await fetch(`/api/auctions/${auctionId}`);

      if (auctionRes.ok) {
        const auctionData = await auctionRes.json();
        setAuction(auctionData);
        setTeams(auctionData.teams || []);

        // Fetch current player if auction has one
        if (auctionData.currentPlayerId) {
          fetchCurrentPlayer(auctionData.currentPlayerId);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const fetchCurrentPlayer = async (playerId: string) => {
    try {
      const res = await fetch(`/api/players/${playerId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentPlayer(data);
        fetchBids(playerId);
      }
    } catch (error) {
      console.error("Error fetching player:", error);
    }
  };

  const fetchBids = async (playerId: string) => {
    try {
      const res = await fetch(`/api/bids?playerId=${playerId}`);
      if (res.ok) {
        const data = await res.json();
        setBids(data);
      }
    } catch (error) {
      console.error("Error fetching bids:", error);
    }
  };

  const fetchTeamPlayers = async (team: Team) => {
    if (team.players && team.players.length > 0) {
      // Already have players data
      setSelectedTeam(team);
      return;
    }

    setLoadingTeamPlayers(true);
    try {
      const res = await fetch(`/api/teams/${team.id}`);
      if (res.ok) {
        const data = await res.json();
        const teamWithPlayers = { ...team, players: data.players || [] };
        setSelectedTeam(teamWithPlayers);

        // Update teams array with player data
        setTeams(teams.map(t => t.id === team.id ? teamWithPlayers : t));
      }
    } catch (error) {
      console.error("Error fetching team players:", error);
    } finally {
      setLoadingTeamPlayers(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}/analytics`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
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

  const highestBid = bids.length > 0 ? bids[0] : null;
  const sortedTeams = [...teams].sort((a, b) => b._count.players - a._count.players);

  // Calculate live statistics
  const calculateStatistics = () => {
    const allPlayers = sortedTeams.flatMap(team => team.players || []);
    const soldPlayers = allPlayers.filter(p => p.soldPrice && p.soldPrice > 0);

    // Most popular (from analytics - player with bids from most unique teams)
    const mostPopular = analytics?.mostPopularPlayer || null;

    // Highest sale (from analytics or calculate locally)
    const highestSale = analytics?.mostExpensivePlayers?.[0] ||
      (soldPlayers.length > 0
        ? soldPlayers.reduce((max, p) => (p.soldPrice || 0) > (max.soldPrice || 0) ? p : max)
        : null);

    // Most wanted (from analytics - player with most total bids)
    const mostWanted = analytics?.mostWantedPlayer || null;

    return { mostPopular, highestSale, mostWanted, soldPlayers };
  };

  // Calculate role distribution for each team
  const getTeamRoleDistribution = (team: Team) => {
    if (!team.players || team.players.length === 0) return {};

    const distribution: Record<string, number> = {};
    team.players.forEach(player => {
      const role = player.role.replace(/_/g, ' ');
      distribution[role] = (distribution[role] || 0) + 1;
    });

    return distribution;
  };

  const statistics = calculateStatistics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading auction...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {auction?.name}
          </h1>
          {auction && (
            <Badge className={`${getStatusColor(auction.status)} text-white text-sm md:text-base lg:text-lg px-4 md:px-6 py-1.5 md:py-2`}>
              {auction.status.replace("_", " ")}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="lg:col-span-2 order-1">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-xl md:text-2xl lg:text-3xl">Current Player</CardTitle>
              </CardHeader>
              <CardContent>
                {currentPlayer ? (
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-6">
                      <div className="flex-1 w-full md:w-auto">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3">{currentPlayer.name}</h2>
                        <Badge className="text-sm md:text-base lg:text-lg px-3 md:px-4 py-1">
                          {currentPlayer.role.replace("_", " ")}
                        </Badge>
                      </div>
                      {(() => {
                        const displayableStats = getDisplayablePlayerStats(currentPlayer.stats);
                        return displayableStats.length > 0 ? (
                          <div className="flex-1 w-full md:w-auto bg-gray-50 p-3 md:p-4 rounded-lg">
                            <p className="text-xs md:text-sm font-bold text-gray-700 mb-2 md:mb-3">Player Info</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-sm">
                              {displayableStats.map((stat) => (
                                <div key={stat.key}>
                                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                                    {stat.label}
                                  </p>
                                  <p className="font-semibold text-gray-900">{stat.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
                      <div className="bg-blue-50 p-4 md:p-6 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600 mb-2">Base Price</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">
                          {formatCurrency(currentPlayer.basePrice)}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 md:p-6 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600 mb-2">Current Bid</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-900">
                          {highestBid ? formatCurrency(highestBid.amount) : "No bids"}
                        </p>
                        {highestBid && (
                          <p className="text-sm text-gray-600 mt-2">
                            by {highestBid.team.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {auction && (
                      <div className="mt-6">
                        <BidCountdownTimer
                          timerSeconds={auction.bidTimerSeconds}
                          lastBidTime={highestBid ? new Date(highestBid.createdAt) : null}
                          currentPlayerSetAt={auction.currentPlayerSetAt ? new Date(auction.currentPlayerSetAt) : null}
                          auctionStatus={auction.status}
                          timerEnabled={auction.timerEnabled}
                          variant="large"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <p className="text-2xl">Waiting for auction to start...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {bids.length > 0 && (
              <Card className="bg-white/95 backdrop-blur mt-4 md:mt-6">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="text-lg md:text-xl lg:text-2xl">Recent Bids</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 md:space-y-3 max-h-64 md:max-h-none overflow-y-auto">
                    {bids.slice(0, 5).map((bid, index) => (
                      <div
                        key={bid.id}
                        className={`p-3 md:p-4 rounded-lg ${
                          index === 0
                            ? "bg-green-100 border-2 border-green-400"
                            : "bg-gray-100"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-base md:text-lg lg:text-xl font-bold">{bid.team.name}</p>
                            <p className="text-xs md:text-sm text-gray-600">
                              {new Date(bid.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg md:text-xl lg:text-2xl font-bold">
                              {formatCurrency(bid.amount)}
                            </p>
                            {index === 0 && (
                              <Badge className="bg-green-600 text-white">
                                Leading
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Statistics */}
            {statistics.soldPlayers.length > 0 && (
              <Card className="bg-white/95 backdrop-blur mt-4 md:mt-6">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="text-lg md:text-xl lg:text-2xl">Auction Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {/* Most Popular */}
                    {statistics.mostPopular && (
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🔥</span>
                          <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide">Most Popular</p>
                        </div>
                        <p className="text-lg font-bold text-purple-900 truncate">{statistics.mostPopular.name}</p>
                        <p className="text-sm text-purple-700">
                          {statistics.mostPopular.uniqueTeamsCount} {statistics.mostPopular.uniqueTeamsCount === 1 ? 'team' : 'teams'} bid
                        </p>
                      </div>
                    )}

                    {/* Highest Sale */}
                    {statistics.highestSale && (
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">💰</span>
                          <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">Highest Sale</p>
                        </div>
                        <p className="text-lg font-bold text-green-900 truncate">{statistics.highestSale.name}</p>
                        <p className="text-sm text-green-700">{formatCurrency(statistics.highestSale.soldPrice || 0)}</p>
                      </div>
                    )}

                    {/* Most Wanted */}
                    {statistics.mostWanted && (
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">⭐</span>
                          <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">Most Wanted</p>
                        </div>
                        <p className="text-lg font-bold text-orange-900 truncate">{statistics.mostWanted.name}</p>
                        <p className="text-sm text-orange-700">
                          {statistics.mostWanted.totalBids} {statistics.mostWanted.totalBids === 1 ? 'bid' : 'bids'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="order-2 lg:order-2">
            <Card className="bg-white/95 backdrop-blur lg:sticky lg:top-8">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-lg md:text-xl lg:text-2xl">Team Standings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  {sortedTeams.map((team, index) => {
                    const roleDistribution = getTeamRoleDistribution(team);
                    const budgetUsedPercent = ((team.initialBudget - team.remainingBudget) / team.initialBudget) * 100;

                    return (
                      <div key={team.id} className="p-3 md:p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg md:text-xl lg:text-2xl font-bold text-gray-400">
                              #{index + 1}
                            </span>
                            <span className="font-bold text-sm md:text-base lg:text-lg">{team.name}</span>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Badge
                                variant="outline"
                                className="text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => fetchTeamPlayers(team)}
                              >
                                {team._count.players} players
                              </Badge>
                            </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>{team.name} - Squad</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              {loadingTeamPlayers ? (
                                <div className="text-center py-8 text-gray-500">
                                  Loading players...
                                </div>
                              ) : selectedTeam?.id === team.id && selectedTeam?.players ? (
                                selectedTeam.players.length > 0 ? (
                                  <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {selectedTeam.players.map((player) => (
                                      <div
                                        key={player.id}
                                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                      >
                                        <div>
                                          <p className="font-semibold">{player.name}</p>
                                          <p className="text-xs text-gray-600">
                                            {player.role.replace("_", " ")}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold text-sm">
                                            {player.soldPrice ? formatCurrency(player.soldPrice) : "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    No players purchased yet
                                  </div>
                                )
                              ) : null}
                            </div>
                          </DialogContent>
                        </Dialog>
                        </div>

                        {/* Budget Utilization */}
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Budget Used</span>
                            <span className="font-medium">
                              {budgetUsedPercent.toFixed(1)}% ({formatCurrency(team.initialBudget - team.remainingBudget)})
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                budgetUsedPercent < 50
                                  ? "bg-gradient-to-r from-green-400 to-green-500"
                                  : budgetUsedPercent < 75
                                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                                  : "bg-gradient-to-r from-red-400 to-red-500"
                              }`}
                              style={{
                                width: `${budgetUsedPercent}%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>₹0</span>
                            <span>{formatCurrency(team.initialBudget)}</span>
                          </div>
                        </div>

                        {/* Role Distribution */}
                        {Object.keys(roleDistribution).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-2">Squad Composition</p>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(roleDistribution).map(([role, count]) => (
                                <div key={role} className="flex items-center gap-2 text-xs">
                                  <span className={`w-2 h-2 rounded-full ${
                                    role.includes('BATSMAN') || role.includes('Batsman')
                                      ? 'bg-blue-500'
                                      : role.includes('BOWLER') || role.includes('Bowler')
                                      ? 'bg-red-500'
                                      : role.includes('ALL') || role.includes('All')
                                      ? 'bg-purple-500'
                                      : 'bg-green-500'
                                  }`}></span>
                                  <span className="text-gray-700">{role}: <strong>{count}</strong></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sold Animation Overlay */}
      {showSoldAnimation && soldPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="relative w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto">
            {/* SOLD Banner */}
            <div className="mb-6 md:mb-8 animate-in slide-in-from-top duration-500">
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-center text-white drop-shadow-2xl tracking-wider">
                🎊 SOLD! 🎊
              </h1>
            </div>

            {/* Player & Team Card */}
            <div
              className="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl animate-in zoom-in duration-700"
              style={{
                background: soldPlayer.teamColor
                  ? `linear-gradient(135deg, ${soldPlayer.teamColor}22 0%, ${soldPlayer.teamColor}88 100%)`
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.6) 100%)",
                border: soldPlayer.teamColor ? `3px solid ${soldPlayer.teamColor}` : "3px solid #3b82f6",
              }}
            >
              <div className="p-6 md:p-10 lg:p-12 bg-white/95 backdrop-blur">
                {/* Player Name */}
                <div className="mb-4 md:mb-6 text-center animate-in slide-in-from-left duration-700 delay-300">
                  <p className="text-base md:text-xl lg:text-2xl text-gray-600 mb-2 font-medium">Player</p>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-3">{soldPlayer.playerName}</h2>
                  <Badge className="text-sm md:text-base lg:text-xl px-4 md:px-6 py-1.5 md:py-2 bg-gray-800 text-white">
                    {soldPlayer.playerRole.replace("_", " ")}
                  </Badge>
                </div>

                {/* Divider */}
                <div className="my-6 md:my-8 border-t-2 md:border-t-4 border-gray-300"></div>

                {/* Team & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 animate-in slide-in-from-right duration-700 delay-500">
                  {/* Team */}
                  <div className="text-center">
                    <p className="text-base md:text-xl lg:text-2xl text-gray-600 mb-2 md:mb-3 font-medium">Bought By</p>
                    <div
                      className="inline-block px-6 md:px-8 py-4 md:py-6 rounded-xl md:rounded-2xl text-white shadow-xl"
                      style={{
                        backgroundColor: soldPlayer.teamColor || "#3b82f6",
                      }}
                    >
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-black">{soldPlayer.teamName}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    <p className="text-base md:text-xl lg:text-2xl text-gray-600 mb-2 md:mb-3 font-medium">Final Price</p>
                    <div className="inline-block px-6 md:px-8 py-4 md:py-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-xl">
                      <PriceCountUp targetPrice={soldPlayer.soldPrice} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute -top-10 md:-top-20 -left-10 md:-left-20 w-20 md:w-40 h-20 md:h-40 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-10 md:-bottom-20 -right-10 md:-right-20 w-20 md:w-40 h-20 md:h-40 bg-white/20 rounded-full blur-3xl animate-pulse delay-300"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Price Count-Up Component
function PriceCountUp({ targetPrice }: { targetPrice: number }) {
  const [displayPrice, setDisplayPrice] = useState(0);

  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = targetPrice / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayPrice(targetPrice);
        clearInterval(timer);
      } else {
        setDisplayPrice(Math.floor(increment * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [targetPrice]);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    return `₹${amount.toLocaleString()}`;
  };

  return <h3 className="text-5xl font-black">{formatCurrency(displayPrice)}</h3>;
}
