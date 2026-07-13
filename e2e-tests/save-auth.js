const { chromium } = require('@playwright/test');

(async () => {
  console.log("🚀 Launching browser for manual Google Login...");
  
  // Open a visible browser so you can interact with it
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to your frontend login page
  await page.goto('http://localhost:5173/login');
  
  console.log("======================================================");
  console.log("👉 PLEASE LOG IN WITH GOOGLE MANUALLY IN THE BROWSER");
  console.log("======================================================");
  console.log("Waiting for you to log in (you have 2 minutes)...");
  
  try {
    // Wait for the URL to change to the dashboard (or home) after successful login
    // Adjust '**/dashboard' if your app redirects somewhere else after login
    await page.waitForURL('**/', { timeout: 120000 }); 
    
    console.log("✅ Login successful! Saving authentication state...");
    
    // This saves your cookies and localStorage (including the eco_token)
    await context.storageState({ path: 'resident-auth.json' });
    
    console.log("✅ State saved to resident-auth.json!");
  } catch (error) {
    console.log("❌ Timed out waiting for login. Please try again.");
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
})();
