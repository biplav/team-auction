# How to Complete Screenshots for Documentation

## Current Status

✅ **Screenshots We Have:**
- `screenshots/01-login.png` - Desktop login page (43 KB)
- `screenshots/02-admin-dashboard.png` - Admin dashboard (145 KB)
- `screenshots/05-login-mobile.png` - Mobile login page (177 KB)

❌ **Screenshots We Need:**
1. `screenshots/02-team-owner-dashboard.png` - Team Owner Dashboard
2. `screenshots/03-team-roster.png` - Team Roster Page
3. `screenshots/04-bidding-page.png` - Desktop Bidding Interface
4. `screenshots/06-dashboard-mobile.png` - Mobile Dashboard
5. `screenshots/07-bidding-mobile.png` - Mobile Bidding Interface

## Quick Way to Get Screenshots

### Method 1: Use Existing Test Data

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Login as admin:**
   - Go to http://localhost:3000/auth/signin
   - Email: admin@cricauction.com
   - Password: admin123

3. **Create test auction** (if not exists):
   - Create auction with teams
   - Add players
   - Assign yourself as team owner to one team

4. **Logout and login as team owner:**
   - Use team owner credentials
   - Take screenshots of dashboard

5. **Capture each screenshot:**

   **Desktop Screenshots (1920x1080):**
   - Browser at full screen
   - macOS: Cmd+Shift+4, then Space, then click window
   - Windows: Win+Shift+S, select area
   - Linux: PrintScreen or Shift+PrintScreen

   **Mobile Screenshots (375x812 - iPhone X size):**
   - Use Chrome DevTools
   - F12 → Toggle device toolbar (Cmd+Shift+M)
   - Select "iPhone X" from device dropdown
   - Take screenshot: Cmd+Shift+P → "Capture screenshot"

### Method 2: Automated with Puppeteer

1. **Create a team owner account in your database:**
   ```bash
   # You'll need to create this via admin panel or directly in database
   ```

2. **Update the screenshot script:**
   Edit `scripts/take-screenshots.js`:
   - Replace `admin@cricauction.com` with team owner email on line 29
   - Replace `admin123` with team owner password on line 30

3. **Run the script:**
   ```bash
   node scripts/take-screenshots.js
   ```

4. **Verify screenshots:**
   ```bash
   ls -lh screenshots/
   ```

## Screenshot Requirements

### 1. Team Owner Dashboard
**Filename:** `02-team-owner-dashboard.png`
**Page:** `/team-owner/dashboard`
**Size:** Desktop (1920x1080)

**What to capture:**
- Top overview cards (Total Teams, Players, Spent, Remaining Budget)
- At least one team card showing:
  - Team name
  - Auction status badge (preferably "LIVE" green badge)
  - Player count
  - Budget remaining with progress bar
  - "View Roster" and "Join Bidding" buttons

**Tips:**
- Have at least one auction in "IN_PROGRESS" status
- Show team with some players already purchased
- Budget progress bar should be visible and meaningful

---

### 2. Team Roster Page
**Filename:** `03-team-roster.png`
**Page:** `/team-owner/team/[team-id]`
**Size:** Desktop (1920x1080)

**What to capture:**
- Summary cards at top (Total Players, Budget, Spent, Remaining)
- Budget utilization progress bar
- Player table showing at least 3-5 players
- Players grouped by role section (if visible)

**Tips:**
- Team should have several players purchased
- Show different player roles (batsman, bowler, all-rounder)
- Budget should show realistic utilization

---

### 3. Desktop Bidding Page
**Filename:** `04-bidding-page.png`
**Page:** `/auction/[auction-id]/bid`
**Size:** Desktop (1920x1080)

**What to capture:**
- Left side: Current player info with name, role, base price
- Right side: Bid controls and team budget
- Countdown timer (if enabled)
- Recent bids section with at least 2-3 bids
- "Place Bid" button clearly visible

**Tips:**
- Have auction in "IN_PROGRESS" status
- Current player should be set
- Show realistic bids from different teams
- Ensure "Maximum Allowable Bid" warning is visible

---

