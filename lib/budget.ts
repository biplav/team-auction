/**
 * Calculate the maximum allowable bid for a team
 * This ensures the team maintains enough budget to fill minimum squad requirements
 *
 * @param remainingBudget - Team's current remaining budget
 * @param currentPlayerCount - Number of players already in the team
 * @param minPlayersPerTeam - Minimum players required per team (from auction rules)
 * @param minPlayerPrice - Minimum price per player (from auction rules)
 * @returns Maximum amount the team can bid while maintaining minimum squad requirements
 */
export function calculateMaxAllowableBid(
  remainingBudget: number,
  currentPlayerCount: number,
  minPlayersPerTeam: number,
  minPlayerPrice: number
): number {
  // Calculate how many more players are needed to reach minimum squad size
  // Subtract 1 because we're considering the current player being bid on
  const remainingRequiredPlayers = Math.max(
    0,
    minPlayersPerTeam - currentPlayerCount - 1
  );

  // Reserve budget for the remaining required players at minimum price
  const reservedBudget = remainingRequiredPlayers * minPlayerPrice;

  // Maximum allowable bid is remaining budget minus reserved budget
  const maxBid = remainingBudget - reservedBudget;

  // Ensure we don't return a negative value
  return Math.max(0, maxBid);
}

/**
 * Calculate the maximum allowable bid using dynamic calculation based on actual base prices
 * This ensures the team maintains enough budget to afford the cheapest remaining unsold players
 *
 * @param remainingBudget - Team's current remaining budget
 * @param currentPlayerCount - Number of players already in the team
 * @param minPlayersPerTeam - Minimum players required per team (from auction rules)
 * @param auctionId - ID of the auction to query unsold players
 * @param currentPlayerId - ID of the current player being bid on (to exclude from calculation)
 * @param prisma - Prisma client instance
 * @returns Object with maxAllowableBid, reservedAmount, and reservedPlayerCount
 */
export async function calculateDynamicMaxBid(
  remainingBudget: number,
  currentPlayerCount: number,
  minPlayersPerTeam: number,
  auctionId: string,
  currentPlayerId: string | undefined,
  prisma: any
): Promise<{
  maxAllowableBid: number;
  reservedAmount: number;
  reservedPlayerCount: number;
}> {
  // Calculate how many more players are needed to reach minimum squad size
  // Subtract 1 because we're considering the current player being bid on
  const remainingRequiredPlayers = Math.max(
    0,
    minPlayersPerTeam - currentPlayerCount - 1
  );

  if (remainingRequiredPlayers === 0) {
    return {
      maxAllowableBid: remainingBudget,
      reservedAmount: 0,
      reservedPlayerCount: 0,
    };
  }

  // Get the N cheapest unsold players (excluding current player being bid on)
  const cheapestPlayers = await prisma.player.findMany({
    where: {
      auctionId,
      status: 'UNSOLD',
      id: currentPlayerId ? { not: currentPlayerId } : undefined,
    },
    orderBy: { basePrice: 'asc' },
    take: remainingRequiredPlayers,
    select: { basePrice: true },
  });

  // Handle case where there are fewer unsold players than required
  const actualReservedPlayers = cheapestPlayers.length;
  const reservedAmount = cheapestPlayers.reduce(
    (sum: number, player: { basePrice: number }) => sum + player.basePrice,
    0
  );

  const maxAllowableBid = Math.max(0, remainingBudget - reservedAmount);

  return {
    maxAllowableBid,
    reservedAmount,
    reservedPlayerCount: actualReservedPlayers,
  };
}

/**
 * Calculate remaining required players for a team
 *
 * @param currentPlayerCount - Number of players already in the team
 * @param minPlayersPerTeam - Minimum players required per team
 * @returns Number of players still needed (excluding current bid)
 */
export function calculateRemainingRequiredPlayers(
  currentPlayerCount: number,
  minPlayersPerTeam: number
): number {
  return Math.max(0, minPlayersPerTeam - currentPlayerCount - 1);
}

/**
 * Format currency in Indian Rupee format
 *
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Check if a team can afford to bid on a player
 *
 * @param playerBasePrice - The base price of the current player
 * @param remainingBudget - Team's current remaining budget
 * @param currentPlayerCount - Number of players already in the team
 * @param minPlayersPerTeam - Minimum players required per team
 * @param minPlayerPrice - Minimum price per player
 * @returns Object with canAfford flag and reason if cannot afford
 */
export function canAffordPlayer(
  playerBasePrice: number,
  remainingBudget: number,
  currentPlayerCount: number,
  minPlayersPerTeam: number,
  minPlayerPrice: number
): { canAfford: boolean; reason?: string; maxAllowableBid: number } {
  const maxAllowableBid = calculateMaxAllowableBid(
    remainingBudget,
    currentPlayerCount,
    minPlayersPerTeam,
    minPlayerPrice
  );

  // Check if team has enough budget to even meet the base price
  if (playerBasePrice > remainingBudget) {
    return {
      canAfford: false,
      reason: `Insufficient budget. Player base price is ${formatCurrency(playerBasePrice)} but you only have ${formatCurrency(remainingBudget)} remaining.`,
      maxAllowableBid,
    };
  }

  // Check if team can bid base price while maintaining minimum squad requirements
  if (playerBasePrice > maxAllowableBid) {
    const remainingRequired = calculateRemainingRequiredPlayers(
      currentPlayerCount,
      minPlayersPerTeam
    );

    return {
      canAfford: false,
      reason: `Cannot afford this player. You need to reserve ${formatCurrency(remainingRequired * minPlayerPrice)} for ${remainingRequired} more player(s). Maximum you can bid is ${formatCurrency(maxAllowableBid)}, but base price is ${formatCurrency(playerBasePrice)}.`,
      maxAllowableBid,
    };
  }

  return { canAfford: true, maxAllowableBid };
}

/**
 * Validate if a bid amount is allowed for a team
 *
 * @param bidAmount - The proposed bid amount
 * @param remainingBudget - Team's current remaining budget
 * @param currentPlayerCount - Number of players already in the team
 * @param minPlayersPerTeam - Minimum players required per team
 * @param minPlayerPrice - Minimum price per player
 * @returns Object with isValid flag and error message if invalid
 */
export function validateBid(
  bidAmount: number,
  remainingBudget: number,
  currentPlayerCount: number,
  minPlayersPerTeam: number,
  minPlayerPrice: number
): { isValid: boolean; error?: string; maxAllowableBid?: number } {
  const maxAllowableBid = calculateMaxAllowableBid(
    remainingBudget,
    currentPlayerCount,
    minPlayersPerTeam,
    minPlayerPrice
  );

  if (bidAmount > maxAllowableBid) {
    const remainingRequired = calculateRemainingRequiredPlayers(
      currentPlayerCount,
      minPlayersPerTeam
    );

    return {
      isValid: false,
      error: `Bid exceeds maximum allowable amount. You need to reserve enough budget for ${remainingRequired} more player(s) at minimum ${formatCurrency(minPlayerPrice)} each. Maximum bid: ${formatCurrency(maxAllowableBid)}`,
      maxAllowableBid,
    };
  }

  if (bidAmount > remainingBudget) {
    return {
      isValid: false,
      error: `Insufficient budget. Remaining budget: ${formatCurrency(remainingBudget)}`,
    };
  }

  return { isValid: true, maxAllowableBid };
}
