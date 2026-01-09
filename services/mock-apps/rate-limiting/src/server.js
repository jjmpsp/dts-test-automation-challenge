const express = require("express");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");

const PORT = parseInt(process.env.PORT || "51016", 10);
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

// In-memory store for tracking attempts (for demo purposes)
const attempts = new Map();
const attemptTimes = new Map();
const WINDOW_MS = 60000; // 1 minute window
const MAX_ATTEMPTS = 5; // Max 5 attempts per window

function page(content) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Mock Rate Limiting Login</title></head>
  <body style="font-family:Arial;margin:20px;">
    <h1>Mock Rate Limiting Login</h1>
    <p style="color:#666;">This app demonstrates rate limiting. After ${MAX_ATTEMPTS} attempts in ${WINDOW_MS/1000} seconds, 
    further attempts will be blocked.</p>
    ${content}
  </body></html>`;
}

// Simple rate limiting logic (vulnerable implementation)
function trackAttempt(ip) {
  const now = Date.now();
  const ipAttempts = attempts.get(ip) || [];
  
  // Clean up old attempts
  const recentAttempts = ipAttempts.filter(time => now - time < WINDOW_MS);
  
  // Add current attempt
  recentAttempts.push(now);
 attempts.set(ip, recentAttempts);
  
  return recentAttempts.length;
}

function isRateLimited(ip) {
  return trackAttempt(ip) > MAX_ATTEMPTS;
}

app.get("/", (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Check if IP is rate limited
  if (isRateLimited(clientIp)) {
    return res.status(429).send(page(`<div data-testid="error">Too many attempts. Please try again later.</div>`));
  }
  
  res.send(page(`
    <form method="post">
      <label>Username <input name="username" /></label><br/><br/>
      <label>Password <input name="password" type="password" /></label><br/><br/>
      <button type="submit">Login</button>
    </form>
  `));
});

app.post("/", (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Check if IP is rate limited
  if (isRateLimited(clientIp)) {
    return res.status(429).send(page(`<div data-testid="error">Too many attempts. Please try again later.</div>`));
  }
  
  const u = (req.body.username || "").trim();
  const p = (req.body.password || "").trim();
  
  // Track the attempt
  trackAttempt(clientIp);
  
  if (!u || !p) {
    return res.status(400).send(page(`<div data-testid="error">Missing username or password</div><a href="/">Back</a>`));
  }
  
  // Simple authentication
  if (u === "user" && p === "pass") {
    // Reset attempts on successful login
    attempts.set(clientIp, []);
    return res.send(page(`<div data-testid="success">Logged in successfully</div>`));
  }
  
  // Failed login - rate limiting still applies
  return res.status(401).send(page(`<div data-testid="error">Invalid credentials</div><a href="/">Back</a>`));
});

// Endpoint to reset rate limiting for testing
app.get("/reset", (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  attempts.set(clientIp, []);
  res.send("Rate limit reset for your IP");
});

// Endpoint to check rate limit status
app.get("/status", (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  const count = trackAttempt(clientIp);
  res.json({
    ip: clientIp,
    attempts: count,
    remaining: MAX_ATTEMPTS - count,
    rateLimited: isRateLimited(clientIp)
  });
});

app.listen(PORT, () => console.log(`Mock rate limiting login on ${PORT}`));