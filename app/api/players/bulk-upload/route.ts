import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PlayerRole } from "@prisma/client";

interface PlayerRow {
  name: string;
  phoneNumber: string;
  role: string;
  basePrice?: number | string | null;
  battingStyle?: string;
  bowlingStyle?: string;
  matches?: number;
  runs?: number;
  wickets?: number;
  [key: string]: any; // Allow additional custom fields
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

function validatePlayerRole(role: string): boolean {
  const validRoles = ["BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKET_KEEPER"];
  return validRoles.includes(role.toUpperCase().replace(/\s+/g, "_"));
}

function normalizeRole(role: string): PlayerRole {
  const normalized = role.toUpperCase().replace(/\s+/g, "_");
  return normalized as PlayerRole;
}

function validateRow(row: PlayerRow, rowIndex: number, defaultBasePrice: number): { errors: ValidationError[], finalPrice: number, usingDefault: boolean } {
  const errors: ValidationError[] = [];
  let finalPrice = defaultBasePrice;
  let usingDefault = false;

  // Required fields validation
  if (!row.name || row.name.trim() === "") {
    errors.push({
      row: rowIndex,
      field: "name",
      message: "Player name is required",
    });
  }

  if (!row.phoneNumber || row.phoneNumber.toString().trim() === "") {
    errors.push({
      row: rowIndex,
      field: "phoneNumber",
      message: "Phone number is required",
    });
  }

  if (!row.role || row.role.trim() === "") {
    errors.push({
      row: rowIndex,
      field: "role",
      message: "Player role is required",
    });
  } else if (!validatePlayerRole(row.role)) {
    errors.push({
      row: rowIndex,
      field: "role",
      message: `Invalid role. Must be one of: BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER`,
    });
  }

  // Base price validation - now optional, use default if missing
  if (row.basePrice === undefined || row.basePrice === null || row.basePrice === '') {
    // Use auction's default price
    finalPrice = defaultBasePrice;
    usingDefault = true;
  } else if (isNaN(Number(row.basePrice))) {
    errors.push({
      row: rowIndex,
      field: "basePrice",
      message: "Base price must be a valid number or left empty to use default",
    });
  } else if (Number(row.basePrice) < 0) {
    errors.push({
      row: rowIndex,
      field: "basePrice",
      message: "Base price cannot be negative",
    });
  } else {
    finalPrice = Number(row.basePrice);
    usingDefault = false;
  }

  // Optional numeric fields validation
  const numericFields = ["matches", "runs", "wickets"];
  numericFields.forEach((field) => {
    if (row[field] !== undefined && row[field] !== "" && isNaN(Number(row[field]))) {
      errors.push({
        row: rowIndex,
        field,
        message: `${field} must be a valid number`,
      });
    }
  });

  return { errors, finalPrice, usingDefault };
}

// POST /api/players/bulk-upload - Upload players from Excel/CSV
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { auctionId, players } = body;

    if (!auctionId) {
      return NextResponse.json(
        { error: "auctionId is required" },
        { status: 400 }
      );
    }

    if (!players || !Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { error: "Players array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Verify auction exists and fetch minPlayerPrice
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { id: true, minPlayerPrice: true },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    // Determine default base price (fallback to ₹5L if auction's minPlayerPrice is 0)
    const defaultBasePrice = auction.minPlayerPrice || 500000;

    // Fetch existing players in this auction to check for duplicates by phone number
    const existingPlayers = await prisma.player.findMany({
      where: { auctionId },
      select: {
        id: true,
        stats: true,
      },
    });

    // Build a map of phoneNumber -> playerId for quick lookup
    const phoneToPlayerMap = new Map<string, string>();
    existingPlayers.forEach(player => {
      if (player.stats && typeof player.stats === 'object') {
        const stats = player.stats as any;
        if (stats.phoneNumber) {
          const normalizedPhone = stats.phoneNumber.toString().trim();
          phoneToPlayerMap.set(normalizedPhone, player.id);
        }
      }
    });

    // Validate all rows first and collect pricing info
    const allErrors: ValidationError[] = [];
    const playerPriceInfo: Array<{ player: PlayerRow, finalPrice: number, usingDefault: boolean, existingPlayerId?: string }> = [];

    players.forEach((player, index) => {
      const result = validateRow(player, index + 2, defaultBasePrice); // +2 because row 1 is header, array is 0-indexed
      allErrors.push(...result.errors);

      // Check if player exists by phone number
      const normalizedPhone = player.phoneNumber.toString().trim();
      const existingPlayerId = phoneToPlayerMap.get(normalizedPhone);

      playerPriceInfo.push({
        player,
        finalPrice: result.finalPrice,
        usingDefault: result.usingDefault,
        existingPlayerId,
      });
    });

    // If there are any validation errors, return them without inserting anything
    if (allErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          validationErrors: allErrors,
          totalRows: players.length,
          errorCount: allErrors.length,
        },
        { status: 400 }
      );
    }

    // All validations passed, now upsert players (update if exists, create if not)
    let createdCount = 0;
    let updatedCount = 0;

    const upsertedPlayers = await prisma.$transaction(
      playerPriceInfo.map(({ player, finalPrice, existingPlayerId }) => {
        const { name, phoneNumber, role, basePrice, ...otherFields } = player;

        if (existingPlayerId) {
          // Update existing player
          updatedCount++;
          return prisma.player.update({
            where: { id: existingPlayerId },
            data: {
              name: name.trim(),
              role: normalizeRole(role),
              basePrice: finalPrice,
              stats: {
                phoneNumber: phoneNumber.toString().trim(),
                ...otherFields,
              },
            },
          });
        } else {
          // Create new player
          createdCount++;
          return prisma.player.create({
            data: {
              name: name.trim(),
              role: normalizeRole(role),
              basePrice: finalPrice,
              auctionId,
              stats: {
                phoneNumber: phoneNumber.toString().trim(),
                ...otherFields,
              },
            },
          });
        }
      })
    );

    // Count how many players used default price
    const playersUsingDefault = playerPriceInfo.filter(p => p.usingDefault).length;

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${upsertedPlayers.length} players (${createdCount} created, ${updatedCount} updated)`,
      count: upsertedPlayers.length,
      createdCount,
      updatedCount,
      defaultPriceUsed: defaultBasePrice,
      playersUsingDefault: playersUsingDefault,
      playersWithSpecifiedPrice: upsertedPlayers.length - playersUsingDefault,
      players: upsertedPlayers,
    }, { status: 201 });
  } catch (error) {
    console.error("Error bulk uploading players:", error);
    return NextResponse.json(
      { error: "Failed to upload players" },
      { status: 500 }
    );
  }
}
