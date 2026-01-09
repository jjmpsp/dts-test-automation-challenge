const express = require("express");
const path = require("path");

const PORT = parseInt(process.env.PORT || "31010", 10);
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:41010";

const app = express();
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/config.js", (req, res) => {
  res.type("application/javascript").send(`window.__CONFIG__ = { API_BASE_URL: "${API_BASE_URL}" };`);
});

app.listen(PORT, () => console.log(`Frontend on ${PORT} (API=${API_BASE_URL})`));
