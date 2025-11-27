import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PlayerRole } from "@prisma/client";

interface PlayerRow {
  name: string;
  phoneNumber: string;
  role: string;
  basePrice: number;
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

function validateRow(row: PlayerRow, rowIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];

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

  if (!row.basePrice || isNaN(Number(row.basePrice))) {
    errors.push({
      row: rowIndex,
      field: "basePrice",
      message: "Base price must be a valid number",
    });
  } else if (Number(row.basePrice) < 0) {
    errors.push({
      row: rowIndex,
      field: "basePrice",
      message: "Base price cannot be negative",
    });
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

  return errors;
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

    // Verify auction exists
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    // Validate all rows first
    const allErrors: ValidationError[] = [];
    players.forEach((player, index) => {
      const rowErrors = validateRow(player, index + 2); // +2 because row 1 is header, array is 0-indexed
      allErrors.push(...rowErrors);
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

    // All validations passed, now create players
    const createdPlayers = await prisma.$transaction(
      players.map((player) => {
        const { name, phoneNumber, role, basePrice, ...otherFields } = player;

        return prisma.player.create({
          data: {
            name: name.trim(),
            role: normalizeRole(role),
            basePrice: Number(basePrice),
            auctionId,
            stats: {
              phoneNumber: phoneNumber.toString().trim(),
              ...otherFields,
            },
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${createdPlayers.length} players`,
      count: createdPlayers.length,
      players: createdPlayers,
    }, { status: 201 });
  } catch (error) {
    console.error("Error bulk uploading players:", error);
    return NextResponse.json(
      { error: "Failed to upload players" },
      { status: 500 }
    );
  }
}
