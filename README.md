# Cricket Auction Platform

A professional cricket player auction management system built with Next.js, TypeScript, Prisma, and Socket.io. This platform enables real-time bidding, team management, and comprehensive auction control for cricket tournaments.

## Features

### Admin Features
- **Auction Management**: Create and manage multiple cricket auctions
- **Player Management**:
  - Bulk upload players via Excel/CSV with validation
  - Manual add/edit/delete interface
  - Phone numbers, cricket stats, and custom fields support
- **Team Management**: CRUD operations for teams with budget tracking
- **Live Auction Control**:
  - Start/pause/resume auctions
  - Move through players
  - Sell players to highest bidder
  - Mark players as unsold
  - View real-time bids

### Team Owner Features
- **Real-time Bidding Interface**: Place bids during live auctions
- **Budget Tracking**: Monitor remaining budget and spending
- **Live Updates**: See all bids in real-time via Socket.io
- **Quick Bid Controls**: Increment/decrement bid amounts easily

### Public Display
- **Full-screen Auction Display**: Perfect for projectors and public viewing
- **Live Bid Updates**: Shows current player, bids, and team standings
- **Team Leaderboard**: Real-time team rankings and budget status

## Tech Stack

- **Frontend**: Next.js 16.0.4 (Turbopack), React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: NextAuth.js v5
- **Database**: CockroachDB (PostgreSQL compatible) with Prisma 6.19.0
- **Real-time**: Socket.io for live bidding
- **File Processing**: xlsx, papaparse for Excel/CSV handling

## Getting Started

### Prerequisites

- Node.js 18+ installed
- CockroachDB or PostgreSQL database
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cricket-auction
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:
```env
DATABASE_URL="postgresql://username:password@host:26257/database?sslmode=require"
NEXTAUTH_SECRET="your-secret-key"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

4. Run database migrations:
```bash
npx prisma generate
npx prisma db push
```

5. Seed the database with admin user:
```bash
npx tsx prisma/seed.ts
```

Or use the setup API:
```bash
curl -X POST http://localhost:3000/api/setup-admin
```

6. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Default Credentials

**Admin Account:**
- Email: `admin@cricauction.com`
- Password: `admin123`

**Important**: Change these credentials in production!

## Application Structure

### Routes

#### Admin Routes (Protected - Requires ADMIN role)
- `/admin/auctions` - List and create auctions
- `/admin/auctions/[id]/players` - Manage players for an auction
- `/admin/auctions/[id]/teams` - Manage teams for an auction
- `/admin/auctions/[id]/conduct` - Conduct live auction (admin control panel)

#### Public Routes
- `/` - Homepage
- `/auth/signin` - Admin sign in page

#### Auction Routes
- `/auction/[id]/display` - Public display screen for projection
- `/auction/[id]/bid` - Team owner bidding interface (requires team assignment)

### API Routes

- `POST /api/auctions` - Create auction
- `GET /api/auctions` - List auctions
- `GET /api/auctions/[id]` - Get auction details
- `PATCH /api/auctions/[id]` - Update auction

- `POST /api/teams` - Create team
- `GET /api/teams` - List teams
- `PATCH /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team

- `POST /api/players/bulk-upload` - Upload players via Excel/CSV
- `GET /api/players` - List players
- `GET /api/players/[id]` - Get player details
- `PATCH /api/players/[id]` - Update player
- `DELETE /api/players/[id]` - Delete player
- `POST /api/players/[id]/sell` - Sell player to team
- `POST /api/players/[id]/unsold` - Mark player as unsold

- `POST /api/bids` - Place a bid
- `GET /api/bids` - Get bids (filter by playerId or teamId)

- `GET /api/users` - List users (admin only)

## Workflow

### 1. Initial Setup
1. Admin signs in with default credentials
2. Create a new auction (specify max teams, max players per team)

### 2. Prepare Auction
1. Navigate to the auction
2. Create teams with budgets and assign owners (optional)
3. Upload players via Excel/CSV or add manually
   - Excel should have: Name, Phone Number, Role, Base Price, etc.
   - System validates ALL rows before inserting ANY data

