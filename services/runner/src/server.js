const express = require("express");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));
const logger = require("./logger");
const runner = require("./runMocha");

const PORT = parseInt(process.env.PORT || "42010", 10);
const API_BASE_URL = process.env.API_BASE_URL || "http://api:41010";
const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR || "/artifacts";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/execute", async (req, res) => {
  const { run_id, scenario_id, base_url, tests } = req.body || {};
  if (!run_id || !scenario_id || !base_url) return res.status(400).json({ error: "run_id, scenario_id, base_url required" });
  res.json({ accepted: true, run_id });

  await fetch(`${API_BASE_URL}/runs/${run_id}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "running", steps: [{ name: "Runner accepted job", status: "pass" }] })
  }).catch(()=>{});

  (async () => {
    try {
      process.env.RUN_ID = run_id;
      process.env.SCENARIO_ID = scenario_id;
      process.env.BASE_URL = base_url;
      process.env.ARTIFACTS_DIR = ARTIFACTS_DIR;
      process.env.SELECTED_TESTS = tests ? JSON.stringify(tests) : "";

      const result = await runner.run();

      await fetch(`${API_BASE_URL}/runs/${run_id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: result.status,
          details: {
            steps: [],
            tests: result.tests,
            meta: { scenario_id, base_url, summary: result.summary }
          },
          artifacts: {
            reportPath: result.reportPath,
            reportUrl: result.reportUrl,
            screenshots: result.screenshots
          }
        })
      }).catch(err => logger.error("Failed to report completion: " + err));
    } catch (e) {
      logger.error("Run failed: " + e);
      await fetch(`${API_BASE_URL}/runs/${run_id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "fail",
          details: { steps: [{ name: "Runner exception", status: "fail", error: String(e) }], tests: [], meta: { scenario_id, base_url } }
        })
      }).catch(()=>{});
    }
  })();
});

app.listen(PORT, () => logger.info(`Runner listening on ${PORT}`));
