"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import io, { Socket } from "socket.io-client";
import confetti from "canvas-confetti";

interface Player {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  soldPrice: number | null;
  status: string;
  stats: any;
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

  useEffect(() => {
    fetchData(true); // Show loader on initial load
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
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [auctionId]);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io({
      path: "/api/socket",
    });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading auction...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            {auction?.name}
          </h1>
          {auction && (
            <Badge className={`${getStatusColor(auction.status)} text-white text-lg px-6 py-2`}>
              {auction.status.replace("_", " ")}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-3xl">Current Player</CardTitle>
              </CardHeader>
              <CardContent>
                {currentPlayer ? (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <h2 className="text-5xl font-bold mb-3">{currentPlayer.name}</h2>
                        <Badge className="text-lg px-4 py-1">
                          {currentPlayer.role.replace("_", " ")}
                        </Badge>
                      </div>
                      {currentPlayer.stats && Object.keys(currentPlayer.stats).length > 0 && (
                        <div className="flex-1 bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm font-bold text-gray-700 mb-3">Player Info</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {Object.entries(currentPlayer.stats).map(([key, value]) => {
                              // Mask phone numbers
                              const displayValue = key.toLowerCase().includes('phone') && String(value).length > 4
                                ? `****${String(value).slice(-4)}`
                                : String(value);

                              return (
                                <div key={key}>
                                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </p>
                                  <p className="font-semibold text-gray-900">{displayValue}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-8">
                      <div className="bg-blue-50 p-6 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Base Price</p>
                        <p className="text-3xl font-bold text-blue-900">
                          {formatCurrency(currentPlayer.basePrice)}
                        </p>
                      </div>
                      <div className="bg-green-50 p-6 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Current Bid</p>
                        <p className="text-3xl font-bold text-green-900">
                          {highestBid ? formatCurrency(highestBid.amount) : "No bids"}
                        </p>
                        {highestBid && (
                          <p className="text-sm text-gray-600 mt-2">
                            by {highestBid.team.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <p className="text-2xl">Waiting for auction to start...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {bids.length > 0 && (
              <Card className="bg-white/95 backdrop-blur mt-6">
                <CardHeader>
                  <CardTitle className="text-2xl">Recent Bids</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bids.slice(0, 5).map((bid, index) => (
                      <div
                        key={bid.id}
                        className={`p-4 rounded-lg ${
                          index === 0
                            ? "bg-green-100 border-2 border-green-400"
                            : "bg-gray-100"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xl font-bold">{bid.team.name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(bid.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
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
          </div>

          <div>
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">Team Standings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedTeams.map((team, index) => (
                    <div key={team.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-400">
                            #{index + 1}
                          </span>
                          <span className="font-bold text-lg">{team.name}</span>
                        </div>
                        <Badge variant="outline" className="text-sm">
                          {team._count.players} players
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Budget</span>
                          <span className="font-medium">
                            {formatCurrency(team.remainingBudget)}
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
                              width: `${(team.remainingBudget / team.initialBudget) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sold Animation Overlay */}
      {showSoldAnimation && soldPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl mx-8">
            {/* SOLD Banner */}
            <div className="mb-8 animate-in slide-in-from-top duration-500">
              <h1 className="text-9xl font-black text-center text-white drop-shadow-2xl tracking-wider">
                🎊 SOLD! 🎊
              </h1>
            </div>

            {/* Player & Team Card */}
            <div
              className="relative overflow-hidden rounded-3xl shadow-2xl animate-in zoom-in duration-700"
              style={{
                background: soldPlayer.teamColor
                  ? `linear-gradient(135deg, ${soldPlayer.teamColor}22 0%, ${soldPlayer.teamColor}88 100%)`
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.6) 100%)",
                border: soldPlayer.teamColor ? `4px solid ${soldPlayer.teamColor}` : "4px solid #3b82f6",
              }}
            >
              <div className="p-12 bg-white/95 backdrop-blur">
                {/* Player Name */}
                <div className="mb-6 text-center animate-in slide-in-from-left duration-700 delay-300">
                  <p className="text-2xl text-gray-600 mb-2 font-medium">Player</p>
                  <h2 className="text-6xl font-black text-gray-900 mb-3">{soldPlayer.playerName}</h2>
                  <Badge className="text-xl px-6 py-2 bg-gray-800 text-white">
                    {soldPlayer.playerRole.replace("_", " ")}
                  </Badge>
                </div>

                {/* Divider */}
                <div className="my-8 border-t-4 border-gray-300"></div>

                {/* Team & Price */}
                <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-right duration-700 delay-500">
                  {/* Team */}
                  <div className="text-center">
                    <p className="text-2xl text-gray-600 mb-3 font-medium">Bought By</p>
                    <div
                      className="inline-block px-8 py-6 rounded-2xl text-white shadow-xl"
                      style={{
                        backgroundColor: soldPlayer.teamColor || "#3b82f6",
                      }}
                    >
                      <h3 className="text-4xl font-black">{soldPlayer.teamName}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    <p className="text-2xl text-gray-600 mb-3 font-medium">Final Price</p>
                    <div className="inline-block px-8 py-6 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-xl">
                      <PriceCountUp targetPrice={soldPlayer.soldPrice} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse delay-300"></div>
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
