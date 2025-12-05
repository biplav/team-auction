const puppeteer = require('puppeteer');
const path = require('path');

async function captureMobileScreenshots() {
  console.log('📱 Starting mobile screenshot capture...');

  const screenshotsDir = path.join(__dirname, '..', 'screenshots');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set mobile viewport (iPhone X)
    await page.setViewport({ width: 375, height: 812 });

    // Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle0' });
    await page.type('#email', 'owner1@dp.com');
    await page.type('#password', 'owner');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Capture mobile dashboard
    console.log('📸 Capturing Mobile Dashboard...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({
      path: path.join(screenshotsDir, '06-dashboard-mobile.png'),
      fullPage: true
    });

    // Find and navigate to bidding page
    const joinBiddingButton = await page.$('a[href*="/auction/"][href*="/bid"]');
    if (joinBiddingButton) {
      console.log('📸 Capturing Mobile Bidding Page...');
      const biddingUrl = await page.evaluate(el => el.href, joinBiddingButton);
      await page.goto(biddingUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for socket
      await page.screenshot({
        path: path.join(screenshotsDir, '07-bidding-mobile.png'),
        fullPage: true
      });
      console.log('✅ Mobile bidding screenshot captured!');
    } else {
      console.log('⚠️  No active auction found for mobile bidding screenshot');
    }

    console.log('\n✅ Mobile screenshots captured successfully!');
    console.log(`📁 Saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('❌ Error capturing mobile screenshots:', error);
  } finally {
    await browser.close();
  }
}

captureMobileScreenshots().catch(console.error);
