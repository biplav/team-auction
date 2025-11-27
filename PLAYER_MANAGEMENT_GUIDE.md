# Player Management - Complete Guide

## Features Implemented

### 1. Auction Management ✅
- **Create Auctions**: Set up new auctions with custom team limits and player quotas
- **View All Auctions**: Dashboard showing all auctions with statistics
- **Auction Details**: Track teams, players, and auction status

### 2. Player Upload via Excel/CSV ✅
- **Bulk Upload**: Upload hundreds of players at once
- **Validation Before Insert**: All rows are validated before any data is inserted
- **Error Reporting**: Detailed validation errors with row and field information
- **Template Download**: Get a pre-formatted Excel template

### 3. Manual Player Management ✅
- **Add Players**: Form-based player creation
- **Edit Players**: Update player information
- **Delete Players**: Remove players from auction
- **View All Players**: Comprehensive list with filtering

### 4. Player Data Fields

#### Required Fields:
- **Name**: Player's full name
- **Phone Number**: Contact information
- **Role**: BATSMAN, BOWLER, ALL_ROUNDER, or WICKET_KEEPER
- **Base Price**: Starting auction price

#### Optional Fields:
- **Batting Style**: e.g., "Right-hand bat"
- **Bowling Style**: e.g., "Right-arm fast"
- **Matches**: Number of matches played
- **Runs**: Total runs scored
- **Wickets**: Total wickets taken
- **Custom Fields**: Any additional fields in Excel will be stored

---

## How to Use

### Step 1: Create an Auction

1. Go to `/admin/auctions`
2. Click "Create New Auction"
3. Fill in:
   - Auction Name (e.g., "IPL 2024")
   - Maximum Teams (default: 8)
   - Maximum Players per Team (default: 15)
4. Click "Create Auction"

### Step 2: Add Players

You have **two options**:

#### Option A: Bulk Upload (Recommended for many players)

1. Click "Manage Players" on your auction
2. Go to "Bulk Upload" tab
3. Download the template Excel file
4. Fill in your player data:
   ```
   | name         | phoneNumber | role         | basePrice | battingStyle     | bowlingStyle    |
   |--------------|-------------|--------------|-----------|------------------|-----------------|
   | Virat Kohli  | 9876543210  | BATSMAN      | 20000     | Right-hand bat   | Right-arm medium|
   | Jasprit Bumrah| 9876543211 | BOWLER       | 18000     | Right-hand bat   | Right-arm fast  |
   ```
5. Click "Choose File" and select your Excel/CSV
6. System will validate all rows
7. If validation passes, all players are inserted
8. If validation fails, you'll see detailed errors

#### Option B: Manual Entry

1. Click "Manage Players" on your auction
2. Go to "Players List" tab
3. Click "Add Player Manually"
4. Fill in the form
5. Click "Add Player"

### Step 3: Manage Players

From the Players List tab:
- **Edit**: Click "Edit" button to modify player information
- **Delete**: Click "Delete" button to remove player
- **View**: See all player details in the table

---

## Excel/CSV Upload Format

### Column Mapping

The system is flexible with column names. It recognizes:

| Data | Accepted Column Names |
|------|----------------------|
| Player Name | `name`, `Name`, `NAME`, `Player Name`, `player name` |
| Phone | `phoneNumber`, `PhoneNumber`, `Phone Number`, `phone` |
| Role | `role`, `Role`, `ROLE` |
| Base Price | `basePrice`, `Base Price`, `price`, `Price` |

### Valid Roles

Use exactly one of these (case-insensitive):
- `BATSMAN`
- `BOWLER`
- `ALL_ROUNDER` (or `ALL ROUNDER`)
- `WICKET_KEEPER` (or `WICKET KEEPER`)

### Sample Excel Format

```
name              | phoneNumber  | role         | basePrice | battingStyle      | bowlingStyle     | matches | runs | wickets
Virat Kohli       | 9876543210   | BATSMAN      | 20000     | Right-hand bat    | Right-arm medium | 100     | 5000 | 5
Jasprit Bumrah    | 9876543211   | BOWLER       | 18000     | Right-hand bat    | Right-arm fast   | 80      | 200  | 150
Rohit Sharma      | 9876543212   | BATSMAN      | 19000     | Right-hand bat    | Right-arm off    | 95      | 4800 | 10
Hardik Pandya     | 9876543213   | ALL_ROUNDER  | 17000     | Right-hand bat    | Right-arm fast   | 70      | 2000 | 50
MS Dhoni          | 9876543214   | WICKET_KEEPER| 21000     | Right-hand bat    | Right-arm medium | 120     | 6000 | 2
```

