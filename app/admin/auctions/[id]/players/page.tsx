"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from "xlsx";

interface Player {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  status: string;
  stats?: any;
  team?: {
    id: string;
    name: string;
  };
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function PlayersPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const auctionId = params.id as string;

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    role: "",
    basePrice: "",
    battingStyle: "",
    bowlingStyle: "",
    matches: "",
    runs: "",
    wickets: "",
  });

  useEffect(() => {
    fetchPlayers();
  }, [auctionId]);

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`/api/players?auctionId=${auctionId}`);
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        // Convert to expected format
        const players = json.map((row: any) => ({
          name: row.name || row.Name || row.NAME || row["Player Name"] || row["player name"] || "",
          phoneNumber: row.phoneNumber || row.PhoneNumber || row["Phone Number"] || row.phone || "",
          role: row.role || row.Role || row.ROLE || "",
          basePrice: row.basePrice || row["Base Price"] || row.price || row.Price || 0,
          battingStyle: row.battingStyle || row["Batting Style"] || "",
          bowlingStyle: row.bowlingStyle || row["Bowling Style"] || "",
          matches: row.matches || row.Matches || "",
          runs: row.runs || row.Runs || "",
          wickets: row.wickets || row.Wickets || "",
        }));

        await uploadPlayers(players);
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Error parsing file. Please ensure it's a valid Excel/CSV file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const uploadPlayers = async (playerData: any[]) => {
    setUploading(true);
    setValidationErrors([]);
    setUploadSuccess(false);

    try {
      const response = await fetch("/api/players/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auctionId,
          players: playerData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUploadSuccess(true);
        setValidationErrors([]);
        fetchPlayers();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        alert(`Successfully uploaded ${data.count} players!`);
      } else {
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors);
        } else {
          alert(data.error || "Failed to upload players");
        }
      }
    } catch (error) {
      console.error("Error uploading players:", error);
      alert("Failed to upload players");
    } finally {
      setUploading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPlayer ? "/api/players" : "/api/players";
      const method = editingPlayer ? "PUT" : "POST";

      const payload = {
        ...(editingPlayer ? { id: editingPlayer.id } : {}),
        name: formData.name,
        role: formData.role,
        basePrice: formData.basePrice,
        phoneNumber: formData.phoneNumber,
        auctionId,
        stats: {
          battingStyle: formData.battingStyle,
          bowlingStyle: formData.bowlingStyle,
          matches: formData.matches,
          runs: formData.runs,
          wickets: formData.wickets,
        },
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowAddDialog(false);
        setEditingPlayer(null);
        setFormData({
          name: "",
          phoneNumber: "",
          role: "",
          basePrice: "",
          battingStyle: "",
          bowlingStyle: "",
          matches: "",
          runs: "",
          wickets: "",
        });
        fetchPlayers();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save player");
      }
    } catch (error) {
      console.error("Error saving player:", error);
      alert("Failed to save player");
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm("Are you sure you want to delete this player?")) return;

    try {
      const response = await fetch(`/api/players?id=${playerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPlayers();
      } else {
        alert("Failed to delete player");
      }
    } catch (error) {
      console.error("Error deleting player:", error);
      alert("Failed to delete player");
    }
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      phoneNumber: player.stats?.phoneNumber || "",
      role: player.role,
      basePrice: player.basePrice.toString(),
      battingStyle: player.stats?.battingStyle || "",
      bowlingStyle: player.stats?.bowlingStyle || "",
      matches: player.stats?.matches || "",
      runs: player.stats?.runs || "",
      wickets: player.stats?.wickets || "",
    });
    setShowAddDialog(true);
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "Virat Kohli",
        phoneNumber: "9876543210",
        role: "BATSMAN",
        basePrice: 5000000,
        battingStyle: "Right-hand",
        bowlingStyle: "Right-arm medium",
        jerseyNumber: 18,
        city: "Delhi",
      },
      {
        name: "Rohit Sharma",
        phoneNumber: "9876543211",
        role: "BATSMAN",
        basePrice: 4500000,
        battingStyle: "Right-hand",
        bowlingStyle: "Right-arm off break",
        jerseyNumber: 45,
        city: "Mumbai",
      },
      {
        name: "Jasprit Bumrah",
        phoneNumber: "9876543212",
        role: "BOWLER",
        basePrice: 4000000,
        battingStyle: "Right-hand",
        bowlingStyle: "Right-arm fast",
        jerseyNumber: 93,
        city: "Ahmedabad",
      },
      {
        name: "Ravindra Jadeja",
        phoneNumber: "9876543213",
        role: "ALL_ROUNDER",
        basePrice: 3500000,
        battingStyle: "Left-hand",
        bowlingStyle: "Left-arm orthodox",
        jerseyNumber: 8,
        city: "Jamnagar",
      },
      {
        name: "MS Dhoni",
        phoneNumber: "9876543214",
        role: "WICKET_KEEPER",
        basePrice: 3000000,
        battingStyle: "Right-hand",
        bowlingStyle: "Right-arm medium",
        jerseyNumber: 7,
        city: "Ranchi",
      },
      {
        name: "KL Rahul",
        phoneNumber: "9876543215",
        role: "WICKET_KEEPER",
        basePrice: 3500000,
        battingStyle: "Right-hand",
        bowlingStyle: "Right-arm medium",
        jerseyNumber: 1,
        city: "Bangalore",
      },
      {
        name: "Hardik Pandya",
        phoneNumber: "9876543216",
        role: "ALL_ROUNDER",
        basePrice: 3200000,
        battingStyle: "Right-hand",
        bowlingStyle: "Right-arm fast-medium",
        jerseyNumber: 33,
        city: "Baroda",
      },
      {
        name: "Rishabh Pant",
        phoneNumber: "9876543217",
        role: "WICKET_KEEPER",
        basePrice: 3000000,
        battingStyle: "Left-hand",
        bowlingStyle: "NA",
        jerseyNumber: 17,
        city: "Delhi",
      },
      {
        name: "Shubman Gill",
        phoneNumber: "9876543218",
        role: "BATSMAN",
        basePrice: 2500000,
        battingStyle: "Right-hand",
        bowlingStyle: "Right-arm off break",
        jerseyNumber: 77,
        city: "Punjab",
      },
      {
        name: "Mohammed Shami",
        phoneNumber: "9876543219",
        role: "BOWLER",
        basePrice: 2800000,
        battingStyle: "Right-hand",
        bowlingStyle: "Right-arm fast",
        jerseyNumber: 11,
        city: "Amroha",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Players");
    XLSX.writeFile(wb, "players_template.xlsx");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push("/admin/auctions")}>
          ← Back to Auctions
        </Button>
        <h1 className="text-3xl font-bold mt-4">Player Management</h1>
        <p className="text-muted-foreground">Upload players via Excel/CSV or add manually</p>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
          <TabsTrigger value="players">Players List ({players.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Players from Excel/CSV</CardTitle>
              <CardDescription>
                Upload multiple players at once. All rows will be validated before insertion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Required Columns:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>name</strong> or <strong>Player Name</strong> - Player's full name</li>
                  <li><strong>phoneNumber</strong> or <strong>Phone Number</strong> - Contact number</li>
                  <li><strong>role</strong> - One of: BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER</li>
                  <li><strong>basePrice</strong> or <strong>Base Price</strong> - Starting auction price</li>
                </ul>
                <h3 className="font-semibold mt-3 mb-2">Optional Columns:</h3>
                <p className="text-sm">battingStyle, bowlingStyle, matches, runs, wickets, or any custom fields</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadTemplate} variant="outline">
                  Download Template
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? "Uploading..." : "Choose File"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {validationErrors.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-700">
                      Validation Errors ({validationErrors.length})
                    </CardTitle>
                    <CardDescription>
                      Fix these errors in your file and try again
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Field</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationErrors.map((error, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{error.row}</TableCell>
                              <TableCell className="font-medium">{error.field}</TableCell>
                              <TableCell>{error.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">All Players</h2>
              <p className="text-muted-foreground">{players.length} players in this auction</p>
            </div>
            <Button onClick={() => {
              setEditingPlayer(null);
              setShowAddDialog(true);
            }}>
              Add Player Manually
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading players...</div>
          ) : players.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No players added yet</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowAddDialog(true)}>Add Manually</Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Upload Excel/CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell>{player.stats?.phoneNumber || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{player.role.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>₹{player.basePrice.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={
                            player.status === "SOLD" ? "bg-green-500" :
                            player.status === "IN_AUCTION" ? "bg-yellow-500" :
                            "bg-gray-500"
                          }>
                            {player.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{player.team?.name || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditPlayer(player)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeletePlayer(player.id)}>
                              Delete
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
        </TabsContent>
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlayer ? "Edit Player" : "Add New Player"}</DialogTitle>
            <DialogDescription>
              {editingPlayer ? "Update player information" : "Add a new player to the auction"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Player Name*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number*</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role*</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BATSMAN">Batsman</SelectItem>
                    <SelectItem value="BOWLER">Bowler</SelectItem>
                    <SelectItem value="ALL_ROUNDER">All Rounder</SelectItem>
                    <SelectItem value="WICKET_KEEPER">Wicket Keeper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="basePrice">Base Price*</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="battingStyle">Batting Style</Label>
                <Input
                  id="battingStyle"
                  value={formData.battingStyle}
                  onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })}
                  placeholder="e.g., Right-hand bat"
                />
              </div>
              <div>
                <Label htmlFor="bowlingStyle">Bowling Style</Label>
                <Input
                  id="bowlingStyle"
                  value={formData.bowlingStyle}
                  onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })}
                  placeholder="e.g., Right-arm fast"
                />
              </div>
              <div>
                <Label htmlFor="matches">Matches Played</Label>
                <Input
                  id="matches"
                  type="number"
                  value={formData.matches}
                  onChange={(e) => setFormData({ ...formData, matches: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="runs">Total Runs</Label>
                <Input
                  id="runs"
                  type="number"
                  value={formData.runs}
                  onChange={(e) => setFormData({ ...formData, runs: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="wickets">Total Wickets</Label>
                <Input
                  id="wickets"
                  type="number"
                  value={formData.wickets}
                  onChange={(e) => setFormData({ ...formData, wickets: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddDialog(false);
                setEditingPlayer(null);
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPlayer ? "Update Player" : "Add Player"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
