"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Edit, Plus, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  initialBudget: number;
  remainingBudget: number;
  owner: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  players: {
    id: string;
    name: string;
    role: string;
    soldPrice: number | null;
  }[];
  _count: {
    players: number;
  };
}

interface Auction {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function TeamsPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;

  const [teams, setTeams] = useState<Team[]>([]);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    ownerId: "",
    budget: "",
  });

  useEffect(() => {
    fetchData();
  }, [auctionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, auctionRes, usersRes] = await Promise.all([
        fetch(`/api/teams?auctionId=${auctionId}`),
        fetch(`/api/auctions/${auctionId}`),
        fetch(`/api/users`),
      ]);

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }

      if (auctionRes.ok) {
        const auctionData = await auctionRes.json();
        setAuction(auctionData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          ownerId: formData.ownerId || null,
          auctionId,
          budget: parseInt(formData.budget),
        }),
      });

      if (res.ok) {
        setIsCreateOpen(false);
        setFormData({ name: "", ownerId: "", budget: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    try {
      const res = await fetch(`/api/teams/${editingTeam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          ownerId: formData.ownerId || null,
          budget: parseInt(formData.budget),
        }),
      });

      if (res.ok) {
        setIsEditOpen(false);
        setEditingTeam(null);
        setFormData({ name: "", ownerId: "", budget: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Error updating team:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      ownerId: team.owner?.id || "",
      budget: team.initialBudget.toString(),
    });
    setIsEditOpen(true);
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
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/admin/auctions/${auctionId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Auction
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            {auction && (
              <p className="text-muted-foreground mt-1">
                Managing teams for: {auction.name}
              </p>
            )}
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Add a new team to this auction
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Team Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Mumbai Indians"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner">Team Owner (Optional)</Label>
                    <select
                      id="owner"
                      value={formData.ownerId}
                      onChange={(e) =>
                        setFormData({ ...formData, ownerId: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">No owner assigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget (₹)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      placeholder="10000000"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Team</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No teams yet. Create your first team to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Teams ({teams.length})</CardTitle>
            <CardDescription>
              Manage teams participating in this auction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      {team.owner ? (
                        <div>
                          <div className="font-medium">
                            {team.owner.name || "No name"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {team.owner.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          No owner assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(team.initialBudget)}</TableCell>
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
                    <TableCell>{team._count.players}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(team)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(team.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Team Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-owner">Team Owner (Optional)</Label>
                <select
                  id="edit-owner"
                  value={formData.ownerId}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerId: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No owner assigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="edit-budget">Budget (₹)</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Remaining budget will be adjusted automatically
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update Team</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
