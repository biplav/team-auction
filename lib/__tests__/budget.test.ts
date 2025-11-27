import {
  calculateMaxAllowableBid,
  calculateRemainingRequiredPlayers,
  formatCurrency,
  validateBid,
  canAffordPlayer,
} from '../budget';

describe('Budget Calculation Functions', () => {
  describe('calculateMaxAllowableBid', () => {
    it('should calculate max bid for team with no players', () => {
      // Team has 100 Crore, needs 11 players minimum, min price is 50k
      // Max bid = 10,00,00,000 - (10 × 50,000) = 99,500,000
      const result = calculateMaxAllowableBid(
        100000000, // 10 Crore
        0,         // 0 players
        11,        // min 11 players
        50000      // min 50k per player
      );
      expect(result).toBe(99500000);
    });

    it('should calculate max bid for team with some players', () => {
      // Team has 50 Crore, has 5 players, needs 11 minimum, min price is 50k
      // Needs 5 more players (11 - 5 - 1 = 5)
      // Max bid = 5,00,00,000 - (5 × 50,000) = 49,750,000
      const result = calculateMaxAllowableBid(
        50000000,  // 5 Crore
        5,         // 5 players
        11,        // min 11 players
        50000      // min 50k per player
      );
      expect(result).toBe(49750000);
    });

    it('should allow full budget when minimum players reached', () => {
      // Team has 20 Crore, has 11 players (minimum met)
      // No more players required, can use full budget
      const result = calculateMaxAllowableBid(
        20000000,  // 2 Crore
        11,        // 11 players (minimum met)
        11,        // min 11 players
        50000      // min 50k per player
      );
      expect(result).toBe(20000000);
    });

    it('should handle team above minimum squad size', () => {
      // Team has 10 Lakh, has 13 players (above minimum)
      // Can use full budget
      const result = calculateMaxAllowableBid(
        1000000,   // 10 Lakh
        13,        // 13 players
        11,        // min 11 players
        50000      // min 50k per player
      );
      expect(result).toBe(1000000);
    });

    it('should return 0 when budget insufficient for requirements', () => {
      // Team has 2 Lakh, needs 5 more players at 50k each (needs 2.5 Lakh minimum)
      // Cannot bid on current player
      const result = calculateMaxAllowableBid(
        200000,    // 2 Lakh
        5,         // 5 players
        11,        // min 11 players
        50000      // min 50k per player
      );
      expect(result).toBe(0);
    });

    it('should handle exact budget scenario', () => {
      // Team has exactly enough for remaining players
      // Has 2.5 Lakh, needs 5 more players at 50k each
      const result = calculateMaxAllowableBid(
        250000,    // 2.5 Lakh
        5,         // 5 players
        11,        // min 11 players
        50000      // min 50k per player
      );
      expect(result).toBe(0); // Needs to reserve all for remaining 5 players
    });

    it('should handle edge case with 1 player needed', () => {
      // Team has 1 Crore, has 9 players, needs 11
      // Needs 1 more player after this bid
      const result = calculateMaxAllowableBid(
        10000000,  // 1 Crore
        9,         // 9 players
        11,        // min 11 players
        50000      // min 50k per player
      );
      expect(result).toBe(9950000); // Reserve 50k for last player
    });
  });

  describe('calculateRemainingRequiredPlayers', () => {
    it('should calculate remaining players for empty team', () => {
      const result = calculateRemainingRequiredPlayers(0, 11);
      expect(result).toBe(10); // Need 10 more (excluding current bid)
    });

    it('should calculate remaining players for partial team', () => {
      const result = calculateRemainingRequiredPlayers(5, 11);
      expect(result).toBe(5); // Need 5 more (excluding current bid)
    });

    it('should return 0 when minimum reached', () => {
      const result = calculateRemainingRequiredPlayers(11, 11);
      expect(result).toBe(0);
    });

    it('should return 0 when above minimum', () => {
      const result = calculateRemainingRequiredPlayers(15, 11);
      expect(result).toBe(0);
    });

    it('should handle 1 player away from minimum', () => {
      const result = calculateRemainingRequiredPlayers(10, 11);
      expect(result).toBe(0); // Current bid fills the minimum
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in Indian Rupee format', () => {
      const result = formatCurrency(100000);
      expect(result).toBe('₹1,00,000');
    });

    it('should format large amounts correctly', () => {
      const result = formatCurrency(100000000);
      expect(result).toBe('₹10,00,00,000');
    });

    it('should format zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toBe('₹0');
    });

    it('should not show decimal places', () => {
      const result = formatCurrency(100000.99);
      expect(result).toBe('₹1,00,001');
    });

    it('should handle small amounts', () => {
      const result = formatCurrency(50000);
      expect(result).toBe('₹50,000');
    });

    it('should format 1 Crore correctly', () => {
      const result = formatCurrency(10000000);
      expect(result).toBe('₹1,00,00,000');
    });
  });

  describe('validateBid', () => {
    describe('valid bids', () => {
      it('should allow valid bid within constraints', () => {
        const result = validateBid(
          5000000,   // Bid: 50 Lakh
          100000000, // Budget: 10 Crore
          0,         // Players: 0
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should allow maximum allowable bid', () => {
        const result = validateBid(
          99500000,  // Bid: Max allowable
          100000000, // Budget: 10 Crore
          0,         // Players: 0
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.isValid).toBe(true);
      });

      it('should allow full budget when minimum met', () => {
        const result = validateBid(
          20000000,  // Bid: 2 Crore
          20000000,  // Budget: 2 Crore
          11,        // Players: 11 (minimum met)
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.isValid).toBe(true);
      });
    });

    describe('invalid bids - budget constraints', () => {
      it('should reject bid exceeding max allowable', () => {
        const result = validateBid(
          99600000,  // Bid: 9.96 Crore (too high)
          100000000, // Budget: 10 Crore
          0,         // Players: 0
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Bid exceeds maximum allowable amount');
        expect(result.error).toContain('10 more player(s)');
        expect(result.maxAllowableBid).toBe(99500000);
      });

      it('should reject bid exceeding remaining budget', () => {
        const result = validateBid(
          30000000,  // Bid: 3 Crore
          20000000,  // Budget: 2 Crore (insufficient)
          11,        // Players: 11
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.isValid).toBe(false);
        // When minimum is met, the error will be about max allowable bid (which equals remaining budget)
        expect(result.error).toBeDefined();
      });

      it('should provide helpful error message with calculations', () => {
        const result = validateBid(
          50000000,  // Bid: 5 Crore
          50000000,  // Budget: 5 Crore
          5,         // Players: 5
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('5 more player(s)');
        expect(result.error).toContain('₹50,000');
        expect(result.error).toContain('₹4,97,50,000');
      });
    });

    describe('edge cases', () => {
      it('should handle team with exactly one slot remaining', () => {
        const result = validateBid(
          9950000,   // Bid: 99.5 Lakh
          10000000,  // Budget: 1 Crore
          9,         // Players: 9
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.isValid).toBe(true);
      });

      it('should reject when no budget left for minimum requirements', () => {
        const result = validateBid(
          100000,    // Bid: 1 Lakh
          200000,    // Budget: 2 Lakh
          5,         // Players: 5
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.isValid).toBe(false);
        expect(result.maxAllowableBid).toBe(0);
      });

      it('should handle minimum price of 0', () => {
        const result = validateBid(
          50000000,  // Bid: 5 Crore
          50000000,  // Budget: 5 Crore
          0,         // Players: 0
          11,        // Min players: 11
          0          // Min price: 0 (no minimum)
        );
        expect(result.isValid).toBe(true);
      });
    });

    describe('realistic auction scenarios', () => {
      it('should handle typical IPL scenario - early auction', () => {
        // Team starts with 10 Crore, no players, bids 2 Crore on star player
        const result = validateBid(
          20000000,  // Bid: 2 Crore
          100000000, // Budget: 10 Crore
          0,         // Players: 0
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.isValid).toBe(true);
      });

      it('should handle mid-auction scenario', () => {
        // Team has 4 Crore left, 6 players, needs 5 more at min 50k
        const result = validateBid(
          1500000,   // Bid: 15 Lakh
          40000000,  // Budget: 4 Crore
          6,         // Players: 6
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.isValid).toBe(true);
      });

      it('should prevent overspending in late auction', () => {
        // Team has 3 Lakh left, 8 players, needs 3 more at 50k each
        // Max bid = 3L - 2×50k = 2L
        // Bidding 2.5L should fail
        const result = validateBid(
          250000,    // Bid: 2.5 Lakh (too high)
          300000,    // Budget: 3 Lakh
          8,         // Players: 8
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.isValid).toBe(false);
        expect(result.maxAllowableBid).toBe(200000); // 3L - 2×50k = 2L
      });
    });
  });

  describe('canAffordPlayer', () => {
    describe('team cannot afford - budget lower than base price', () => {
      it('should return false when remaining budget is less than player base price', () => {
        const result = canAffordPlayer(
          500000,    // Base price: 5 Lakh
          300000,    // Budget: 3 Lakh (not enough!)
          5,         // Players: 5
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(false);
        expect(result.reason).toContain('Insufficient budget');
        expect(result.reason).toContain('₹5,00,000');
        expect(result.reason).toContain('₹3,00,000');
      });

      it('should return false when base price exactly equals remaining budget but need to reserve', () => {
        const result = canAffordPlayer(
          500000,    // Base price: 5 Lakh
          500000,    // Budget: 5 Lakh (but need to reserve!)
          8,         // Players: 8
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(false);
        expect(result.reason).toContain('Cannot afford this player');
        expect(result.reason).toContain('reserve');
      });

      it('should handle very low budget scenario', () => {
        // Team has only 1 Lakh, player costs 10 Lakh
        const result = canAffordPlayer(
          1000000,   // Base price: 10 Lakh
          100000,    // Budget: 1 Lakh
          0,         // Players: 0
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(false);
        expect(result.reason).toContain('Insufficient budget');
      });

      it('should return false when max allowable bid is less than base price', () => {
        // Team has 3 Lakh, needs 5 more players at 50k = 2.5L reserved
        // Max bid = 3L - 2.5L = 50k
        // But player base price is 2 Lakh
        const result = canAffordPlayer(
          200000,    // Base price: 2 Lakh
          300000,    // Budget: 3 Lakh
          5,         // Players: 5
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(false);
        expect(result.reason).toContain('Cannot afford this player');
        expect(result.reason).toContain('₹2,50,000'); // Reserved amount
        expect(result.reason).toContain('₹50,000'); // Max bid
        expect(result.reason).toContain('₹2,00,000'); // Base price
      });
    });

    describe('team can afford', () => {
      it('should return true when team has plenty of budget', () => {
        const result = canAffordPlayer(
          1000000,   // Base price: 10 Lakh
          100000000, // Budget: 10 Crore
          0,         // Players: 0
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(true);
        expect(result.reason).toBeUndefined();
        expect(result.maxAllowableBid).toBe(99500000);
      });

      it('should return true when base price equals max allowable bid', () => {
        // Team has 5 Lakh, needs 5 more players at 50k = 2.5L reserved
        // Max bid = 5L - 2.5L = 2.5L
        // Base price is exactly 2.5L
        const result = canAffordPlayer(
          250000,    // Base price: 2.5 Lakh
          500000,    // Budget: 5 Lakh
          5,         // Players: 5
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(true);
        expect(result.maxAllowableBid).toBe(250000);
      });

      it('should return true when minimum squad is met', () => {
        // Team has minimum players, can use full budget
        const result = canAffordPlayer(
          2000000,   // Base price: 20 Lakh
          5000000,   // Budget: 50 Lakh
          11,        // Players: 11 (minimum met)
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(true);
        expect(result.maxAllowableBid).toBe(5000000);
      });

      it('should return true when base price is low', () => {
        const result = canAffordPlayer(
          50000,     // Base price: 50k (minimum)
          200000,    // Budget: 2 Lakh
          9,         // Players: 9
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(true);
        expect(result.maxAllowableBid).toBe(150000); // 2L - 1×50k = 1.5L
      });
    });

    describe('edge cases', () => {
      it('should handle zero budget', () => {
        const result = canAffordPlayer(
          100000,    // Base price: 1 Lakh
          0,         // Budget: 0
          10,        // Players: 10
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(false);
        expect(result.reason).toContain('Insufficient budget');
      });

      it('should handle base price of 0', () => {
        const result = canAffordPlayer(
          0,         // Base price: 0 (free player?)
          100000,    // Budget: 1 Lakh
          10,        // Players: 10
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(true);
      });

      it('should handle exact budget match scenario', () => {
        // Team has exactly enough for base price, nothing more
        const result = canAffordPlayer(
          100000,    // Base price: 1 Lakh
          100000,    // Budget: 1 Lakh
          11,        // Players: 11 (minimum met, so no reservation needed)
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(true);
        expect(result.maxAllowableBid).toBe(100000);
      });

      it('should return correct maxAllowableBid even when cannot afford', () => {
        const result = canAffordPlayer(
          1000000,   // Base price: 10 Lakh (too high)
          200000,    // Budget: 2 Lakh
          5,         // Players: 5
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(false);
        // Max bid should still be calculated correctly: 2L - 5×50k = -50k -> 0
        expect(result.maxAllowableBid).toBe(0);
      });
    });

    describe('realistic scenarios - NaN prevention', () => {
      it('should handle late auction with depleted budget gracefully', () => {
        // Real scenario: Team spent too much, has 50k left, needs 2 more players
        // Player costs 2 Lakh
        const result = canAffordPlayer(
          200000,    // Base price: 2 Lakh
          50000,     // Budget: 50k (very low)
          9,         // Players: 9
          11,        // Min players: 11
          50000      // Min price: 50k
        );
        expect(result.canAfford).toBe(false);
        expect(result.reason).toBeDefined();
        expect(result.maxAllowableBid).toBe(0); // No budget after reservation
      });

      it('should prevent NaN when displaying unaffordable player info', () => {
        // This is the scenario that was causing NaN in UI
        const playerBasePrice = 5000000; // 50 Lakh
        const remainingBudget = 100000;  // 1 Lakh

        const result = canAffordPlayer(
          playerBasePrice,
          remainingBudget,
          8,         // Players: 8
          11,        // Min players: 11
          50000      // Min price: 50k
        );

        expect(result.canAfford).toBe(false);
        // maxAllowableBid should be 0, not negative or NaN
        expect(result.maxAllowableBid).toBeGreaterThanOrEqual(0);
        expect(Number.isNaN(result.maxAllowableBid)).toBe(false);

        // Should be safe to format
        const formatted = formatCurrency(result.maxAllowableBid);
        expect(formatted).toBe('₹0');
      });

      it('should handle all teams running out of budget scenario', () => {
        // Multiple teams might be in this state late in auction
        const result = canAffordPlayer(
          10000000,  // Base price: 1 Crore (star player)
          200000,    // Budget: 2 Lakh (depleted)
          10,        // Players: 10
          11,        // Min players: 11
          50000      // Min price: 50k
        );

        expect(result.canAfford).toBe(false);
        expect(result.reason).toContain('Insufficient budget');
        expect(Number.isNaN(result.maxAllowableBid)).toBe(false);
      });
    });
  });
});
