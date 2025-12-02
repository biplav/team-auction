# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cricket Auction Platform - A professional real-time cricket player auction management system built with Next.js 16, TypeScript, Prisma, and Socket.io. Enables live bidding, team management, and comprehensive auction control for cricket tournaments.

## Development Commands

### Essential Commands
```bash
# Development server (uses custom server.js for Socket.io)
npm run dev

# Production build
npm run build

# Production server
npm start

# Linting
npm run lint

# Testing
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### Database Commands
```bash
# Generate Prisma client (required after schema changes)
npx prisma generate

# Push schema to database
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed admin user
npx tsx prisma/seed.ts

# Alternative: Setup admin via API
curl -X POST http://localhost:3000/api/setup-admin
```

### Common Development Patterns

When making database schema changes:
```bash
npx prisma generate && npx prisma db push
```

When testing locally with fresh install:
```bash
npm install && npm run dev
```

## Architecture

### Custom Server Architecture

**Critical**: This application uses a custom Node.js server (`server.js`) instead of the default Next.js server. This is required for Socket.io WebSocket support.

- `server.js` creates an HTTP server, Next.js handler, and Socket.io server
- Socket.io server path: `/api/socket`
- The server handles real-time events: `join-auction`, `place-bid`, `next-player`, `pause-auction`, `resume-auction`, `player-sold`, `bids-discarded`
- All Socket.io communication is room-based using `auction:${auctionId}` pattern

**Never remove or modify server.js without understanding its Socket.io integration.**

### Real-time Communication Flow

1. Clients connect to Socket.io server at `/api/socket`
2. Clients join auction rooms: `socket.emit('join-auction', auctionId)`
3. Events broadcast to all clients in room: `io.to('auction:${auctionId}').emit(eventName, data)`
4. Three main real-time interfaces:
   - Admin conduct page: Controls auction, sees all bids
   - Team owner bid page: Places bids, sees real-time updates
   - Public display page: Shows live auction feed

### Database Architecture (Prisma + CockroachDB)

**Database**: CockroachDB (PostgreSQL-compatible) with Prisma 6.19.0

**Key Models**:
- `User`: Admins and team owners with role-based access (ADMIN, TEAM_OWNER, VIEWER)
- `Auction`: Auction configuration with status tracking (NOT_STARTED, IN_PROGRESS, PAUSED, COMPLETED)
- `Team`: Teams with budget tracking (`initialBudget`, `remainingBudget`)
- `Player`: Players with stats, status (UNSOLD, SOLD, IN_AUCTION), and custom fields stored in `stats` JSON field
- `Bid`: Complete bidding history

**Important Relations**:
- `Auction.currentPlayer`: Current player being bid on (Player relation)
- `Team.owner`: Links team to User (team owner)
- `Player.stats`: JSON field for flexible custom fields (batting/bowling style, phone numbers, etc.)

**Prisma Adapter**: Uses `@prisma/adapter-pg` with `pg` pool (required for Prisma 6+). See `lib/prisma.ts` for configuration.

### Authentication (NextAuth v5)

- NextAuth v5 with credentials provider (`lib/auth.ts`)
- JWT-based sessions (not database sessions)
- Passwords hashed with bcryptjs
- Session callbacks extend token with `id` and `role`
- Protected routes check user role in server components

**Default Credentials**:
- Email: `admin@cricauction.com`
- Password: `admin123`

### Budget Validation System

Critical business logic in `lib/budget.ts`:

- `calculateMaxAllowableBid()`: Ensures teams reserve enough budget for minimum squad requirements
- `validateBid()`: Validates bid amounts before accepting
- `canAffordPlayer()`: Checks if team can afford player's base price while maintaining squad minimums

**Budget Rules**:
- Teams must maintain enough budget to reach `minPlayersPerTeam` (default: 11)
- Each remaining required player must be budgeted at `minPlayerPrice` (default: 0)
- Max allowable bid = `remainingBudget - (remainingRequiredPlayers * minPlayerPrice)`

**When modifying bidding logic, always consider budget validation to prevent teams from being unable to complete their squad.**

### File Upload System

Player bulk upload supports Excel/CSV with flexible column naming:
- Handled in `app/api/players/bulk-upload/route.ts`
- Uses `xlsx` and `papaparse` libraries
- Column name matching is case-insensitive and flexible (e.g., "Name", "Player Name", "player_name" all work)
- **All-or-nothing validation**: All rows validated before any data is inserted
- Custom fields stored in `Player.stats` JSON field

### Route Structure

**Admin Routes** (Protected - ADMIN role required):
- `/admin/auctions` - Auction management
- `/admin/auctions/[id]/players` - Player management (bulk upload, edit, delete)
- `/admin/auctions/[id]/teams` - Team management
- `/admin/auctions/[id]/conduct` - Live auction control panel
- `/admin/auctions/[id]/analytics` - Auction analytics
- `/admin/auctions/[id]/reports` - Generate reports (Excel export)

**Team Owner Routes**:
- `/team-owner/dashboard` - Team owner dashboard
- `/team-owner/team/[id]` - Team details
- `/auction/[id]/bid` - Real-time bidding interface (requires team assignment)

**Public Routes**:
- `/auction/[id]/display` - Full-screen public display for projectors
- `/auth/signin` - Sign in page

### API Route Patterns

**RESTful Conventions**:
- `GET /api/[resource]` - List resources
- `GET /api/[resource]/[id]` - Get single resource
- `POST /api/[resource]` - Create resource
- `PATCH /api/[resource]/[id]` - Update resource
- `DELETE /api/[resource]/[id]` - Delete resource

**Special Endpoints**:
- `POST /api/players/bulk-upload` - Bulk upload players (multipart/form-data)
- `POST /api/players/[id]/sell` - Sell player to team
- `POST /api/players/[id]/unsold` - Mark player unsold
- `POST /api/bids/discard` - Discard all bids for current player
- `GET /api/auctions/public` - Public auction list (no auth)

**All API routes return JSON and use Next.js App Router conventions (app/api/...).**

## Important Implementation Details

### Player Status Management

Player status transitions:
1. `UNSOLD` → `IN_AUCTION` (when set as current player)
2. `IN_AUCTION` → `SOLD` (when sold to team)
3. `IN_AUCTION` → `UNSOLD` (when marked unsold)

When a player is sold:
- Update `Player.status = SOLD`
- Set `Player.teamId` and `Player.soldPrice`
- Update `Team.remainingBudget`
- Broadcast `player-sold` event via Socket.io

### Auction State Management

Auction status must be synchronized between:
1. Database (Prisma)
2. Socket.io broadcasts
3. Multiple client interfaces (conduct, bid, display)

When changing auction state, always:
1. Update database via API route
2. Emit Socket.io event to auction room
3. Include full updated data in event payload

### Team Budget Tracking

Budget updates occur in two scenarios:
1. **Player sold**: Deduct `soldPrice` from `Team.remainingBudget`
2. **Player marked unsold after bids**: Refund all team bids back to `remainingBudget`

**Always update budget in same transaction as player status change to maintain consistency.**

### Custom Fields in Player Stats

The `Player.stats` field is a JSON column that stores flexible custom data:
```typescript
stats: {
  phoneNumber?: string
  battingStyle?: string
  bowlingStyle?: string
  // Any other custom fields from Excel upload
}
```

When rendering player data, check `stats` field for additional information.

## Testing

Test files use Jest with Testing Library:
- Configuration: `jest.config.js` and `jest.setup.js`
- Test location: `lib/__tests__/` and `components/ui/__tests__/`
- Coverage reports in `coverage/` directory

**Budget validation is critical - always test budget calculation changes thoroughly.**

## Environment Variables

Required environment variables (see `.env.example`):
```env
DATABASE_URL="postgresql://..."          # CockroachDB connection string
NEXTAUTH_SECRET="..."                    # Min 32 characters: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"     # App URL
```

## Deployment Considerations

### Socket.io in Production

**Vercel limitation**: Vercel serverless functions don't support persistent WebSocket connections. For production with real-time features:
- Option 1: Deploy to platforms supporting WebSockets (Railway, Render, DigitalOcean)
- Option 2: Use separate Socket.io server with Vercel frontend
- Option 3: Fall back to polling (requires code changes)

**The custom server.js is designed for traditional Node.js hosting, not serverless.**

### Database Connection Pooling

The app uses `@prisma/adapter-pg` with connection pooling. In production:
- Configure appropriate pool size in `lib/prisma.ts`
- Monitor connection usage with CockroachDB dashboard
- Consider connection limits when scaling

## Code Style Notes

- UI components use shadcn/ui (Radix UI + Tailwind)
- Currency formatting: Use `formatCurrency()` from `lib/budget.ts` for consistent INR formatting
- TypeScript strict mode enabled
- Server components by default (use `'use client'` directive only when needed)
