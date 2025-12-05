const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function takeScreenshots() {
  console.log('🚀 Starting screenshot capture...');

  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('📸 Capturing Login Page...');
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle0' });
    await page.screenshot({
      path: path.join(screenshotsDir, '01-login.png'),
      fullPage: true
    });

    // Login with team owner credentials
    console.log('🔐 Logging in as team owner...');
    await page.type('#email', 'owner1@dp.com');
    await page.type('#password', 'owner');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Check if we're on team owner dashboard or admin dashboard
    const currentUrl = page.url();

    if (currentUrl.includes('/team-owner')) {
      console.log('📸 Capturing Team Owner Dashboard...');

      // Wait for the page to fully load - look for specific elements
      console.log('⏳ Waiting for dashboard content to load...');
      await page.waitForSelector('.text-4xl', { visible: true, timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 4000)); // Extra wait for API calls

      await page.screenshot({
        path: path.join(screenshotsDir, '02-team-owner-dashboard.png'),
        fullPage: true
      });

      // Find an auction to join
      console.log('🔍 Looking for active auctions...');

      // Wait a bit for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to click on "View Roster" button if available
      const viewRosterButton = await page.$('a[href*="/team-owner/team/"]');
      if (viewRosterButton) {
        console.log('📸 Capturing Team Roster Page...');
        const rosterUrl = await page.evaluate(el => el.href, viewRosterButton);
        await page.goto(rosterUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({
          path: path.join(screenshotsDir, '03-team-roster.png'),
          fullPage: true
        });
        // Go back to dashboard
        await page.goto('http://localhost:3000/team-owner/dashboard', { waitUntil: 'networkidle0', timeout: 30000 });
      }

      // Try to find and capture bidding page
      const joinBiddingButton = await page.$('a[href*="/auction/"][href*="/bid"]');
      if (joinBiddingButton) {
        console.log('📸 Capturing Bidding Page...');
        const biddingUrl = await page.evaluate(el => el.href, joinBiddingButton);
        await page.goto(biddingUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for socket connection
        await page.screenshot({
          path: path.join(screenshotsDir, '04-bidding-page.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️  No "Join Bidding" button found - auction may not be active');
      }
    }

    // Take mobile screenshots
    console.log('📱 Capturing Mobile Screenshots...');
    await page.setViewport({ width: 375, height: 812 }); // iPhone X dimensions

    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({
      path: path.join(screenshotsDir, '05-login-mobile.png'),
      fullPage: true
    });

    // Login again for mobile
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.waitForSelector('#email', { visible: true, timeout: 5000 });
    await page.type('#email', 'owner1@dp.com');
    await page.type('#password', 'owner');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    if (page.url().includes('/team-owner')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({
        path: path.join(screenshotsDir, '06-dashboard-mobile.png'),
        fullPage: true
      });

      const joinBiddingButton = await page.$('a[href*="/auction/"][href*="/bid"]');
      if (joinBiddingButton) {
        const biddingUrl = await page.evaluate(el => el.href, joinBiddingButton);
        await page.goto(biddingUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.screenshot({
          path: path.join(screenshotsDir, '07-bidding-mobile.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️  No "Join Bidding" button found on mobile - auction may not be active');
      }
    }

    console.log('✅ Screenshots captured successfully!');
    console.log(`📁 Saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('❌ Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(console.error);