### 3. Conduct Auction
1. Admin opens "Conduct Auction" page
2. Click "Start Auction" to begin
3. For each player:
   - Team owners place bids via their bidding interface
   - Admin sees all bids in real-time
   - Admin can sell to highest bidder or mark as unsold
   - Admin moves to next player
4. Public display shows live auction feed

### 4. Real-time Updates
- All connected clients receive instant updates via Socket.io
- Bid changes, player changes, and auction status updates broadcast automatically
- Public display and bidding interfaces stay synchronized

## Excel/CSV Upload Format

The player upload accepts flexible column names. Example columns:

| Name / Player Name | Phone Number / phoneNumber | Role / ROLE | Base Price / basePrice | Batting Style | Bowling Style |
|-------------------|---------------------------|-------------|----------------------|---------------|---------------|
| Virat Kohli       | 9876543210               | BATSMAN     | 5000000             | Right-hand    | Right-arm     |
| Jasprit Bumrah    | 9876543211               | BOWLER      | 4500000             | Right-hand    | Right-arm fast|

**Player Roles**: BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER

**Validation Rules**:
- Name is required
- Role must be one of the valid roles
- Base price must be a positive number
- All rows are validated before any data is inserted
- If any row fails, the entire upload is rejected with detailed error messages

## Database Schema

### Key Models

- **User**: Admin and team owner accounts with role-based access
- **Auction**: Cricket auctions with status tracking
- **Team**: Teams with budget management
- **Player**: Player profiles with stats and auction status
- **Bid**: Bidding history for each player

### Player Status
- `UNSOLD`: Available for bidding
- `SOLD`: Purchased by a team

### Auction Status
- `NOT_STARTED`: Created but not started
- `IN_PROGRESS`: Live auction in progress
- `PAUSED`: Temporarily paused
- `COMPLETED`: Auction finished

## Real-time Events (Socket.io)

The application uses Socket.io for real-time communication:

**Client Events (emitted by clients)**:
- `join-auction` - Join an auction room
- `leave-auction` - Leave an auction room
- `place-bid` - Place a bid on current player

**Server Events (broadcast to clients)**:
- `bid-placed` - New bid was placed
- `current-player-changed` - Auction moved to next player
- `player-sold` - Player was sold to a team
- `auction-paused` - Auction was paused
- `auction-resumed` - Auction was resumed

## Production Deployment

### Pre-Deployment Checklist

1. **Verify Production Build**:
```bash
npm run build
```
This will compile your app and check for TypeScript errors.

2. **Set Environment Variables**:
Ensure these are configured in your production environment:
```env
DATABASE_URL="production-database-url"
NEXTAUTH_SECRET="strong-random-secret"  # Use: openssl rand -base64 32
NEXTAUTH_URL="https://yourdomain.com"
```

3. **Security Checklist**:
- [ ] Change default admin credentials (`admin@cricauction.com` / `admin123`)
- [ ] Use a strong `NEXTAUTH_SECRET` (minimum 32 characters)
- [ ] Configure HTTPS with valid SSL certificate
- [ ] Set up CORS for Socket.io appropriately
- [ ] Enable database backups
- [ ] Review and update role-based access controls
- [ ] Ensure `.env` is not committed to Git
- [ ] Test all critical user flows

4. **Database Setup**:
```bash
npx prisma generate
npx prisma db push
```

Then seed admin user (or use `/api/setup-admin` endpoint once deployed).

### Deployment Options

#### Option 1: Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables in Vercel settings
4. Deploy

**Socket.io Note**: Vercel doesn't support WebSocket connections out of the box. For full real-time functionality, consider:
- Using Vercel with a separate Socket.io server (e.g., on Railway, Render)
- Or deploy the entire app to a platform that supports WebSockets

#### Option 2: Docker Deployment

```bash
# Build production image
npm run build

# Start production server
npm start
```

