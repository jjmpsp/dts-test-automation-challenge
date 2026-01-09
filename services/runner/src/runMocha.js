const fs = require("fs");
const path = require("path");
const Mocha = require("mocha");
const logger = require("./logger");
const scenarioMap = require("./scenarios");

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function escapeRegex(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function flattenMochawesomeTests(obj) {
  const tests = [];
  function walkSuite(s) {
    for (const t of (s.tests || [])) {
      // Determine status based on mochawesome report structure
      let status = "unknown";
      if (t.pass) status = "pass";
      else if (t.fail) status = "fail";
      else if (t.pending) status = "pending";
      else if (t.state === "passed") status = "pass";
      else if (t.state === "failed") status = "fail";
      else if (t.state === "pending") status = "pending";
      else status = t.state || "unknown";

      tests.push({
        title: t.fullTitle || t.title,
        status: status,
        duration_ms: t.duration || 0,
        err: t.err && (t.err.message || t.err.estack) ? (t.err.message || t.err.estack) : null
      });
    }
    for (const child of (s.suites || [])) walkSuite(child);
  }
  try {
    const root = obj.results && obj.results[0] && obj.results[0].suites;
    if (root) walkSuite(root);
  } catch (e) {
    logger.error("Error processing mochawesome tests: " + e);
  }
  return tests;
}

async function run() {
  const runId = process.env.RUN_ID;
  const scenarioId = process.env.SCENARIO_ID;
  const baseUrl = process.env.BASE_URL;
  const artifactsDir = process.env.ARTIFACTS_DIR || "/artifacts";
  const selectedTestsJson = process.env.SELECTED_TESTS || "";
  const selectedTests = selectedTestsJson ? JSON.parse(selectedTestsJson) : null;

  const reportDir = path.join(artifactsDir, "runs", runId, "mochawesome-report");
  ensureDir(reportDir);

  const mocha = new Mocha({
    timeout: 60000,
    reporter: "mochawesome",
    reporterOptions: { reportDir, reportFilename: "index", html: true, json: true, overwrite: true }
  });

  const files = scenarioMap[scenarioId] || [];
  if (files.length === 0) throw new Error("Unknown scenario id in runner: " + scenarioId);
  files.forEach(f => mocha.addFile(path.join(process.cwd(), f)));

  if (Array.isArray(selectedTests) && selectedTests.length) {
    const re = selectedTests.map(escapeRegex).join("|");
    mocha.grep(new RegExp(re));
  }

  logger.info(`Running scenario=${scenarioId} baseUrl=${baseUrl} runId=${runId} selected=${selectedTests ? selectedTests.length : "ALL"}`);

  const result = await new Promise((resolve) => mocha.run((failures) => resolve({ failures })));

  const jsonPath = path.join(reportDir, "index.json");
  const reportPath = path.join(reportDir, "index.html");

  let jsonObj = null;
  try { jsonObj = JSON.parse(fs.readFileSync(jsonPath, "utf-8")); }
  catch (e) { logger.error("Failed to read mochawesome json: " + e); }

  const tests = jsonObj ? flattenMochawesomeTests(jsonObj) : [];
  const pass = tests.filter(t => t.status === "pass").length;
  const fail = tests.filter(t => t.status === "fail").length;

  const shotsDir = path.join(artifactsDir, "runs", runId, "screenshots");
  let shots = [];
  if (fs.existsSync(shotsDir)) {
    shots = fs.readdirSync(shotsDir).filter(f => f.toLowerCase().endsWith(".png")).map(f => ({
      name: f,
      filepath: path.join(shotsDir, f),
      url: `/artifacts/runs/${runId}/screenshots/${f}`
    }));
  }

  return {
    status: result.failures > 0 ? "fail" : "pass",
    reportPath,
    reportUrl: `/artifacts/runs/${runId}/mochawesome-report/index.html`,
    tests,
    summary: { pass, fail, total: tests.length },
    screenshots: shots
  };
}

module.exports = { run };
