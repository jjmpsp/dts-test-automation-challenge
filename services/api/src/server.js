const express = require("express");
const cors = require("cors");
const { v4: uuid } = require("uuid");

const PORT = parseInt(process.env.PORT || "41010", 10);
const RUNNER_URL = process.env.RUNNER_URL || "http://runner:42010";
const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR || "/artifacts";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/artifacts", express.static(ARTIFACTS_DIR));

const scenarios = [
  {
    id: "s-basic-0001",
    type: "basic-login",
    title: "Basic login - validation + invalid creds + happy path",
    targetBaseUrl: "http://mock-app-basic:51010",
    tests: [
      "Basic - invalid credentials shows error",
      "Basic - empty fields show validation",
      "Basic - valid credentials logs in"
    ]
  },
  {
    id: "s-csrf-0001",
    type: "csrf-login",
    title: "CSRF login - requires token",
    targetBaseUrl: "http://mock-app-csrf:51011",
    tests: [
      "CSRF - missing token is rejected",
      "CSRF - invalid token is rejected",
      "CSRF - valid token allows login"
    ]
  },
  {
    id: "s-mfa-0001",
    type: "mfa-login",
    title: "MFA login - step 1 then OTP",
    targetBaseUrl: "http://mock-app-mfa:51012",
    tests: [
      "MFA - valid credentials then valid OTP succeeds",
      "MFA - invalid OTP fails",
      "MFA - expired OTP fails"
    ]
  },
  {
    id: "s-lockout-0001",
    type: "lockout-login",
    title: "Lockout login - locked after 3 failures",
    targetBaseUrl: "http://mock-app-lockout:51013",
    tests: [
      "Lockout - locks user after 3 failures",
      "Lockout - locked user cannot login with correct password",
      "Lockout - user can login after lockout window"
    ]
  },
  {
    id: "s-session-fixation-0001",
    type: "session-fixation",
    title: "Session Fixation - prevent session fixation attacks",
    targetBaseUrl: "http://mock-app-session-fixation:51014",
    tests: [
      "Session Fixation - prevents session fixation",
      "Session Fixation - generates new session ID after login"
    ]
  },
  {
    id: "s-password-policy-0001",
    type: "password-policy",
    title: "Password Policy - enforce strong passwords",
    targetBaseUrl: "http://mock-app-password-policy:51015",
    tests: [
      "Password Policy - rejects weak passwords",
      "Password Policy - accepts strong passwords",
      "Password Policy - enforces minimum length"
    ]
  },
  {
    id: "s-rate-limiting-0001",
    type: "rate-limiting",
    title: "Rate Limiting - prevent brute force attacks",
    targetBaseUrl: "http://mock-app-rate-limiting:51016",
    tests: [
      "Rate Limiting - blocks requests after threshold",
      "Rate Limiting - allows requests within threshold",
      "Rate Limiting - resets after timeout period"
    ]
  },
  {
    id: "s-account-enumeration-0001",
    type: "account-enumeration",
    title: "Account Enumeration - prevent username guessing",
    targetBaseUrl: "http://mock-app-account-enumeration:51017",
    tests: [
      "Account Enumeration - consistent error messages",
      "Account Enumeration - prevents timing attacks",
      "Account Enumeration - masks account existence"
    ]
  }
];

const runs = new Map();

function nowSec() { return Math.floor(Date.now() / 1000); }

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/api/scenarios", (req, res) => res.json({ scenarios }));

app.get("/runs", (req, res) => {
  const limit = Math.max(1, Math.min(500, parseInt(req.query.limit || "50", 10)));
  const list = Array.from(runs.values()).sort((a,b)=> (b.started_at||0)-(a.started_at||0)).slice(0, limit);
  res.json({ runs: list });
});

app.get("/runs/:id", (req, res) => {
  const r = runs.get(req.params.id);
  if (!r) return res.sendStatus(404);
  
  // Dynamically check for screenshots in the filesystem and add them to the response
  const fs = require("fs");
  const path = require("path");
  const runScreenshotsDir = path.join(ARTIFACTS_DIR, "runs", req.params.id, "screenshots");
  
  let screenshots = [];
  if (fs.existsSync(runScreenshotsDir)) {
    const files = fs.readdirSync(runScreenshotsDir).filter(f => f.toLowerCase().endsWith(".png"));
    screenshots = files.map(f => ({
      name: f,
      url: `/artifacts/runs/${req.params.id}/screenshots/${f}`
    }));
  }
  
  // Enhance the run object with dynamically discovered screenshots
  const runWithScreenshots = {
    ...r,
    artifacts: {
      ...(r.artifacts || {}),
      screenshots: screenshots.length > 0 ? screenshots : (r.artifacts?.screenshots || [])
    }
  };
  
  res.json(runWithScreenshots);
});

