const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BASE_URL = "https://3d-weather-dashboard.netlify.app";

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const rootDir = process.cwd();
  const tmpDir = path.join(rootDir, "tmp-frames");
  const screenshotsDir = path.join(rootDir, "screenshots");

  ensureDir(tmpDir);
  ensureDir(screenshotsDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: tmpDir,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await wait(2000);

  const cityInput = page.locator("#cityInput");
  await cityInput.fill("Phoenix");
  await page.keyboard.press("Enter");
  await wait(2500);

  await cityInput.fill("London");
  await page.keyboard.press("Enter");
  await wait(2500);

  await page.locator("#unitToggle").click();
  await wait(1200);

  await page.locator("#themeToggle").click();
  await wait(1200);

  await page.locator("#themeToggle").click();
  await wait(1200);

  await context.close();
  await browser.close();

  const videoFile = fs
    .readdirSync(tmpDir)
    .find((file) => file.endsWith(".webm"));

  if (!videoFile) {
    throw new Error("No video was generated.");
  }

  const inputVideo = path.join(tmpDir, videoFile);
  const outputGif = path.join(screenshotsDir, "demo.gif");

  execSync(
    `ffmpeg -y -i "${inputVideo}" -vf "fps=10,scale=1000:-1:flags=lanczos" "${outputGif}"`,
    { stdio: "inherit" }
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log("GIF created:", outputGif);
}

main().catch((error) => {
  console.error("Failed to generate GIF:", error);
  process.exit(1);
});