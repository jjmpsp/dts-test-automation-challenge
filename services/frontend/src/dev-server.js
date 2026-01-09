const express = require("express");
const path = require("path");
const cors = require("cors");
const { createProxyMiddleware } = require('http-proxy-middleware');

const PORT = parseInt(process.env.PORT || "31010", 10);
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:41010";

const app = express();

// Enable CORS
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "..", "public")));

// Config endpoint for API base URL
app.get("/config.js", (req, res) => {
  res.type("application/javascript").send(`window.__CONFIG__ = { API_BASE_URL: "${API_BASE_URL}" };`);
});

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: API_BASE_URL,
  changeOrigin: true,
}));

app.use('/runs', createProxyMiddleware({
  target: API_BASE_URL,
  changeOrigin: true,
}));

app.use('/artifacts', createProxyMiddleware({
  target: API_BASE_URL,
  changeOrigin: true,
}));

app.listen(PORT, () => {
  console.log(`Frontend development server on ${PORT} (API=${API_BASE_URL})`);
  console.log("Changes to HTML/CSS/JS files will be reflected immediately!");
});

// For hot reload during development, you can use nodemon to restart this server
// Or use a file watcher to detect changes and reload the page