# Team Owner Documentation - README

This directory contains comprehensive user documentation for team owners participating in cricket auctions.

## 📚 What's Included

### Documentation Files

1. **TEAM_OWNER_MANUAL.md**
   - Complete detailed manual (text only)
   - 8 comprehensive sections covering all features
   - Suitable for distribution as markdown or conversion to any format

2. **TEAM_OWNER_MANUAL_WITH_IMAGES.md**
   - Enhanced manual with screenshot placeholders
   - Includes image references and captions
   - Ready for screenshots to be added

3. **TEAM_OWNER_QUICK_START.md**
   - Condensed quick reference guide
   - 10 essential sections for rapid onboarding
   - Perfect for team owners who need to get started quickly

### PDF Documents (in `/docs` folder)

1. **Team_Owner_Manual.pdf**
   - Professional PDF version of the complete manual
   - Styled with custom CSS for readability
   - Print-ready format

2. **Team_Owner_Quick_Start.pdf**
   - PDF version of quick start guide
   - Colorful headers and easy navigation
   - Ideal for printing as a quick reference card

3. **Team_Owner_Manual_With_Screenshots.pdf**
   - Manual with embedded screenshots
   - Currently includes available screenshots (login, dashboard)
   - Placeholders show where additional screenshots should be added

### Supporting Files

