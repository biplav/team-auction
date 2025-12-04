"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, Pause, SkipForward, Gavel, XCircle, Trash2, Plus, Minus, AlertTriangle, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { Socket } from "socket.io-client";
import { createSocketClient } from "@/lib/socket-client";
import confetti from "canvas-confetti";
import { getDisplayablePlayerStats } from "@/lib/utils/player-utils";
import { BidCountdownTimer } from "@/components/BidCountdownTimer";
import { formatNumberWithCommas, parseNumberFromCommas } from "@/lib/utils/currency-utils";
import { toast, Toaster } from "sonner";

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

interface TeamPlayer {
  id: string;
  name: string;
  role: string;
  soldPrice: number | null;
}

interface Team {
  id: string;
  name: string;
  color: string | null;
  initialBudget: number;
  remainingBudget: number;
  _count: {
    players: number;
  };
  players?: TeamPlayer[];
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
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  minPlayerPrice: number;
  minBidIncrement: number;
  bidTimerSeconds: number;
  timerEnabled: boolean;
}

interface SoldPlayerData {
  playerName: string;
  playerRole: string;
  teamName: string;
  teamColor: string | null;
  soldPrice: number;
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
  const [soldPlayer, setSoldPlayer] = useState<SoldPlayerData | null>(null);
  const [showSoldAnimation, setShowSoldAnimation] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loadingTeamPlayers, setLoadingTeamPlayers] = useState(false);
  const [adminBidTeamId, setAdminBidTeamId] = useState<string>("");
  const [adminBidAmount, setAdminBidAmount] = useState<number>(0);
  const [placingAdminBid, setPlacingAdminBid] = useState(false);
  const [isPlayerTransitioning, setIsPlayerTransitioning] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignTeamId, setAssignTeamId] = useState<string>("");
  const [showAssignConfirmation, setShowAssignConfirmation] = useState(false);
  const [assigningPlayer, setAssigningPlayer] = useState(false);
  const [showAdminBidDialog, setShowAdminBidDialog] = useState(false);
  const [showAdminBidConfirmation, setShowAdminBidConfirmation] = useState(false);
  const [selling, setSelling] = useState(false);
  const [adminMaxBidInfo, setAdminMaxBidInfo] = useState<{
    maxAllowableBid: number;
    reservedAmount: number;
    reservedPlayerCount: number;
  } | null>(null);

  const unsoldPlayers = players.filter((p) => p.status === "UNSOLD");
  const soldPlayers = players.filter((p) => p.status === "SOLD");
  // Use auction's minimum bid increment setting (fallback to 50k for backward compatibility)
  const bidIncrement = auction?.minBidIncrement ?? 50000;

  // Initialize admin bid amount when player or bids change
  useEffect(() => {
    if (currentPlayer && auction?.status === "IN_PROGRESS") {
      const highestBidAmount = bids.length > 0 ? bids[0].amount : currentPlayer.basePrice;
      setAdminBidAmount(highestBidAmount + bidIncrement);
    }
  }, [currentPlayer, bids, auction?.status]);

  // Fetch max bid info when admin bid team changes
  useEffect(() => {
    if (adminBidTeamId && currentPlayer?.id) {
      fetchAdminMaxBidInfo(adminBidTeamId, currentPlayer.id);
    }
  }, [adminBidTeamId, currentPlayer?.id]);

  useEffect(() => {
    fetchData(true); // Show loader on initial load

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

    socketInstance.on("player-sold", (data) => {
      console.log("Player sold - refreshing data", data);

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

    socketInstance.on("bids-discarded", (data) => {
      console.log("Bids discarded:", data);
      if (currentPlayer && data.playerId === currentPlayer.id) {
        setBids([]);
      }
    });

    socketInstance.on("current-player-changed", (data) => {
      console.log("Current player changed via socket:", data);
      if (data.playerId) {
        setBids([]); // Clear bids immediately
        fetchCurrentPlayer(data.playerId);
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
      fetchCurrentPlayer(auction.currentPlayerId);
    } else {
      setCurrentPlayer(null);
      setBids([]);
      setIsPlayerTransitioning(false);
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

  const fetchCurrentPlayer = async (playerId: string) => {
    if (!playerId) {
      setCurrentPlayer(null);
      setBids([]);
      return;
    }

    setIsPlayerTransitioning(true);
    try {
      const res = await fetch(`/api/players/${playerId}`);
      if (res.ok) {
        const playerData = await res.json();
        setCurrentPlayer(playerData);
        fetchBids(playerId);

        // Reset admin bid fields
        setAdminBidTeamId("");
        const baseAmount = playerData.basePrice + bidIncrement;
        setAdminBidAmount(baseAmount);
      }
    } catch (error) {
      console.error("Error fetching current player:", error);
    } finally {
      setIsPlayerTransitioning(false);
      setSelling(false); // Reset selling state when player transition completes
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

  const fetchAdminMaxBidInfo = async (teamId: string, playerId?: string) => {
    try {
      const url = playerId
        ? `/api/teams/${teamId}/max-bid?playerId=${playerId}`
        : `/api/teams/${teamId}/max-bid`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAdminMaxBidInfo(data);
      }
    } catch (error) {
      console.error("Error fetching admin max bid info:", error);
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
    if (!currentPlayer || isPlayerTransitioning || selling) return;

    // Validate that there are active bids
    if (bids.length === 0) {
      toast.error("Cannot sell player: No active bids found. Please refresh the page and try again.");
      return;
    }

    // Validate that the bid matches
    const highestBid = bids[0];
    if (highestBid.team.id !== teamId || highestBid.amount !== amount) {
      toast.error("Cannot sell player: Bid information has changed. Please refresh the page and try again.");
      return;
    }

    setSelling(true);

    try {
      const res = await fetch(`/api/players/${currentPlayer.id}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, amount }),
      });

      if (res.ok) {
        const soldTeam = teams.find(t => t.id === teamId);

        // Show success toast
        toast.success(`${currentPlayer.name} sold to ${soldTeam?.name || "Unknown Team"} for ${formatCurrency(amount)}`);

        socket?.emit("player-sold", {
          auctionId,
          player: {
            id: currentPlayer.id,
            name: currentPlayer.name,
            role: currentPlayer.role,
          },
          team: {
            id: teamId,
            name: soldTeam?.name || "Unknown Team",
            color: soldTeam?.color || null,
          },
          soldPrice: amount,
        });

        await fetchData(false); // Don't show loader when selling player
        moveToNextPlayer();
        // Note: Don't set selling=false here, let player transition handle re-enabling
      } else {
        const errorData = await res.json();
        toast.error(`Failed to sell player: ${errorData.error || 'Unknown error'}`);
        setSelling(false); // Re-enable on error
      }
    } catch (error) {
      console.error("Error selling player:", error);
      toast.error("Failed to sell player. Please try again.");
      setSelling(false); // Re-enable on error
    }
  };

  const markUnsold = async () => {
    if (!currentPlayer || isPlayerTransitioning) return;

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
    if (!currentPlayer || isPlayerTransitioning) return;

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

  const handleAssignClick = () => {
    setAssignTeamId("");
    setShowAssignDialog(true);
  };

  const handleAssignConfirm = () => {
    if (!assignTeamId) {
      alert("Please select a team");
      return;
    }
    setShowAssignDialog(false);
    setShowAssignConfirmation(true);
  };

  const assignPlayerToTeam = async () => {
    if (!currentPlayer || !assignTeamId || isPlayerTransitioning) return;

    setAssigningPlayer(true);
    try {
      const res = await fetch(`/api/players/${currentPlayer.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: assignTeamId }),
      });

      if (res.ok) {
        const data = await res.json();
        const assignedTeam = teams.find(t => t.id === assignTeamId);

        // Emit socket event to update all connected clients
        socket?.emit("player-sold", {
          auctionId,
          playerId: currentPlayer.id,
          player: {
            id: currentPlayer.id,
            name: currentPlayer.name,
            role: currentPlayer.role,
          },
          team: {
            id: assignTeamId,
            name: assignedTeam?.name || "",
            color: assignedTeam?.color || null,
          },
          soldPrice: 0, // Free assignment
        });

        // Refresh data
        await fetchData(false);

        // Show success message
        alert(data.message || `${currentPlayer.name} has been assigned to ${assignedTeam?.name}`);

        // Move to next player
        await moveToNextPlayer();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to assign player");
      }
    } catch (error) {
      console.error("Error assigning player:", error);
      alert("Failed to assign player. Please try again.");
    } finally {
      setAssigningPlayer(false);
      setShowAssignConfirmation(false);
      setAssignTeamId("");
    }
  };

  const handleAdminBidClick = () => {
    // Reset and initialize admin bid dialog
    setAdminBidTeamId("");
    const baseAmount = currentPlayer ? currentPlayer.basePrice + bidIncrement : bidIncrement;
    setAdminBidAmount(baseAmount);
    setShowAdminBidDialog(true);
  };

  const handleAdminBidNext = () => {
    if (!adminBidTeamId) {
      alert("Please select a team");
      return;
    }

    const selectedTeam = teams.find(t => t.id === adminBidTeamId);
    if (!selectedTeam || !auction) return;

    // Validation checks
    const currentPlayerCount = selectedTeam._count.players;
    if (currentPlayerCount >= auction.maxPlayersPerTeam) {
      alert(`${selectedTeam.name} has reached the maximum squad size of ${auction.maxPlayersPerTeam} players.`);
      return;
    }

    // Use fetched max bid info if available, otherwise fallback to inline calculation
    const maxAllowableBid = adminMaxBidInfo?.maxAllowableBid ?? selectedTeam.remainingBudget;
    const reservedAmount = adminMaxBidInfo?.reservedAmount ?? 0;
    const reservedPlayerCount = adminMaxBidInfo?.reservedPlayerCount ?? 0;

    if (maxAllowableBid <= 0) {
      alert(`${selectedTeam.name} cannot afford this player. They need to reserve ${formatCurrency(reservedAmount)} for ${reservedPlayerCount} more player(s).`);
      return;
    }

    if (adminBidAmount > maxAllowableBid) {
      alert(`Bid amount exceeds maximum allowable bid of ${formatCurrency(maxAllowableBid)}. Reserved ${formatCurrency(reservedAmount)} for ${reservedPlayerCount} player(s).`);
      return;
    }

    setShowAdminBidDialog(false);
    setShowAdminBidConfirmation(true);
  };

  const placeAdminBid = async () => {
    if (!adminBidTeamId || !currentPlayer || !adminBidAmount || !auction) {
      alert("Please select a team and enter a bid amount");
      return;
    }

    const selectedTeam = teams.find(t => t.id === adminBidTeamId);
    if (!selectedTeam) {
      alert("Selected team not found");
      return;
    }

    // Check if team has reached maximum squad size
    const currentPlayerCount = selectedTeam._count.players;
    if (currentPlayerCount >= auction.maxPlayersPerTeam) {
      alert(`${selectedTeam.name} has reached the maximum squad size of ${auction.maxPlayersPerTeam} players. Cannot bid on more players.`);
      return;
    }

    // Calculate remaining required players and max allowable bid
    const remainingRequiredPlayers = Math.max(0, auction.minPlayersPerTeam - currentPlayerCount - 1);
    const maxAllowableBid = selectedTeam.remainingBudget - (remainingRequiredPlayers * auction.minPlayerPrice);

    // Check if bid exceeds maximum allowable amount
    if (adminBidAmount > maxAllowableBid) {
      const reserved = remainingRequiredPlayers * auction.minPlayerPrice;
      alert(`Maximum allowable bid for ${selectedTeam.name} is ${formatCurrency(maxAllowableBid)}. The team needs to reserve ${formatCurrency(reserved)} for ${remainingRequiredPlayers} more player(s) to meet minimum squad size.`);
      return;
    }

    // Check basic budget
    if (adminBidAmount > selectedTeam.remainingBudget) {
      alert(`${selectedTeam.name} has insufficient budget. Available: ${formatCurrency(selectedTeam.remainingBudget)}`);
      return;
    }

    // Validate admin bid amount
    if (bids.length > 0) {
      // If there are existing bids, new bid must be higher than current highest
      if (adminBidAmount <= bids[0].amount) {
        alert(`Bid must be higher than the current highest bid of ${formatCurrency(bids[0].amount)}`);
        return;
      }
    } else {
      // If no bids yet, bid must be at least the base price
      if (adminBidAmount < currentPlayer.basePrice) {
        alert(`Bid must be at least the base price of ${formatCurrency(currentPlayer.basePrice)}`);
        return;
      }
    }

    setPlacingAdminBid(true);

    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          teamId: adminBidTeamId,
          amount: adminBidAmount,
        }),
      });

      if (res.ok) {
        socket?.emit("place-bid", {
          auctionId,
          playerId: currentPlayer.id,
          teamId: adminBidTeamId,
          amount: adminBidAmount,
        });
        await fetchBids(currentPlayer.id);
        await fetchData(false); // Refresh teams to update budgets
        setAdminBidAmount(adminBidAmount + bidIncrement);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to place bid");
      }
    } catch (error) {
      console.error("Error placing admin bid:", error);
      alert("Failed to place bid");
    } finally {
      setPlacingAdminBid(false);
    }
  };

  const increaseAdminBid = () => {
    setAdminBidAmount((prev) => prev + bidIncrement);
  };

  const decreaseAdminBid = () => {
    const minBid = bids.length > 0 ? bids[0].amount + bidIncrement : currentPlayer?.basePrice || 0;
    setAdminBidAmount((prev) => Math.max(minBid, prev - bidIncrement));
  };

  const moveToNextPlayer = async () => {
    if (!currentPlayer) return;

    setIsPlayerTransitioning(true);
    setBids([]); // Clear bids immediately

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
          // Don't set player here, let socket event or useEffect handle it
          socket?.emit("next-player", {
            auctionId,
            playerId: nextPlayer.id,
          });
        }
      } catch (error) {
        console.error("Error moving to next player:", error);
        setIsPlayerTransitioning(false);
      }
    } else {
      // No more unsold players anywhere, complete auction
      await updateAuctionStatus("COMPLETED");
      setIsPlayerTransitioning(false);
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
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">{currentPlayer.name}</h3>
                      {currentPlayer.status === "SOLD" && (
                        <Badge className="bg-green-600 text-white">SOLD</Badge>
                      )}
                    </div>
                    <Badge className="mt-2">{currentPlayer.role.replace("_", " ")}</Badge>
                  </div>

                  {currentPlayer.status === "SOLD" && currentPlayer.teamId ? (
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Gavel className="h-5 w-5 text-green-700" />
                        <p className="font-semibold text-green-900">Player Already Sold</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Bought By</p>
                          <p className="text-lg font-bold text-green-900">
                            {teams.find(t => t.id === currentPlayer.teamId)?.name || "Unknown Team"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Sold Price</p>
                          <p className="text-lg font-bold text-green-900">
                            {currentPlayer.soldPrice ? formatCurrency(currentPlayer.soldPrice) : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  )}

                  {(() => {
                    const displayableStats = getDisplayablePlayerStats(currentPlayer.stats);
                    return displayableStats.length > 0 ? (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Player Details</p>
                        <div className="grid grid-cols-2 gap-3">
                          {displayableStats.map((stat) => (
                            <div key={stat.key}>
                              <p className="text-xs text-gray-600 capitalize">
                                {stat.label}
                              </p>
                              <p className="text-sm font-medium">{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {!isPlayerTransitioning && (
                    <div className="flex flex-col gap-2 mt-6">
                      {currentPlayer.status === "SOLD" ? (
                        <div className="flex gap-2">
                          <Button onClick={markUnsold} variant="outline" className="flex-1">
                            <XCircle className="mr-2 h-4 w-4" />
                            Mark Unsold (Refund)
                          </Button>
                          <Button onClick={moveToNextPlayer} variant="outline">
                            <SkipForward className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              {highestBid && (
                                <Button
                                  onClick={() => sellPlayer(highestBid.team.id, highestBid.amount)}
                                  className="flex-1"
                                  disabled={selling || isPlayerTransitioning || assigningPlayer}
                                >
                                  {selling ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Selling...
                                    </>
                                  ) : (
                                    <>
                                      <Gavel className="mr-2 h-4 w-4" />
                                      Sell to {highestBid.team.name}
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                onClick={markUnsold}
                                variant="outline"
                                className="flex-1"
                                disabled={selling || isPlayerTransitioning || assigningPlayer}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Mark Unsold
                              </Button>
                              <Button
                                onClick={moveToNextPlayer}
                                variant="outline"
                                disabled={selling || isPlayerTransitioning || assigningPlayer}
                              >
                                <SkipForward className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              onClick={handleAdminBidClick}
                              variant="secondary"
                              className="w-full"
                              disabled={selling || isPlayerTransitioning || assigningPlayer}
                            >
                              <Gavel className="mr-2 h-4 w-4" />
                              Place Bid on Behalf of Team
                            </Button>
                          </div>
                          {bids.length > 0 && (
                            <Button
                              onClick={discardBids}
                              variant="destructive"
                              size="sm"
                              disabled={selling || isPlayerTransitioning || assigningPlayer}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Discard All Bids ({bids.length})
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {isPlayerTransitioning && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Loading next player...</div>
                    </div>
                  )}
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

          {auction && auction.status === "IN_PROGRESS" && currentPlayer && currentPlayer.status !== "SOLD" && !isPlayerTransitioning && (
            <Card>
              <CardContent className="pt-6">
                <BidCountdownTimer
                  timerSeconds={auction.bidTimerSeconds}
                  lastBidTime={highestBid ? new Date(highestBid.createdAt) : null}
                  currentPlayerSetAt={auction.currentPlayerSetAt ? new Date(auction.currentPlayerSetAt) : null}
                  auctionStatus={auction.status}
                  timerEnabled={auction.timerEnabled}
                  variant="default"
                />
              </CardContent>
            </Card>
          )}

          {auction?.status === "IN_PROGRESS" && currentPlayer && currentPlayer.status !== "SOLD" && !isPlayerTransitioning && (
            <Card>
              <CardHeader>
                <CardTitle>Assign Player to Team</CardTitle>
                <CardDescription>Add player without budget deduction</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleAssignClick} className="w-full" size="lg">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign to Team (No Budget Deduction)
                </Button>
              </CardContent>
            </Card>
          )}
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <p
                                className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                onClick={() => fetchTeamPlayers(team)}
                              >
                                {currentPlayerCount} / {auction?.minPlayersPerTeam} players
                              </p>
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

      {/* Assign Player Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Player to Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Assign <strong>{currentPlayer?.name}</strong> to a team without any budget deduction.
              This player will be added as a complimentary player (₹0).
            </p>
            <div>
              <Label>Select Team</Label>
              <Select value={assignTeamId} onValueChange={setAssignTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({team._count.players} players)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignConfirm} disabled={!assignTeamId}>
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showAssignConfirmation} onOpenChange={setShowAssignConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900">Confirm Free Assignment</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    You are about to assign <strong>{currentPlayer?.name}</strong> to{" "}
                    <strong>{teams.find(t => t.id === assignTeamId)?.name}</strong> as a complimentary player.
                  </p>
                  <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                    <li>No budget will be deducted</li>
                    <li>Player will be marked as SOLD (₹0)</li>
                    <li>This action cannot be easily undone</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignConfirmation(false);
                  setShowAssignDialog(true);
                }}
                disabled={assigningPlayer}
              >
                Go Back
              </Button>
              <Button
                onClick={assignPlayerToTeam}
                disabled={assigningPlayer}
                className="bg-green-600 hover:bg-green-700"
              >
                {assigningPlayer ? "Assigning..." : "Confirm Assignment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Bid Dialog - Team/Amount Selection */}
      <Dialog open={showAdminBidDialog} onOpenChange={setShowAdminBidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Bid on Behalf of Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Place a bid for <strong>{currentPlayer?.name}</strong> on behalf of any team.
            </p>
            <div>
              <Label>Select Team</Label>
              <Select value={adminBidTeamId} onValueChange={setAdminBidTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => {
                    const currentPlayerCount = team._count.players;
                    const hasReachedMax = currentPlayerCount >= (auction?.maxPlayersPerTeam || 0);
                    const remainingBudget = team.remainingBudget;

                    return (
                      <SelectItem
                        key={team.id}
                        value={team.id}
                        disabled={hasReachedMax || remainingBudget <= 0}
                      >
                        {team.name} - {formatCurrency(remainingBudget)}
                        {hasReachedMax && " (Squad Full)"}
                        {remainingBudget <= 0 && !hasReachedMax && " (No Budget)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {adminBidTeamId && (() => {
              const selectedTeam = teams.find(t => t.id === adminBidTeamId);
              if (!selectedTeam || !auction) return null;

              const currentPlayerCount = selectedTeam._count.players;
              const remainingRequiredPlayers = Math.max(0, auction.minPlayersPerTeam - currentPlayerCount - 1);
              const maxAllowableBid = selectedTeam.remainingBudget - (remainingRequiredPlayers * auction.minPlayerPrice);
              const hasReachedMax = currentPlayerCount >= auction.maxPlayersPerTeam;
              const canAfford = maxAllowableBid > 0;

              return (
                <>
                  {hasReachedMax && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-red-900 mb-1">Squad Full</p>
                          <p className="text-sm text-red-700">
                            {selectedTeam.name} has reached the maximum squad size of {auction.maxPlayersPerTeam} players.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!hasReachedMax && !canAfford && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-red-900 mb-1">Cannot Afford This Player</p>
                          <p className="text-sm text-red-700">
                            {selectedTeam.name} needs to reserve {formatCurrency(remainingRequiredPlayers * auction.minPlayerPrice)} for {remainingRequiredPlayers} more player(s).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!hasReachedMax && canAfford && (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-gray-600">Maximum Allowable Bid:</span>
                          <span className="font-bold text-amber-900">
                            {formatCurrency(Math.max(0, maxAllowableBid))}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Reserve {formatCurrency(remainingRequiredPlayers * auction.minPlayerPrice)} for {remainingRequiredPlayers} more player(s)
                        </p>
                      </div>

                      <div>
                        <Label>Bid Amount</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            onClick={decreaseAdminBid}
                            variant="outline"
                            size="icon"
                            type="button"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="text"
                            value={formatNumberWithCommas(adminBidAmount)}
                            onChange={(e) => {
                              const numValue = parseNumberFromCommas(e.target.value);
                              setAdminBidAmount(numValue || 0);
                            }}
                            className="text-center text-xl font-bold"
                            inputMode="numeric"
                          />
                          <Button
                            onClick={increaseAdminBid}
                            variant="outline"
                            size="icon"
                            type="button"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Increment: {formatCurrency(bidIncrement)}
                        </p>
                      </div>
                    </>
                  )}
                </>
              );
            })()}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAdminBidDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdminBidNext}
                disabled={!adminBidTeamId || (() => {
                  const selectedTeam = teams.find(t => t.id === adminBidTeamId);
                  if (!selectedTeam || !auction) return true;
                  const currentPlayerCount = selectedTeam._count.players;
                  const hasReachedMax = currentPlayerCount >= auction.maxPlayersPerTeam;
                  const remainingRequiredPlayers = Math.max(0, auction.minPlayersPerTeam - currentPlayerCount - 1);
                  const maxAllowableBid = selectedTeam.remainingBudget - (remainingRequiredPlayers * auction.minPlayerPrice);
                  return hasReachedMax || maxAllowableBid <= 0;
                })()}
              >
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Bid Confirmation Dialog */}
      <Dialog open={showAdminBidConfirmation} onOpenChange={setShowAdminBidConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Gavel className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Confirm Bid Placement</p>
                  <p className="text-sm text-blue-800 mt-1">
                    You are about to place a bid of <strong>{formatCurrency(adminBidAmount)}</strong> for{" "}
                    <strong>{currentPlayer?.name}</strong> on behalf of{" "}
                    <strong>{teams.find(t => t.id === adminBidTeamId)?.name}</strong>.
                  </p>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                    <li>This bid will be recorded in the auction</li>
                    <li>Team budget will not be affected until player is sold</li>
                    <li>Other teams can still outbid this amount</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAdminBidConfirmation(false);
                  setShowAdminBidDialog(true);
                }}
                disabled={placingAdminBid}
              >
                Go Back
              </Button>
              <Button
                onClick={async () => {
                  await placeAdminBid();
                  setShowAdminBidConfirmation(false);
                }}
                disabled={placingAdminBid}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {placingAdminBid ? "Placing Bid..." : "Confirm Bid"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster position="top-right" richColors />
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
