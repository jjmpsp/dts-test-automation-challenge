const fs = require("fs");
const path = require("path");
const addContext = require("mochawesome/addContext");

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function safeName(name) {
  return String(name)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 180);
}

async function screenshotOnFailure(driver, test, runId, artifactsDir) {
  if (!driver) return null;
 const shotsDir = path.join(artifactsDir, "runs", runId, "screenshots");
  ensureDir(shotsDir);
  const filename = `${Date.now()}_${safeName(test.fullTitle())}.png`;
  const filepath = path.join(shotsDir, filename);
  const imgBase64 = await driver.takeScreenshot();
  fs.writeFileSync(filepath, imgBase64, "base64");

  addContext(test, { title: "Screenshot on failure", value: path.relative(process.cwd(), filepath) });
  return { name: filename, filepath, url: `/artifacts/runs/${runId}/screenshots/${filename}` };
}

async function screenshotOnTest(driver, test, runId, artifactsDir) {
  if (!driver) return null;
  const shotsDir = path.join(artifactsDir, "runs", runId, "screenshots");
  ensureDir(shotsDir);
  const filename = `${Date.now()}_${safeName(test.fullTitle())}_all.png`;
  const filepath = path.join(shotsDir, filename);
  const imgBase64 = await driver.takeScreenshot();
  fs.writeFileSync(filepath, imgBase64, "base64");

  addContext(test, { title: "Screenshot for test", value: path.relative(process.cwd(), filepath) });
  return { name: filename, filepath, url: `/artifacts/runs/${runId}/screenshots/${filename}` };
}

module.exports = { screenshotOnFailure, screenshotOnTest };