app.post("/runs", async (req, res) => {
  const scenario_id = (req.body && req.body.scenario_id) || "s-basic-0001";
  const scenario = scenarios.find(s => s.id === scenario_id);
  if (!scenario) return res.status(400).json({ error: "Unknown scenario_id" });

  const selectedTests = Array.isArray(req.body.tests) ? req.body.tests : null; // null => all
  const id = uuid();
  const run = {
    id,
    scenario_id,
    status: "queued",
    started_at: nowSec(),
    finished_at: null,
    selected_tests: selectedTests,
    details: {
      steps: [],
      tests: [],
      meta: {
        requested_at: new Date().toISOString(),
        targetBaseUrl: scenario.targetBaseUrl
      }
    }
  };
  runs.set(id, run);

  fetch(RUNNER_URL + "/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      run_id: id,
      scenario_id,
      base_url: scenario.targetBaseUrl,
      tests: selectedTests
    })
  }).catch(err => {
    const r = runs.get(id);
    if (r) {
      r.status = "fail";
      r.finished_at = nowSec();
      r.details.steps.push({ name: "Trigger runner", status: "fail", error: String(err) });
    }
  });

  res.json(run);
});

app.post("/runs/:id/update", (req, res) => {
  const r = runs.get(req.params.id);
  if (!r) return res.sendStatus(404);
  if (req.body.status) r.status = req.body.status;
  if (typeof req.body.finished_at === "number") r.finished_at = req.body.finished_at;
  if (req.body.details) r.details = Object.assign(r.details || {}, req.body.details);
  if (Array.isArray(req.body.steps)) r.details.steps.push(...req.body.steps);
  if (Array.isArray(req.body.tests)) {
    r.details.tests = req.body.tests;
    
    // Recalculate summary based on actual test results
    const pass = r.details.tests.filter(t => t.status === 'pass').length;
    const fail = r.details.tests.filter(t => t.status === 'fail').length;
    const total = r.details.tests.length;
    
    // Ensure meta exists and update summary
    r.details.meta = r.details.meta || {};
    r.details.meta.summary = {
      pass: pass,
      fail: fail,
      total: total
    };
  }
  if (req.body.artifacts) r.artifacts = req.body.artifacts;
  res.sendStatus(200);
});

app.post("/runs/:id/complete", (req, res) => {
  const r = runs.get(req.params.id);
  if (!r) return res.sendStatus(404);

  const body = req.body || {};
  r.status = body.status || r.status || "completed";
  r.finished_at = nowSec();
  
  if (body.details) {
    // Update details
    r.details = body.details;
    
    // Recalculate summary based on actual test results if tests are available
    if (r.details.tests && Array.isArray(r.details.tests)) {
      const pass = r.details.tests.filter(t => t.status === 'pass').length;
      const fail = r.details.tests.filter(t => t.status === 'fail').length;
      const total = r.details.tests.length;
      
      // Ensure meta exists and update summary
      r.details.meta = r.details.meta || {};
      r.details.meta.summary = {
        pass: pass,
        fail: fail,
        total: total
      };
    }
  }
  
  if (body.artifacts) r.artifacts = body.artifacts;
  res.sendStatus(200);
});

// Additional endpoint to delete all runs and their artifacts
app.delete("/runs", async (req, res) => {
  const runIds = Array.from(runs.keys());
  
  // Delete the run records from memory
  for (const id of runIds) {
    runs.delete(id);
  }
  
  // Attempt to delete associated artifacts from filesystem
  const fs = require("fs");
  const path = require("path");
  const artifactsDir = ARTIFACTS_DIR;
  
  let deletedCount = 0;
  let errorCount = 0;
  
  for (const id of runIds) {
    try {
      const runArtifactsDir = path.join(artifactsDir, "runs", id);
      if (fs.existsSync(runArtifactsDir)) {
        fs.rmSync(runArtifactsDir, { recursive: true, force: true });
        deletedCount++;
      }
    } catch (err) {
      console.error(`Failed to delete artifacts for run ${id}:`, err);
      errorCount++;
    }
  }
  
  res.json({
    message: `Deleted ${runIds.length} runs and attempted to clean up ${deletedCount} artifact directories (${errorCount} errors)`
  });
});

app.listen(PORT, () => console.log(`API listening on ${PORT}, runner: ${RUNNER_URL}`));
