# Cricket Auction Platform - Testing Guide

## Overview
This document provides a comprehensive testing plan for the Cricket Auction Platform. Follow these tests sequentially to verify all features work correctly.

## Prerequisites
- Development server running on http://localhost:3001
- Database is set up and accessible
- Multiple browser windows/tabs or devices for testing real-time features

---

## Test 1: User Authentication Flow

### Test 1.1: Admin Login
**Steps:**
1. Navigate to http://localhost:3001
2. If no users exist, you'll need to create one via direct database access
3. Login with admin credentials
4. Verify redirect to `/admin/auctions`
5. Check that "Admin" badge appears in navigation
6. Verify all navigation links are visible (Auctions, Users, My Teams, Logout)

**Expected Results:**
- ✅ Successful login
- ✅ Redirect to admin dashboard
- ✅ Admin badge visible
- ✅ All navigation options available

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 2: User Management

### Test 2.1: Create Team Owner User
**Steps:**
1. Navigate to `/admin/users`
2. Click "Add User"
3. Fill in:
   - Name: "Test Owner 1"
   - Email: "owner1@test.com"
   - Password: "password123"
   - Role: "Team Owner"
4. Click "Create User"

**Expected Results:**
- ✅ User created successfully
- ✅ User appears in users list
- ✅ Role badge shows "TEAM OWNER"

**Current Status:** [ ] PASS  [ ] FAIL

### Test 2.2: Create Multiple Team Owners
**Steps:**
1. Repeat Test 2.1 for at least 3 more team owners:
   - owner2@test.com
   - owner3@test.com
   - owner4@test.com

**Expected Results:**
- ✅ All users created successfully
- ✅ Users list shows all 4+ owners

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 3: Auction Creation

### Test 3.1: Create New Auction
**Steps:**
1. Navigate to `/admin/auctions`
2. Click "Create New Auction"
3. Fill in:
   - Auction Name: "Test IPL Auction 2024"
   - Maximum Teams: 8
   - Maximum Players per Team: 15
   - Minimum Players per Team: 11
   - Minimum Player Price: 50000
4. Click "Create Auction"

**Expected Results:**
- ✅ Auction created successfully
- ✅ Auction appears in auction list
- ✅ Status shows "NOT STARTED"
- ✅ All action buttons visible (Manage Players, Manage Teams, Conduct Auction, Analytics)

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 4: Team Management

### Test 4.1: Create Teams
**Steps:**
1. Click on the auction card
2. Click "Manage Teams"
3. Create 4-8 teams with the following details:
   - Team Name: "Mumbai Indians", "Chennai Super Kings", etc.
   - Owner: Assign to different team owners created earlier
   - Budget: 100000000 (1 Crore)
4. Repeat for each team

**Expected Results:**
- ✅ All teams created successfully
- ✅ Teams appear in teams list
- ✅ Owner names are correctly assigned
- ✅ Budget shows correctly

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 5: Player Management

### Test 5.1: Upload Players via Excel
**Steps:**
1. Navigate to "Manage Players" for the auction
2. Download the sample Excel template
3. Fill in 20-30 players with:
   - Name
   - Role (BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER)
   - Base Price (various amounts like 100000, 200000, etc.)
   - Optional stats
4. Upload the Excel file

**Expected Results:**
- ✅ Excel file uploads successfully
- ✅ All players appear in player list
- ✅ Roles are correctly assigned
- ✅ Base prices are correct

**Current Status:** [ ] PASS  [ ] FAIL

### Test 5.2: Manually Add Player
**Steps:**
1. Click "Add Player"
2. Fill in player details manually
3. Save

**Expected Results:**
- ✅ Player added successfully
- ✅ Player appears in list

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 6: Auction Workflow

### Test 6.1: Start Auction
**Steps:**
1. Navigate to "Conduct Auction"
2. Verify stats show:
   - Total players count
   - 0 sold
   - All players remaining
3. Click "Start Auction"

**Expected Results:**
- ✅ Status changes to "IN_PROGRESS"
- ✅ First player appears as "Current Player"
- ✅ All team budgets are visible
- ✅ Socket connection established

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 7: Real-Time Bidding

### Test 7.1: Set Up Multiple Interfaces
**Steps:**
1. Keep Admin conduct page open in one window
2. Open Team Owner 1's bidding interface in incognito window:
   - Login as owner1@test.com
   - Navigate to "My Teams"
   - Find team and join auction bidding
3. Open Public Display in another window:
   - Navigate to `/auction/[auctionId]/display`

**Expected Results:**
- ✅ All three interfaces load successfully
- ✅ Same player visible on all interfaces
- ✅ Socket connections established

