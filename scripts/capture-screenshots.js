const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://3d-weather-dashboard.netlify.app";

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const screenshotDir = path.join(process.cwd(), "screenshots");
  ensureDir(screenshotDir);

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1024 },
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await wait(2500);

  await page.screenshot({
    path: path.join(screenshotDir, "home.png"),
    fullPage: true,
  });

  const cityInput = page.locator("#cityInput");
  await cityInput.fill("Phoenix");
  await page.keyboard.press("Enter");
  await wait(3000);

  await page.screenshot({
    path: path.join(screenshotDir, "forecast.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await wait(2500);

  await page.screenshot({
    path: path.join(screenshotDir, "mobile.png"),
    fullPage: true,
  });

  await browser.close();
}

capture().catch((error) => {
  console.error("Screenshot generation failed:", error);
  process.exit(1);
});