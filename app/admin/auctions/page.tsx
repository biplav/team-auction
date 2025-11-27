"use client";

import { useState, useEffect } from "react";
import { AdminNav } from "@/components/admin-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Pencil } from "lucide-react";

interface Auction {
  id: string;
  name: string;
  sport: string;
  status: string;
  maxTeams: number;
  maxPlayersPerTeam: number;
  minPlayersPerTeam: number;
  minPlayerPrice: number;
  minBidIncrement: number;
  createdAt: string;
  _count: {
    teams: number;
    players: number;
  };
}

const SPORT_OPTIONS = [
  "Cricket",
  "Football",
  "Badminton",
  "Pickleball",
  "Tennis",
  "Other"
];

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sport: "Cricket",
    customSport: "",
    maxTeams: 8,
    maxPlayersPerTeam: 15,
    minPlayersPerTeam: 11,
    minPlayerPrice: 0,
    minBidIncrement: 50000,
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    sport: "Cricket",
    customSport: "",
    maxTeams: 8,
    maxPlayersPerTeam: 15,
    minPlayersPerTeam: 11,
    minPlayerPrice: 0,
    minBidIncrement: 50000,
  });

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const response = await fetch("/api/auctions");
      const data = await response.json();
      setAuctions(data);
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const finalSport = formData.sport === "Other" ? formData.customSport : formData.sport;

    if (formData.sport === "Other" && !formData.customSport.trim()) {
      alert("Please enter a sport name");
      setCreating(false);
      return;
    }

    try {
      const response = await fetch("/api/auctions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          sport: finalSport,
          maxTeams: formData.maxTeams,
          maxPlayersPerTeam: formData.maxPlayersPerTeam,
          minPlayersPerTeam: formData.minPlayersPerTeam,
          minPlayerPrice: formData.minPlayerPrice,
          minBidIncrement: formData.minBidIncrement,
        }),
      });

      if (response.ok) {
        setOpen(false);
        setFormData({
          name: "",
          sport: "Cricket",
          customSport: "",
          maxTeams: 8,
          maxPlayersPerTeam: 15,
          minPlayersPerTeam: 11,
          minPlayerPrice: 0,
          minBidIncrement: 50000,
        });
        fetchAuctions();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create auction");
      }
    } catch (error) {
      console.error("Error creating auction:", error);
      alert("Failed to create auction");
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (auction: Auction) => {
    setEditingAuction(auction);
    const isOtherSport = !SPORT_OPTIONS.slice(0, -1).includes(auction.sport);
    setEditFormData({
      name: auction.name,
      sport: isOtherSport ? "Other" : auction.sport,
      customSport: isOtherSport ? auction.sport : "",
      maxTeams: auction.maxTeams,
      maxPlayersPerTeam: auction.maxPlayersPerTeam,
      minPlayersPerTeam: auction.minPlayersPerTeam,
      minPlayerPrice: auction.minPlayerPrice,
      minBidIncrement: auction.minBidIncrement,
    });
    setEditOpen(true);
  };

  const handleUpdateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAuction) return;

    const finalSport = editFormData.sport === "Other" ? editFormData.customSport : editFormData.sport;

    if (editFormData.sport === "Other" && !editFormData.customSport.trim()) {
      alert("Please enter a sport name");
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(`/api/auctions/${editingAuction.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editFormData.name,
          sport: finalSport,
          maxTeams: editFormData.maxTeams,
          maxPlayersPerTeam: editFormData.maxPlayersPerTeam,
          minPlayersPerTeam: editFormData.minPlayersPerTeam,
          minPlayerPrice: editFormData.minPlayerPrice,
          minBidIncrement: editFormData.minBidIncrement,
        }),
      });

      if (response.ok) {
        setEditOpen(false);
        setEditingAuction(null);
        fetchAuctions();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update auction");
      }
    } catch (error) {
      console.error("Error updating auction:", error);
      alert("Failed to update auction");
    } finally {
      setUpdating(false);
    }
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

  return (
    <>
      <AdminNav />
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Auction Management</h1>
          <p className="text-muted-foreground">Create and manage your sports auctions</p>
        </div>

        <div className="flex gap-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg">Create New Auction</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Auction</DialogTitle>
              <DialogDescription>
                Set up a new sports player auction
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAuction} className="space-y-4">
              <div>
                <Label htmlFor="name">Auction Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., IPL 2024 Auction"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sport">Sport</Label>
                <Select
                  value={formData.sport}
                  onValueChange={(value) => setFormData({ ...formData, sport: value })}
                >
                  <SelectTrigger id="sport">
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORT_OPTIONS.map((sport) => (
                      <SelectItem key={sport} value={sport}>
                        {sport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.sport === "Other" && (
                <div>
                  <Label htmlFor="customSport">Enter Sport Name</Label>
                  <Input
                    id="customSport"
                    placeholder="e.g., Basketball, Hockey"
                    value={formData.customSport}
                    onChange={(e) => setFormData({ ...formData, customSport: e.target.value })}
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="maxTeams">Maximum Teams</Label>
                <Input
                  id="maxTeams"
                  type="number"
                  min="2"
                  max="20"
                  value={formData.maxTeams}
                  onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxPlayersPerTeam">Maximum Players per Team</Label>
                <Input
                  id="maxPlayersPerTeam"
                  type="number"
                  min="5"
                  max="25"
                  value={formData.maxPlayersPerTeam}
                  onChange={(e) => setFormData({ ...formData, maxPlayersPerTeam: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="minPlayersPerTeam">Minimum Players per Team</Label>
                <Input
                  id="minPlayersPerTeam"
                  type="number"
                  min="1"
                  max={formData.maxPlayersPerTeam}
                  value={formData.minPlayersPerTeam}
                  onChange={(e) => setFormData({ ...formData, minPlayersPerTeam: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used to calculate maximum allowable bid per team
                </p>
              </div>
              <div>
                <Label htmlFor="minPlayerPrice">Minimum Player Price (₹)</Label>
                <Input
                  id="minPlayerPrice"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.minPlayerPrice}
                  onChange={(e) => setFormData({ ...formData, minPlayerPrice: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum reserve price for any player (set to 0 for no minimum)
                </p>
              </div>
              <div>
                <Label htmlFor="minBidIncrement">Minimum Bid Increment (₹)</Label>
                <Input
                  id="minBidIncrement"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.minBidIncrement}
                  onChange={(e) => setFormData({ ...formData, minBidIncrement: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum amount by which bids must increase (e.g., ₹50,000)
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Auction"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Auction Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Auction</DialogTitle>
              <DialogDescription>
                Update auction settings
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateAuction} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Auction Name</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., IPL 2024 Auction"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-sport">Sport</Label>
                <Select
                  value={editFormData.sport}
                  onValueChange={(value) => setEditFormData({ ...editFormData, sport: value })}
                >
                  <SelectTrigger id="edit-sport">
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORT_OPTIONS.map((sport) => (
                      <SelectItem key={sport} value={sport}>
                        {sport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editFormData.sport === "Other" && (
                <div>
                  <Label htmlFor="edit-customSport">Enter Sport Name</Label>
                  <Input
                    id="edit-customSport"
                    placeholder="e.g., Basketball, Hockey"
                    value={editFormData.customSport}
                    onChange={(e) => setEditFormData({ ...editFormData, customSport: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-maxTeams">Maximum Teams</Label>
                  <Input
                    id="edit-maxTeams"
                    type="number"
                    min="2"
                    max="20"
                    value={editFormData.maxTeams}
                    onChange={(e) => setEditFormData({ ...editFormData, maxTeams: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-maxPlayersPerTeam">Max Players/Team</Label>
                  <Input
                    id="edit-maxPlayersPerTeam"
                    type="number"
                    min="1"
                    max="30"
                    value={editFormData.maxPlayersPerTeam}
                    onChange={(e) => setEditFormData({ ...editFormData, maxPlayersPerTeam: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-minPlayersPerTeam">Minimum Players Per Team</Label>
                <Input
                  id="edit-minPlayersPerTeam"
                  type="number"
                  min="1"
                  max={editFormData.maxPlayersPerTeam}
                  value={editFormData.minPlayersPerTeam}
                  onChange={(e) => setEditFormData({ ...editFormData, minPlayersPerTeam: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used to calculate maximum allowable bid per team
                </p>
              </div>
              <div>
                <Label htmlFor="edit-minPlayerPrice">Minimum Player Price (₹)</Label>
                <Input
                  id="edit-minPlayerPrice"
                  type="number"
                  min="0"
                  step="1"
                  value={editFormData.minPlayerPrice}
                  onChange={(e) => setEditFormData({ ...editFormData, minPlayerPrice: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum reserve price for any player (set to 0 for no minimum)
                </p>
              </div>
              <div>
                <Label htmlFor="edit-minBidIncrement">Minimum Bid Increment (₹)</Label>
                <Input
                  id="edit-minBidIncrement"
                  type="number"
                  min="0"
                  step="1000"
                  value={editFormData.minBidIncrement}
                  onChange={(e) => setEditFormData({ ...editFormData, minBidIncrement: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum amount by which bids must increase (e.g., ₹50,000)
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? "Updating..." : "Update Auction"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading auctions...</div>
      ) : auctions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No auctions created yet</p>
            <Button onClick={() => setOpen(true)}>Create Your First Auction</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <Card key={auction.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{auction.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(auction)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline" className="bg-blue-50">
                        {auction.sport}
                      </Badge>
                      <Badge className={getStatusColor(auction.status)}>
                        {auction.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Teams:</span>
                    <span className="font-medium">
                      {auction._count.teams} / {auction.maxTeams}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Players:</span>
                    <span className="font-medium">{auction._count.players}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Players/Team:</span>
                    <span className="font-medium">{auction.maxPlayersPerTeam}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/admin/auctions/${auction.id}/players`}>
                        Manage Players
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/admin/auctions/${auction.id}/teams`}>
                        Manage Teams
                      </Link>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="default" className="flex-1" size="lg">
                      <Link href={`/admin/auctions/${auction.id}/conduct`}>
                        Conduct Auction
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className="flex-1" size="lg">
                      <Link href={`/admin/auctions/${auction.id}/analytics`}>
                        Analytics
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