**Current Status:** [ ] PASS  [ ] FAIL

### Test 7.2: Place Bids
**Steps:**
1. In Team Owner 1 window:
   - Verify current player is displayed
   - Check "Maximum Allowable Bid" is calculated correctly
   - Place a bid above base price
2. Verify in all three windows:
   - Bid appears in Admin interface
   - Bid appears in Public Display
   - Bid appears in Team Owner's Recent Bids

**Expected Results:**
- ✅ Bid placed successfully
- ✅ Real-time update in Admin interface (< 1 second)
- ✅ Real-time update in Public Display (< 1 second)
- ✅ Highest bidder shows correctly
- ✅ Team budget not yet deducted

**Current Status:** [ ] PASS  [ ] FAIL

### Test 7.3: Multiple Teams Bidding
**Steps:**
1. Login as different team owners in separate windows
2. Have 2-3 teams bid on the same player
3. Observe bidding war

**Expected Results:**
- ✅ All bids appear in real-time across all interfaces
- ✅ Highest bid is always highlighted
- ✅ Bid amounts incrementing correctly
- ✅ Team names showing correctly

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 8: Budget Constraints

### Test 8.1: Maximum Bid Calculation
**Steps:**
1. For a team with 0 players:
   - Budget: 100000000 (1 Crore)
   - Min players needed: 11
   - Min player price: 50000
   - Expected max bid: 100000000 - (10 × 50000) = 99500000
2. Verify this calculation shows correctly in bidding interface

**Expected Results:**
- ✅ Maximum allowable bid calculated correctly
- ✅ Formula: remainingBudget - (remainingRequiredPlayers × minPlayerPrice)
- ✅ Warning shows slots remaining

**Current Status:** [ ] PASS  [ ] FAIL

### Test 8.2: Prevent Exceeding Max Bid
**Steps:**
1. Try to place a bid higher than maximum allowable
2. Observe error message

**Expected Results:**
- ✅ Bid button disabled when amount exceeds max
- ✅ Error message shows explaining constraint
- ✅ API rejects bid with appropriate error

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 9: Player Sale Workflow

### Test 9.1: Sell Player to Highest Bidder
**Steps:**
1. In Admin interface, with active bids:
2. Click "Sell to [Team Name]"

**Expected Results:**
- ✅ Player status changes to "SOLD"
- ✅ Sold price equals highest bid
- ✅ Team budget deducted correctly
- ✅ Team player count increases
- ✅ Player appears in team's roster
- ✅ Next unsold player automatically becomes current
- ✅ All interfaces update in real-time

**Current Status:** [ ] PASS  [ ] FAIL

### Test 9.2: Mark Player Unsold
**Steps:**
1. With current player showing
2. Click "Mark Unsold" without any bids

**Expected Results:**
- ✅ Player status changes to "UNSOLD"
- ✅ Player not assigned to any team
- ✅ Next player becomes current
- ✅ All interfaces update

**Current Status:** [ ] PASS  [ ] FAIL

### Test 9.3: Skip to Next Player
**Steps:**
1. Click "Skip" button (forward icon)

**Expected Results:**
- ✅ Moves to next unsold player
- ✅ Previous player remains in its state
- ✅ All interfaces update

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 10: Auction Pause/Resume

### Test 10.1: Pause Auction
**Steps:**
1. During active auction, click "Pause"

**Expected Results:**
- ✅ Status changes to "PAUSED"
- ✅ Bidding interfaces show paused state
- ✅ Bid buttons disabled
- ✅ Socket broadcasts pause event

**Current Status:** [ ] PASS  [ ] FAIL

### Test 10.2: Resume Auction
**Steps:**
1. Click "Resume"

**Expected Results:**
- ✅ Status changes to "IN_PROGRESS"
- ✅ Bidding interfaces re-enable
- ✅ Same player remains current
- ✅ Socket broadcasts resume event

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 11: Squad Size Constraints

### Test 11.1: Team Reaches Minimum Squad
**Steps:**
1. Sell 11 players to one team
2. Check that team can still bid on remaining players

**Expected Results:**
- ✅ Team has 11 players
- ✅ Max allowable bid calculation adjusts
- ✅ Team can use full remaining budget

**Current Status:** [ ] PASS  [ ] FAIL

### Test 11.2: Team Below Minimum with Low Budget
**Steps:**
1. For a team with 8 players and 200000 remaining budget
2. Min players: 11, Min price: 50000
3. Expected max bid: 200000 - (3 × 50000) = 50000
4. Verify team cannot bid more than 50000

**Expected Results:**
- ✅ Max bid correctly shows 50000
- ✅ Higher bids are prevented
- ✅ Warning message clear

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 12: Auction Completion

