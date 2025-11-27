"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Pause, SkipForward, Gavel, XCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import io, { Socket } from "socket.io-client";

interface Player {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  soldPrice: number | null;
  status: string;
  stats: any;
  teamId: string | null;
}

interface Team {
  id: string;
  name: string;
  initialBudget: number;
  remainingBudget: number;
  _count: {
    players: number;
  };
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

export default function ConductAuctionPage() {
  const params = useParams();
  const auctionId = params.id as string;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  const unsoldPlayers = players.filter((p) => p.status === "UNSOLD");
  const soldPlayers = players.filter((p) => p.status === "SOLD");

  useEffect(() => {
    fetchData(true); // Show loader on initial load

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

    socketInstance.on("player-sold", () => {
      console.log("Player sold - refreshing data");
      fetchData(false); // Don't show loader on socket updates
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
    if (auction?.currentPlayerId) {
      const player = players.find(p => p.id === auction.currentPlayerId);
      if (player) {
        setCurrentPlayer(player);
        fetchBids(player.id);
      }
    }
  }, [auction?.currentPlayerId, players]);

  // Poll for bid updates when auction is in progress
  useEffect(() => {
    if (auction?.status === "IN_PROGRESS" && currentPlayer) {
      const interval = setInterval(() => {
        fetchBids(currentPlayer.id);
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [auction?.status, currentPlayer]);

  // Poll for teams data to update budgets
  useEffect(() => {
    if (auction?.status === "IN_PROGRESS") {
      const interval = setInterval(async () => {
        const res = await fetch(`/api/teams?auctionId=${auctionId}`);
        if (res.ok) {
          const data = await res.json();
          setTeams(data);
        }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [auction?.status, auctionId]);

  const fetchData = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const [auctionRes, playersRes, teamsRes] = await Promise.all([
        fetch(`/api/auctions/${auctionId}`),
        fetch(`/api/players?auctionId=${auctionId}`),
        fetch(`/api/teams?auctionId=${auctionId}`),
      ]);

      if (auctionRes.ok) {
        const auctionData = await auctionRes.json();
        setAuction(auctionData);
      }

      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(playersData);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const fetchBids = async (playerId: string) => {
    if (!playerId) return;

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

  const updateAuctionStatus = async (status: string) => {
    try {
      const updateData: any = { status };

      // If starting/resuming auction, set first unsold player as current
      if (status === "IN_PROGRESS") {
        // Check if we need to set a new current player
        const needsNewPlayer =
          !auction?.currentPlayerId ||
          auction.status === "COMPLETED" ||
          players.find(p => p.id === auction.currentPlayerId)?.status !== "UNSOLD";

        if (needsNewPlayer) {
          const firstUnsold = players.find(p => p.status === "UNSOLD");
          if (firstUnsold) {
            updateData.currentPlayerId = firstUnsold.id;
          }
        }
      }

      const res = await fetch(`/api/auctions/${auctionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const data = await res.json();
        setAuction(data);

        if (status === "IN_PROGRESS") {
          socket?.emit("resume-auction", { auctionId });
          if (updateData.currentPlayerId) {
            socket?.emit("next-player", {
              auctionId,
              playerId: updateData.currentPlayerId,
            });
          }
        } else if (status === "PAUSED") {
          socket?.emit("pause-auction", { auctionId });
        }
      }
    } catch (error) {
      console.error("Error updating auction status:", error);
    }
  };

  const sellPlayer = async (teamId: string, amount: number) => {
    if (!currentPlayer) return;

    // Validate that there are active bids
    if (bids.length === 0) {
      alert("Cannot sell player: No active bids found. Please refresh the page and try again.");
      return;
    }

    // Validate that the bid matches
    const highestBid = bids[0];
    if (highestBid.team.id !== teamId || highestBid.amount !== amount) {
      alert("Cannot sell player: Bid information has changed. Please refresh the page and try again.");
      return;
    }

    try {
      const res = await fetch(`/api/players/${currentPlayer.id}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, amount }),
      });

      if (res.ok) {
        socket?.emit("player-sold", {
          auctionId,
          playerId: currentPlayer.id,
          teamId,
          amount,
        });

        await fetchData(false); // Don't show loader when selling player
        moveToNextPlayer();
      } else {
        const errorData = await res.json();
        alert(`Failed to sell player: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error selling player:", error);
      alert("Failed to sell player. Please try again.");
    }
  };

  const markUnsold = async () => {
    if (!currentPlayer) return;

    // Check if player was sold and needs refund
    if (currentPlayer.status === "SOLD" && currentPlayer.soldPrice) {
      const team = teams.find(t => t.id === currentPlayer.teamId);
      const teamName = team?.name || "the team";

      const confirmMessage = `Are you sure you want to mark ${currentPlayer.name} as unsold?\n\nThis will refund ${teamName} ${formatCurrency(currentPlayer.soldPrice)}.`;

      if (!confirm(confirmMessage)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to mark ${currentPlayer.name} as unsold?`)) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/players/${currentPlayer.id}/unsold`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();

        // Show success message with refund details if applicable
        if (data.refunded && data.refundAmount && data.teamName) {
          alert(`Player marked as unsold.\n\n${data.teamName} has been refunded ${formatCurrency(data.refundAmount)}.`);
        }

        await fetchData(false); // Don't show loader when marking unsold
        moveToNextPlayer();
      } else {
        const errorData = await res.json();
        alert(`Failed to mark player as unsold: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error marking player as unsold:", error);
      alert("Failed to mark player as unsold. Please try again.");
    }
  };

  const discardBids = async () => {
    if (!currentPlayer) return;

    if (!confirm("Are you sure you want to discard all bids for this player? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch("/api/bids/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: currentPlayer.id }),
      });

      if (res.ok) {
        setBids([]);
        socket?.emit("bids-discarded", {
          auctionId,
          playerId: currentPlayer.id,
        });
      }
    } catch (error) {
      console.error("Error discarding bids:", error);
    }
  };

  const moveToNextPlayer = async () => {
    if (!currentPlayer) return;

    // First, try to find next unsold player after current one
    const currentIndex = players.findIndex(p => p.id === currentPlayer.id);
    let nextPlayer = players
      .slice(currentIndex + 1)
      .find(p => p.status === "UNSOLD");

    // If no player found after current, look from the beginning (in case we skipped players)
    if (!nextPlayer) {
      nextPlayer = players.find(p => p.status === "UNSOLD");
    }

    if (nextPlayer) {
      try {
        const res = await fetch(`/api/auctions/${auctionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPlayerId: nextPlayer.id }),
        });

        if (res.ok) {
          const data = await res.json();
          setAuction(data);
          setBids([]);
          socket?.emit("next-player", {
            auctionId,
            playerId: nextPlayer.id,
          });
        }
      } catch (error) {
        console.error("Error moving to next player:", error);
      }
    } else {
      // No more unsold players anywhere, complete auction
      await updateAuctionStatus("COMPLETED");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const highestBid = bids.length > 0 ? bids[0] : null;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
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

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Conduct Auction</h1>
            {auction && (
              <p className="text-muted-foreground mt-1">{auction.name}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button asChild variant="secondary" size="lg">
              <Link href={`/auction/${auctionId}/display`} target="_blank">
                Public Display Screen
              </Link>
            </Button>
            {auction?.status === "NOT_STARTED" && (
              <Button onClick={() => updateAuctionStatus("IN_PROGRESS")} size="lg">
                <Play className="mr-2 h-4 w-4" />
                Start Auction
              </Button>
            )}
            {auction?.status === "IN_PROGRESS" && (
              <Button onClick={() => updateAuctionStatus("PAUSED")} variant="outline" size="lg">
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {auction?.status === "PAUSED" && (
              <Button onClick={() => updateAuctionStatus("IN_PROGRESS")} size="lg">
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            {auction?.status === "COMPLETED" && unsoldPlayers.length > 0 && (
              <Button onClick={() => updateAuctionStatus("IN_PROGRESS")} size="lg" variant="destructive">
                <Play className="mr-2 h-4 w-4" />
                Reopen Auction ({unsoldPlayers.length} players left)
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{players.length}</div>
              <p className="text-sm text-muted-foreground">Total Players</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{soldPlayers.length}</div>
              <p className="text-sm text-muted-foreground">Sold</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-600">{unsoldPlayers.length}</div>
              <p className="text-sm text-muted-foreground">Remaining</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          {!currentPlayer && unsoldPlayers.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Auction Complete</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                      <Gavel className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">All Players Have Been Auctioned!</h3>
                  <p className="text-muted-foreground mb-6">
                    The auction has been completed. All players have been either sold or marked as unsold.
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{soldPlayers.length}</div>
                      <p className="text-sm text-muted-foreground">Players Sold</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-gray-600">{players.filter(p => p.status === "UNSOLD").length}</div>
                      <p className="text-sm text-muted-foreground">Unsold</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Current Player</CardTitle>
                  <CardDescription>Player being auctioned</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentPlayer ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{currentPlayer.name}</h3>
                    <Badge className="mt-2">{currentPlayer.role.replace("_", " ")}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Base Price</p>
                      <p className="text-lg font-semibold">{formatCurrency(currentPlayer.basePrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Bid</p>
                      <p className="text-lg font-semibold text-green-600">
                        {highestBid ? formatCurrency(highestBid.amount) : "No bids yet"}
                      </p>
                    </div>
                  </div>

                  {currentPlayer.stats && Object.keys(currentPlayer.stats).length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Player Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(currentPlayer.stats).map(([key, value]) => {
                          // Mask phone numbers
                          const displayValue = key.toLowerCase().includes('phone') && String(value).length > 4
                            ? `****${String(value).slice(-4)}`
                            : String(value);

                          return (
                            <div key={key}>
                              <p className="text-xs text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <p className="text-sm font-medium">{displayValue}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 mt-6">
                    <div className="flex gap-2">
                      {highestBid && (
                        <Button
                          onClick={() => sellPlayer(highestBid.team.id, highestBid.amount)}
                          className="flex-1"
                        >
                          <Gavel className="mr-2 h-4 w-4" />
                          Sell to {highestBid.team.name}
                        </Button>
                      )}
                      <Button onClick={markUnsold} variant="outline" className="flex-1">
                        <XCircle className="mr-2 h-4 w-4" />
                        Mark Unsold
                      </Button>
                      <Button onClick={moveToNextPlayer} variant="outline">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                    {bids.length > 0 && (
                      <Button onClick={discardBids} variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Discard All Bids ({bids.length})
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No more players to auction
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Bids</CardTitle>
              <CardDescription>Recent bids for current player</CardDescription>
            </CardHeader>
            <CardContent>
              {bids.length > 0 ? (
                <div className="space-y-2">
                  {bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`p-3 rounded-lg border ${
                        index === 0 ? "bg-green-50 border-green-200" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{bid.team.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(bid.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(bid.amount)}</p>
                          {index === 0 && (
                            <Badge className="bg-green-600">Highest</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No bids yet for this player
                </p>
              )}
            </CardContent>
          </Card>
            </>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>Team budgets and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teams.map((team) => {
                  const currentPlayerCount = team._count.players;
                  const remainingRequiredPlayers = auction
                    ? Math.max(0, auction.minPlayersPerTeam - currentPlayerCount)
                    : 0;
                  const maxAllowableBid = auction
                    ? team.remainingBudget - remainingRequiredPlayers * auction.minPlayerPrice
                    : team.remainingBudget;

                  return (
                    <div key={team.id} className="p-3 rounded-lg border bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-semibold">{team.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {currentPlayerCount} / {auction?.minPlayersPerTeam} players
                          </p>
                        </div>
                        <Badge
                          variant={
                            team.remainingBudget > team.initialBudget * 0.3
                              ? "default"
                              : "destructive"
                          }
                        >
                          {formatCurrency(team.remainingBudget)}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(team.remainingBudget / team.initialBudget) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600">
                        Max bid: {formatCurrency(Math.max(0, maxAllowableBid))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
