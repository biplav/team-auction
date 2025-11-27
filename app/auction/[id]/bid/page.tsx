"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, AlertTriangle } from "lucide-react";
import io, { Socket } from "socket.io-client";
import { canAffordPlayer, formatCurrency as formatCurrencyUtil } from "@/lib/budget";
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
  initialBudget: number;
  remainingBudget: number;
  ownerId: string | null;
  players: any[];
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
  minPlayersPerTeam: number;
  minPlayerPrice: number;
}

interface SoldPlayerData {
  playerName: string;
  playerRole: string;
  teamName: string;
  teamColor: string | null;
  soldPrice: number;
}

export default function BiddingPage() {
  const params = useParams();
  const auctionId = params.id as string;
  const { data: session } = useSession();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [soldPlayer, setSoldPlayer] = useState<SoldPlayerData | null>(null);
  const [showSoldAnimation, setShowSoldAnimation] = useState(false);

  const bidIncrement = 50000; // 50k increment

  useEffect(() => {
    if (session?.user?.id) {
      fetchData(true); // Show loader on initial load
    }
  }, [session]);

  useEffect(() => {
    if (auction?.currentPlayerId) {
      fetchCurrentPlayer(auction.currentPlayerId);
    }
  }, [auction?.currentPlayerId]);

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
      if (currentPlayer && data.playerId === currentPlayer.id) {
        fetchBids(currentPlayer.id);
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

  useEffect(() => {
    if (currentPlayer) {
      fetchBids(currentPlayer.id);
      const highestBidAmount = bids.length > 0 ? bids[0].amount : currentPlayer.basePrice;
      setBidAmount(highestBidAmount + bidIncrement);
    }
  }, [currentPlayer]);

  useEffect(() => {
    if (bids.length > 0 && currentPlayer) {
      const highestBidAmount = bids[0].amount;
      setBidAmount(highestBidAmount + bidIncrement);
    }
  }, [bids]);

  const fetchData = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const auctionRes = await fetch(`/api/auctions/${auctionId}`);

      if (auctionRes.ok) {
        const auctionData = await auctionRes.json();
        setAuction(auctionData);

        // Find user's team from the auction data
        const userTeam = auctionData.teams?.find(
          (t: Team) => t.ownerId === session?.user?.id
        );
        if (userTeam) {
          setMyTeam(userTeam);
        }

        // Set current player if auction has one
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

  const placeBid = async () => {
    if (!myTeam || !currentPlayer || !bidAmount || !auction) {
      alert("Missing required data. Please refresh the page.");
      return;
    }

    if (!myTeam.id) {
      alert("Team ID is missing. Please contact the administrator.");
      return;
    }

    const currentPlayerCount = myTeam.players?.length || 0;
    const remainingRequiredPlayers = typeof auction.minPlayersPerTeam === 'number'
      ? Math.max(0, auction.minPlayersPerTeam - currentPlayerCount - 1)
      : 0;
    const maxAllowableBid = typeof auction.minPlayerPrice === 'number'
      ? myTeam.remainingBudget - (remainingRequiredPlayers * auction.minPlayerPrice)
      : myTeam.remainingBudget;

    if (bidAmount > maxAllowableBid) {
      const reserved = remainingRequiredPlayers * (auction.minPlayerPrice || 0);
      alert(`Maximum allowable bid is ${formatCurrency(maxAllowableBid)}. You need to reserve ${formatCurrency(reserved)} for ${remainingRequiredPlayers} more player(s) to meet minimum squad size.`);
      return;
    }

    if (bidAmount > myTeam.remainingBudget) {
      alert("Insufficient budget for this bid!");
      return;
    }

    const highestBidAmount = bids.length > 0 ? bids[0].amount : currentPlayer.basePrice;
    if (bidAmount <= highestBidAmount) {
      alert("Bid must be higher than the current highest bid!");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          teamId: myTeam.id,
          amount: bidAmount,
        }),
      });

      if (res.ok) {
        const bid = await res.json();
        socket?.emit("place-bid", {
          auctionId,
          playerId: currentPlayer.id,
          teamId: myTeam.id,
          amount: bidAmount,
        });
        fetchBids(currentPlayer.id);
        setBidAmount(bidAmount + bidIncrement);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to place bid");
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      alert("Failed to place bid");
    } finally {
      setSubmitting(false);
    }
  };

  const increaseBid = () => {
    setBidAmount((prev) => prev + bidIncrement);
  };

  const decreaseBid = () => {
    const minBid = bids.length > 0 ? bids[0].amount + bidIncrement : currentPlayer?.basePrice || 0;
    setBidAmount((prev) => Math.max(minBid, prev - bidIncrement));
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
  const isMyBidHighest = highestBid && myTeam && highestBid.team.id === myTeam.id;

  // Check if team can afford current player
  const currentPlayerCount = myTeam?.players?.length || 0;
  const affordabilityCheck = auction && myTeam && currentPlayer &&
    typeof auction.minPlayersPerTeam === 'number' &&
    typeof auction.minPlayerPrice === 'number'
    ? canAffordPlayer(
        currentPlayer.basePrice || 0,
        myTeam.remainingBudget || 0,
        currentPlayerCount,
        auction.minPlayersPerTeam,
        auction.minPlayerPrice
      )
    : { canAfford: true, maxAllowableBid: myTeam?.remainingBudget || 0 };

  const maxAllowableBid = Math.max(0, affordabilityCheck.maxAllowableBid || 0);
  const remainingRequiredPlayers = auction && myTeam && typeof auction.minPlayersPerTeam === 'number'
    ? Math.max(0, auction.minPlayersPerTeam - currentPlayerCount - 1)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Team Assigned</CardTitle>
            <CardDescription>
              You don't have a team assigned for this auction. Please contact the admin.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{auction?.name}</h1>
          {auction && (
            <div className="flex items-center justify-center gap-3">
              <Badge className={`${getStatusColor(auction.status)} text-white text-sm px-4 py-1`}>
                {auction.status.replace("_", " ")}
              </Badge>
              <Button asChild variant="outline" size="sm">
                <a href={`/auction/${auctionId}/display`} target="_blank">
                  Public Display
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Player</CardTitle>
              </CardHeader>
              <CardContent>
                {currentPlayer ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold">{currentPlayer.name}</h2>
                        {currentPlayer.status === "SOLD" && (
                          <Badge className="bg-green-600 text-white">SOLD</Badge>
                        )}
                      </div>
                      <Badge>{currentPlayer.role.replace("_", " ")}</Badge>
                    </div>

                    {currentPlayer.status === "SOLD" && currentPlayer.teamId ? (
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <p className="font-semibold text-green-900 text-lg">Player Already Sold</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Bought By</p>
                            <p className="text-xl font-bold text-green-900">
                              {auction?.teams?.find((t: any) => t.id === currentPlayer.teamId)?.name || "Unknown Team"}
                              {currentPlayer.teamId === myTeam.id && (
                                <span className="text-sm ml-2">(Your Team!)</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Sold Price</p>
                            <p className="text-xl font-bold text-green-900">
                              {currentPlayer.soldPrice ? formatCurrency(currentPlayer.soldPrice) : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Base Price</p>
                            <p className="text-xl font-bold text-blue-900">
                              {formatCurrency(currentPlayer.basePrice)}
                            </p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Current Bid</p>
                            <p className="text-xl font-bold text-green-900">
                              {highestBid ? formatCurrency(highestBid.amount) : "No bids"}
                            </p>
                          </div>
                        </div>

                        {highestBid && (
                          <div className={`p-3 rounded-lg ${isMyBidHighest ? "bg-green-100" : "bg-gray-100"}`}>
                            <p className="text-sm text-gray-600">Highest Bidder</p>
                            <p className="font-semibold">
                              {highestBid.team.name}
                              {isMyBidHighest && <span className="ml-2 text-green-600">(You)</span>}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Waiting for auction to start...
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Statement</CardTitle>
                <CardDescription>Your team's spending breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {myTeam.players && myTeam.players.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {myTeam.players.map((player: any, index: number) => (
                        <div
                          key={player.id}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{player.name}</p>
                            <p className="text-xs text-gray-600">{player.role.replace("_", " ")}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">
                              {player.soldPrice ? formatCurrency(player.soldPrice) : "N/A"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-600">Total Spent</p>
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(myTeam.initialBudget - myTeam.remainingBudget)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Remaining Budget</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(myTeam.remainingBudget)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No players purchased yet
                  </p>
                )}
              </CardContent>
            </Card>

            {auction?.status === "IN_PROGRESS" && currentPlayer && currentPlayer.status !== "SOLD" && (
              <Card>
                <CardHeader>
                  <CardTitle>Place Your Bid</CardTitle>
                  <CardDescription>Bid for {currentPlayer.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Bid Amount</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          onClick={decreaseBid}
                          variant="outline"
                          size="icon"
                          disabled={submitting}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(parseInt(e.target.value))}
                          className="text-center text-xl font-bold"
                          step={bidIncrement}
                        />
                        <Button
                          onClick={increaseBid}
                          variant="outline"
                          size="icon"
                          disabled={submitting}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Increment: {formatCurrency(bidIncrement)}
                      </p>
                    </div>

                    {!affordabilityCheck.canAfford && affordabilityCheck.reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-red-900 mb-1">Cannot Afford This Player</p>
                            <p className="text-sm text-red-700">{affordabilityCheck.reason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={`border rounded-lg p-3 mb-3 ${
                      !affordabilityCheck.canAfford
                        ? "bg-gray-50 border-gray-200"
                        : "bg-amber-50 border-amber-200"
                    }`}>
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-gray-600">Maximum Allowable Bid:</span>
                        <span className={`font-bold ${
                          !affordabilityCheck.canAfford ? "text-gray-500" : "text-amber-900"
                        }`}>
                          {formatCurrency(maxAllowableBid)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        You need {Number.isNaN(remainingRequiredPlayers) ? 0 : remainingRequiredPlayers} more player(s) at minimum {formatCurrency(auction?.minPlayerPrice || 0)} each
                      </p>
                    </div>

                    <Button
                      onClick={placeBid}
                      className="w-full"
                      size="lg"
                      disabled={submitting || !currentPlayer || !affordabilityCheck.canAfford || bidAmount > maxAllowableBid}
                    >
                      {submitting
                        ? "Placing Bid..."
                        : !affordabilityCheck.canAfford
                        ? "Cannot Afford Player"
                        : `Place Bid - ${formatCurrency(bidAmount)}`}
                    </Button>

                    {affordabilityCheck.canAfford && bidAmount > maxAllowableBid && (
                      <p className="text-sm text-red-600 text-center">
                        Bid exceeds maximum allowable amount!
                      </p>
                    )}
                    {affordabilityCheck.canAfford && bidAmount > myTeam.remainingBudget && (
                      <p className="text-sm text-red-600 text-center">
                        Insufficient budget for this bid!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Team: {myTeam.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Budget</p>
                      <p className="text-xl font-bold">{formatCurrency(myTeam.initialBudget)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Remaining</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(myTeam.remainingBudget)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Current Squad</p>
                      <p className="text-lg font-bold text-blue-900">
                        {currentPlayerCount} / {auction?.minPlayersPerTeam ?? '-'}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Slots Left</p>
                      <p className="text-lg font-bold text-purple-900">
                        {Number.isNaN(remainingRequiredPlayers) ? 0 : remainingRequiredPlayers}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Budget Used</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{
                          width: `${((myTeam.initialBudget - myTeam.remainingBudget) / myTeam.initialBudget) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Bids</CardTitle>
                <CardDescription>Latest bids for current player</CardDescription>
              </CardHeader>
              <CardContent>
                {bids.length > 0 ? (
                  <div className="space-y-2">
                    {bids.slice(0, 10).map((bid, index) => (
                      <div
                        key={bid.id}
                        className={`p-3 rounded-lg ${
                          index === 0
                            ? "bg-green-100 border border-green-300"
                            : bid.team.id === myTeam.id
                            ? "bg-blue-50"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">
                              {bid.team.name}
                              {bid.team.id === myTeam.id && (
                                <span className="text-xs ml-2 text-blue-600">(You)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(bid.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(bid.amount)}</p>
                            {index === 0 && (
                              <Badge className="text-xs bg-green-600">Highest</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No bids yet for this player
                  </p>
                )}
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