### Test 12.1: Complete Auction
**Steps:**
1. Sell or mark unsold all players
2. Observe auction status change

**Expected Results:**
- ✅ When last player processed, status changes to "COMPLETED"
- ✅ No more players shown as current
- ✅ All interfaces show completion state

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 13: Analytics & Reporting

### Test 13.1: View Analytics
**Steps:**
1. Navigate to auction "Analytics" page
2. Review all statistics

**Expected Results:**
- ✅ Total spent by each team
- ✅ Players by role distribution
- ✅ Average prices per role
- ✅ Most expensive players
- ✅ Team-wise player distribution
- ✅ Unsold players count

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 14: Team Owner Dashboard

### Test 14.1: View My Teams
**Steps:**
1. Login as team owner
2. Navigate to "My Teams"

**Expected Results:**
- ✅ All owned teams visible
- ✅ Team details correct (budget, players, auction status)

**Current Status:** [ ] PASS  [ ] FAIL

### Test 14.2: View Team Roster
**Steps:**
1. Click on a team
2. View roster

**Expected Results:**
- ✅ All purchased players listed
- ✅ Sold prices shown
- ✅ Player roles visible
- ✅ Total spent calculated correctly

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 15: Admin as Team Owner

### Test 15.1: Admin Creating Team for Self
**Steps:**
1. Login as Admin
2. Create a team and assign to self

**Expected Results:**
- ✅ Admin can create team for self
- ✅ Admin can access "My Teams"
- ✅ Admin can see team in team owner dashboard

**Current Status:** [ ] PASS  [ ] FAIL

### Test 15.2: Admin Bidding
**Steps:**
1. As admin with team
2. Join auction bidding interface
3. Place bids

**Expected Results:**
- ✅ Admin can place bids
- ✅ Constraints apply to admin same as regular owners
- ✅ Admin Panel link visible in team owner nav

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 16: Public Display

### Test 16.1: Public Display Screen
**Steps:**
1. Open `/auction/[id]/display` without login
2. Observe during auction

**Expected Results:**
- ✅ Current player details visible
- ✅ Real-time bids update
- ✅ Team standings show
- ✅ Budget visualizations work
- ✅ Beautiful UI suitable for projection

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 17: Error Handling

### Test 17.1: Invalid Bid
**Steps:**
1. Try placing bid below current highest

**Expected Results:**
- ✅ Error message shown
- ✅ Bid not recorded

**Current Status:** [ ] PASS  [ ] FAIL

### Test 17.2: Insufficient Budget
**Steps:**
1. Try bidding more than remaining budget

**Expected Results:**
- ✅ Error message shown
- ✅ Bid prevented

**Current Status:** [ ] PASS  [ ] FAIL

---

## Test 18: Mobile Responsiveness

### Test 18.1: Mobile Admin Interface
**Steps:**
1. Open admin pages on mobile device or responsive mode
2. Navigate through all admin pages

**Expected Results:**
- ✅ Navigation works on mobile
- ✅ Tables are scrollable
- ✅ Buttons accessible
- ✅ Forms usable

**Current Status:** [ ] PASS  [ ] FAIL

### Test 18.2: Mobile Bidding Interface
**Steps:**
1. Open bidding interface on mobile
2. Try placing bids

**Expected Results:**
- ✅ Bid controls easy to use
- ✅ Real-time updates work
- ✅ Information clearly visible

**Current Status:** [ ] PASS  [ ] FAIL

---

## Summary Checklist

### Critical Features
- [ ] User authentication works
- [ ] Auction creation and configuration
- [ ] Team management
- [ ] Player upload (Excel & manual)
- [ ] Real-time bidding across all interfaces
- [ ] Budget constraints enforced
- [ ] Player sale workflow
- [ ] Auction completion

### Important Features
- [ ] Analytics page
- [ ] Team owner dashboard
- [ ] Admin as team owner
- [ ] Public display screen
- [ ] Pause/Resume functionality
- [ ] Error handling

### Nice to Have
- [ ] Mobile responsiveness
- [ ] Performance (< 1s for real-time updates)

---

## Known Issues / Notes

**Document any issues found during testing:**
1.
2.
3.

---

## Testing Environment

- **Date Tested:** _______________
- **Tester Name:** _______________
- **Browser:** _______________
- **OS:** _______________
- **Node Version:** _______________
- **Database:** CockroachDB / PostgreSQL

---

## Overall Test Result

**Total Tests:** 40+
**Tests Passed:** ___
**Tests Failed:** ___
**Success Rate:** ___%

**Status:** [ ] READY FOR PRODUCTION  [ ] NEEDS FIXES