#### Option 3: VPS/Cloud Server (AWS, DigitalOcean, etc.)

1. Clone repository on server
2. Install dependencies: `npm install`
3. Set up environment variables
4. Build: `npm run build`
5. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "cricket-auction" -- start
pm2 save
pm2 startup
```

### Post-Deployment

1. **Verify Services**:
   - [ ] Application loads correctly
   - [ ] Database connection works
   - [ ] Authentication functions properly
   - [ ] Socket.io real-time updates work
   - [ ] File uploads work (players CSV/Excel)

2. **Monitor Application**:
   - Set up error tracking (Sentry, LogRocket, etc.)
   - Configure uptime monitoring
   - Set up database backups schedule

3. **Create First Auction**:
   - Sign in as admin
   - Create auction, teams, and upload players
   - Test full auction flow

## Development

### Database Migrations
After schema changes:
```bash
npx prisma generate
npx prisma db push
```

### View Database
```bash
npx prisma studio
```

## Project Structure

```
cric_auction/
├── app/
│   ├── admin/
│   │   └── auctions/
│   │       ├── page.tsx                    # Auction list
│   │       └── [id]/
│   │           ├── players/page.tsx        # Player management
│   │           ├── teams/page.tsx          # Team management
│   │           └── conduct/page.tsx        # Admin control panel
│   ├── auction/
│   │   └── [id]/
│   │       ├── display/page.tsx            # Public display
│   │       └── bid/page.tsx                # Team owner bidding
│   ├── auth/
│   │   └── signin/page.tsx                 # Sign in page
│   ├── api/
│   │   ├── auctions/                       # Auction endpoints
│   │   ├── teams/                          # Team endpoints
│   │   ├── players/                        # Player endpoints
│   │   ├── bids/                           # Bidding endpoints
│   │   ├── users/                          # User endpoints
│   │   ├── setup-admin/                    # Admin setup
│   │   └── socket/                         # Socket.io server
│   └── page.tsx                            # Homepage
├── components/ui/                          # shadcn/ui components
├── lib/
│   ├── auth.ts                             # NextAuth config
│   ├── prisma.ts                           # Prisma client
│   └── socket.ts                           # Socket.io utilities
├── prisma/
│   ├── schema.prisma                       # Database schema
│   └── seed.ts                             # Database seeding
└── types/                                  # TypeScript types
```

## Troubleshooting

### Common Issues

**1. Prisma Connection Error**
- Ensure DATABASE_URL is correct
- Check database is accessible
- Verify Prisma adapter is configured (required for Prisma 7)

**2. Socket.io Not Connecting**
- Check if Socket.io server is running
- Verify firewall/proxy settings
- Ensure correct Socket.io path (`/api/socket`)

**3. Excel Upload Fails**
- Check column names match expected format (case-insensitive)
- Verify all required fields are present
- Review validation error messages for specific issues

**4. Authentication Not Working**
- Ensure NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Verify admin user exists in database

## Development Roadmap

- [x] Project setup with Next.js, TypeScript, Tailwind
- [x] Database schema design with Prisma
- [x] Authentication system with NextAuth.js
- [x] UI components setup with shadcn/ui
- [x] Player management CRUD with Excel/CSV upload
- [x] Team management CRUD
- [x] Auction configuration and management
- [x] Socket.io real-time bidding engine
- [x] Admin control panel for conducting auctions
- [x] Team owner bidding interface
- [x] Public display screen
- [x] Analytics dashboard with team & player insights
- [x] Bid management (discard bids, refund on unsold)
- [x] Budget validation with minimum squad requirements
- [ ] Advanced reporting & export features (PDF/Excel)
- [ ] Email notifications for team owners
- [ ] Mobile app (React Native)
- [ ] Multi-language support

## License

MIT License - Feel free to use for your tournaments!

## Support

For issues, feature requests, or questions, please create an issue in the repository.

---

Built with ❤️ using Next.js, TypeScript, Prisma, and Socket.io