### 4. Mobile Dashboard
**Filename:** `06-dashboard-mobile.png`
**Page:** `/team-owner/dashboard`
**Size:** Mobile (375x812 - iPhone X)

**What to capture:**
- Mobile view of overview cards (stacked vertically)
- Team cards in mobile layout
- "Join Bidding" button for active auction
- Status badges clearly visible

**Tips:**
- Capture full page screenshot (scroll to show all content)
- Ensure touch-friendly button sizes are apparent

---

### 5. Mobile Bidding Page
**Filename:** `07-bidding-mobile.png`
**Page:** `/auction/[auction-id]/bid`
**Size:** Mobile (375x812 - iPhone X)

**What to capture:**
- Player information at top
- Scrollable middle content
- **Sticky bottom panel** with:
  - Countdown timer (compact)
  - Your bid vs highest bid
  - Quick bid buttons (-, +1x, +2x, +)
  - Large "Place Bid" button
  - Budget info at bottom

**Tips:**
- Show realistic bidding scenario
- Sticky bottom panel is the most important part
- Ensure panel stays fixed at bottom

---

## After Capturing Screenshots

1. **Save all screenshots** to the `screenshots/` folder with exact filenames

2. **Update the markdown** file to use actual images:
   ```bash
   # Find and replace placeholders in TEAM_OWNER_MANUAL_WITH_IMAGES.md
   ```

   Or manually edit:
   - Change `**[Screenshot: Name]**` to `![Alt Text](screenshots/filename.png)`

3. **Regenerate PDFs:**
   ```bash
   node scripts/generate-pdf.js
   ```

4. **Verify PDFs:**
   - Open `docs/Team_Owner_Manual_With_Screenshots.pdf`
   - Check that all images are embedded and visible
   - Ensure images are clear and properly sized

5. **Check file sizes:**
   ```bash
   ls -lh docs/
   ```
   - PDF with screenshots should be ~1-2 MB
   - If too small (<500KB), images might not be embedded

## Troubleshooting

### Images not showing in PDF

**Solution 1:** Use absolute paths
```javascript
// In generate-pdf.js, add launch_options
pdf_options: {
  args: ['--allow-file-access-from-files']
}
```

**Solution 2:** Convert to base64
```bash
# Install image converter
npm install --save-dev markdown-pdf-images
```

**Solution 3:** Use online images
- Upload screenshots to GitHub or image host
- Update markdown with full URLs
- Regenerate PDFs

### Screenshots too large

**Compress images:**
```bash
# macOS
brew install imagemagick
mogrify -resize 50% screenshots/*.png

# or use online tools like tinypng.com
```

### Wrong aspect ratio

**Crop/resize:**
```bash
# Use Preview (macOS), Paint (Windows), or GIMP (Linux)
# Maintain aspect ratio: 16:9 for desktop, 9:19.5 for mobile
```

## Quality Checklist

Before finalizing, ensure:
- [ ] All 5 missing screenshots are captured
- [ ] Screenshots are clear and readable (no blur)
- [ ] Text in screenshots is legible
- [ ] Show realistic data (not empty states)
- [ ] Mobile screenshots show sticky bottom panel
- [ ] Desktop screenshots show full interface
- [ ] Color scheme matches actual application
- [ ] No sensitive data visible (use test data only)
- [ ] File sizes are reasonable (<200KB each)
- [ ] Filenames match exactly (case-sensitive)
- [ ] PDFs regenerated successfully
- [ ] Images embedded in PDFs (check file size increase)

## Alternative: Use Existing Screenshots

If you can't get team owner access right now, you can:

1. **Use admin screenshots temporarily:**
   - Copy `02-admin-dashboard.png` to `02-team-owner-dashboard.png`
   - Add note in manual: "Note: Screenshot shows admin view, team owner view is similar"

2. **Use mockups/wireframes:**
   - Create simple mockups in Figma/Sketch
   - Screenshot the mockups
   - Clearly label as "Mockup - actual interface may vary"

3. **Wait for production data:**
   - Deploy to staging/production
   - Use real team owner account
   - Capture from live environment

---

**Ready to capture screenshots?** Follow the steps above and you'll have complete documentation!