---

## Validation Rules

### Before Upload (All Validations Run First)

1. **Name**: Cannot be empty
2. **Phone Number**: Cannot be empty
3. **Role**: Must be one of the valid roles
4. **Base Price**:
   - Must be a number
   - Cannot be negative
5. **Optional Numeric Fields** (matches, runs, wickets):
   - If provided, must be valid numbers

### Validation Process

1. ✅ All rows are read from Excel/CSV
2. ✅ Each row is validated individually
3. ✅ All errors are collected
4. ✅ If **any** row has errors, **nothing** is inserted
5. ✅ You get a detailed error report
6. ✅ Fix errors and re-upload
7. ✅ When all validations pass, **all players are inserted in one transaction**

### Example Validation Errors

```
Row 3, Field: role, Message: Invalid role. Must be one of: BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER
Row 5, Field: basePrice, Message: Base price must be a valid number
Row 7, Field: phoneNumber, Message: Phone number is required
```

---

## API Endpoints

### Auctions
- `GET /api/auctions` - List all auctions
- `POST /api/auctions` - Create new auction

### Players
- `GET /api/players?auctionId={id}` - List players for auction
- `POST /api/players` - Create single player
- `PUT /api/players` - Update player
- `DELETE /api/players?id={id}` - Delete player
- `POST /api/players/bulk-upload` - Bulk upload with validation

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **File Parsing**: xlsx (Excel), papaparse (CSV)
- **Database**: CockroachDB (PostgreSQL compatible)
- **ORM**: Prisma
- **Validation**: Server-side validation before insertion

---

## Key Features

✅ **Auction-based**: Players belong to specific auctions
✅ **Validation First**: No partial inserts, all-or-nothing
✅ **Flexible Columns**: Accepts various column name formats
✅ **Custom Fields**: Store any additional data in stats
✅ **Error Reporting**: Detailed, row-level error messages
✅ **Template**: Download pre-formatted Excel template
✅ **Dual Input**: Both Excel upload and manual entry
✅ **Full CRUD**: Create, Read, Update, Delete
✅ **Phone Numbers**: Store contact information
✅ **Cricket Stats**: Batting/bowling styles, matches, runs, wickets

---

## Next Steps

After adding players, you can:
1. **Add Teams** (coming next)
2. **Start Live Auction** with real-time bidding
3. **Assign Players** to winning teams
4. **View Analytics** on auction progress

---

## Troubleshooting

### Upload Fails - "Auction not found"
- Make sure you're on the correct auction's player page
- Auction ID must exist in database

### Validation Errors
- Check the error table for specific issues
- Common issues:
  - Misspelled role names
  - Empty required fields
  - Non-numeric values in price/stats fields

### File Not Uploading
- Ensure file is .xlsx, .xls, or .csv format
- Check file isn't corrupted
- Try the template file first to test

---

## Database Schema

```prisma
model Player {
  id        String       @id @default(cuid())
  name      String
  role      PlayerRole   // BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER
  basePrice Int
  soldPrice Int?
  status    PlayerStatus @default(UNSOLD) // UNSOLD, SOLD, IN_AUCTION
  teamId    String?
  auctionId String       // Required - player belongs to auction
  stats     Json?        // Stores phoneNumber, batting/bowling styles, etc.

  team      Team?
  auction   Auction
  bids      Bid[]

  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}
```

---

## Screenshots Reference

1. **Auctions List**: `/admin/auctions`
2. **Create Auction**: Click "Create New Auction" button
3. **Player Upload**: `/admin/auctions/{id}/players` → "Bulk Upload" tab
4. **Player List**: `/admin/auctions/{id}/players` → "Players List" tab
5. **Add/Edit Player**: Click "Add Player Manually" or "Edit" button

---

**Need Help?** Check the validation errors carefully - they tell you exactly what's wrong and where!