- **scripts/generate-pdf.js** - Script to regenerate PDFs from markdown
- **scripts/pdf-styles.css** - Custom CSS styling for PDFs
- **scripts/take-screenshots.js** - Automated screenshot capture tool
- **screenshots/** - Directory containing captured UI screenshots

## 🖼️ Current Screenshots

The following screenshots have been captured:

| Screenshot | Description | Used In |
|------------|-------------|---------|
| `01-login.png` | Login page (desktop) | All manuals |
| `02-admin-dashboard.png` | Admin dashboard view | Not yet used |
| `05-login-mobile.png` | Login page (mobile) | Mobile section |

### Missing Screenshots (To Be Added)

To complete the documentation, you'll need screenshots of:

1. **Team Owner Dashboard** (`02-team-owner-dashboard.png`)
   - Shows overview cards and team cards
   - Display auction status badges
   - Should show both "Active" and "Not Started" auctions

2. **Team Roster Page** (`03-team-roster.png`)
   - Team budget and player list
   - Budget utilization progress bar
   - Players grouped by role

3. **Bidding Page - Desktop** (`04-bidding-page.png`)
   - Current player information
   - Bid controls and buttons
   - Team budget and squad info
   - Recent bids list

4. **Dashboard Mobile** (`06-dashboard-mobile.png`)
   - Mobile view of dashboard
   - Team cards in mobile layout

5. **Bidding Page - Mobile** (`07-bidding-mobile.png`)
   - Mobile bidding interface
   - Sticky bottom panel with bid controls
   - Countdown timer (compact view)

## 📸 How to Add Screenshots

### Option 1: Manual Screenshots

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Create a team owner account and auction** (if not exists):
   - Login as admin
   - Create an auction
   - Add teams
   - Assign yourself as team owner

3. **Take screenshots:**
   - Login as team owner
   - Navigate to each page
   - Use your OS screenshot tool:
     - **macOS**: Cmd + Shift + 4
     - **Windows**: Win + Shift + S
     - **Linux**: PrintScreen or Shift + PrintScreen

4. **Save screenshots** to `screenshots/` folder with exact names listed above

5. **Regenerate PDFs:**
   ```bash
   node scripts/generate-pdf.js
   ```

### Option 2: Automated Screenshots (Requires Setup)

1. **Create team owner account** in your database

2. **Update screenshot script** (`scripts/take-screenshots.js`):
   - Replace admin credentials with team owner credentials on lines 102-103
   - Or create separate login flows for team owner

3. **Run screenshot script:**
   ```bash
   node scripts/take-screenshots.js
   ```

4. **Regenerate PDFs:**
   ```bash
   node scripts/generate-pdf.js
   ```

## 🎨 Customizing the Documentation

### Editing Content

1. **Edit markdown files** directly:
   - `TEAM_OWNER_MANUAL.md` - Main manual
   - `TEAM_OWNER_QUICK_START.md` - Quick start guide
   - `TEAM_OWNER_MANUAL_WITH_IMAGES.md` - Manual with images

2. **Regenerate PDFs** after changes:
   ```bash
   node scripts/generate-pdf.js
   ```

### Customizing PDF Styling

Edit `scripts/pdf-styles.css` to change:
- Colors and fonts
- Header/footer styles
- Page margins
- Table styling
- Code block appearance

After editing, regenerate PDFs.

### Adding Your Branding

1. **Add logo** to screenshots folder (e.g., `logo.png`)

2. **Update markdown files** to include logo:
   ```markdown
   ![Your Logo](screenshots/logo.png)
   ```

3. **Update CSS** for custom colors matching your brand

4. **Regenerate PDFs**

## 📤 Distribution

### For Team Owners

**Recommended Distribution:**

1. **Quick Start (First Time Users):**
   - Send `Team_Owner_Quick_Start.pdf`
   - 10-page condensed guide
   - Gets them started immediately

2. **Complete Reference (Detailed):**
   - Send `Team_Owner_Manual_With_Screenshots.pdf`
   - Full documentation with visuals
   - For reference during and after auction

3. **Digital Format:**
   - Share markdown files for easy online viewing
   - Can be opened in any text editor or markdown viewer
   - GitHub/GitLab will render them beautifully

### Printing Recommendations

**Quick Start Guide:**
- Print double-sided
- Staple in top-left corner
- Works great as a desk reference

**Full Manual:**
- Print double-sided
- Bind or use binder clips
- Consider color printing for maximum clarity

## 🔄 Maintenance

### When to Update Documentation

Update the documentation when you:
- Add new features to the platform
- Change the bidding rules
- Modify the UI significantly
- Receive feedback from team owners about confusing sections
- Change budget calculation logic

### How to Update

1. **Edit markdown files** with changes
2. **Update screenshots** if UI changed
3. **Regenerate PDFs:**
   ```bash
   node scripts/generate-pdf.js
   ```
4. **Version control**: Commit changes to git
5. **Redistribute** to team owners

## 📋 Checklist for Complete Documentation

- [x] Create comprehensive manual
- [x] Create quick start guide
- [x] Add PDF generation scripts
- [x] Add custom CSS styling
- [x] Generate initial PDFs
- [x] Create screenshot automation script
- [ ] Capture all required screenshots (3 of 7 complete)
- [ ] Add branding/logo
- [ ] Review and test with actual team owner
- [ ] Distribute to team owners

## 🛠️ Technical Details

### Dependencies

The PDF generation uses:
- **md-to-pdf**: Converts markdown to PDF
- **puppeteer**: Automates screenshot capture
- **Node.js**: Runs the scripts

These are already installed in your `devDependencies`.

### File Locations

```
cric_auction/
├── TEAM_OWNER_MANUAL.md                    # Main manual (markdown)
├── TEAM_OWNER_QUICK_START.md               # Quick start (markdown)
├── TEAM_OWNER_MANUAL_WITH_IMAGES.md        # Manual with screenshots
├── DOCUMENTATION_README.md                 # This file
├── docs/
│   ├── Team_Owner_Manual.pdf               # Generated PDF
│   ├── Team_Owner_Quick_Start.pdf          # Generated PDF
│   └── Team_Owner_Manual_With_Screenshots.pdf
├── screenshots/
│   ├── 01-login.png                        # Captured screenshots
│   ├── 02-admin-dashboard.png
│   ├── 05-login-mobile.png
│   └── ... (add more here)
└── scripts/
    ├── generate-pdf.js                      # PDF generator
    ├── pdf-styles.css                       # PDF styling
    └── take-screenshots.js                  # Screenshot automation
```

## 💡 Tips

1. **Keep markdown and PDFs in sync** - Always regenerate PDFs after editing markdown

2. **Version your PDFs** - Consider adding version numbers or dates to filenames

3. **Test with users** - Have a team owner review the docs before distributing widely

4. **Collect feedback** - Ask team owners what's confusing and update accordingly

5. **Automate distribution** - Consider emailing PDFs automatically when assigning teams

6. **Mobile-first** - Many team owners will use phones during auction - ensure mobile instructions are clear

7. **Keep it updated** - Schedule quarterly reviews to ensure docs match current platform

## 📞 Support

If team owners have questions not covered in the documentation:
1. Note the question
2. Update the relevant section in markdown
3. Regenerate PDFs
4. Redistribute updated version

This creates a living document that improves over time.

---

**Document Status:** ✅ Ready for Use (Screenshots partially complete)

**Last Updated:** December 2025

**Next Steps:**
1. Complete missing screenshots (see checklist above)
2. Test with team owner
3. Add branding if desired
4. Distribute to team owners
