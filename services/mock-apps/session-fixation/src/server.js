const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const PORT = parseInt(process.env.PORT || "51014", 10);
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Store session tokens to simulate session management
const validSessions = new Set();
const userCredentials = { username: "user", password: "pass" };

function page(content) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Mock Session Fixation Login</title></head>
  <body style="font-family:Arial;margin:20px;">
    <h1>Mock Session Fixation Login</h1>
    <p style="color:#666;">This app demonstrates session fixation vulnerability. 
    The session ID is preserved across login/logout, allowing attackers to fixate sessions.</p>
    ${content}
  </body></html>`;
}

// Generate a new session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

app.get("/", (req, res) => {
  // Check if there's already a session cookie
  let sessionId = req.cookies.sessionId;
  
  // If no session exists, create one (this is the vulnerability - should not happen before login)
  if (!sessionId) {
    sessionId = generateSessionId();
    res.cookie("sessionId", sessionId, { httpOnly: true });
  }

  res.send(page(`
    <form method="post">
      <input type="hidden" name="sessionId" value="${sessionId}" />
      <label>Username <input name="username" /></label><br/><br/>
      <label>Password <input name="password" type="password" /></label><br/><br/>
      <button type="submit">Login</button>
    </form>
  `));
});

app.post("/", (req, res) => {
  const u = (req.body.username || "").trim();
  const p = (req.body.password || "").trim();
  const sessionId = req.body.sessionId;

  if (!u || !p) {
    return res.status(400).send(page(`<div data-testid="error">Missing username or password</div><a href="/">Back</a>`));
  }

  if (u === userCredentials.username && p === userCredentials.password) {
    // Vulnerability: We're using the same session ID provided by the form
    // This allows session fixation attacks
    validSessions.add(sessionId);
    res.cookie("sessionId", sessionId, { httpOnly: true });
    return res.send(page(`<div data-testid="success">Logged in with session ID: ${sessionId}</div><a href="/dashboard">Go to Dashboard</a>`));
  }

  // Even on failure, we keep the same session ID (vulnerability)
 res.cookie("sessionId", sessionId, { httpOnly: true });
  return res.status(401).send(page(`<div data-testid="error">Invalid credentials</div><a href="/">Back</a>`));
});

app.get("/dashboard", (req, res) => {
  const sessionId = req.cookies.sessionId;
  
  if (!sessionId || !validSessions.has(sessionId)) {
    return res.redirect("/");
  }
  
  res.send(page(`
    <div data-testid="success">Dashboard - Secure Content</div>
    <p>Welcome to your dashboard!</p>
    <a href="/logout">Logout</a>
  `));
});

app.get("/logout", (req, res) => {
  const sessionId = req.cookies.sessionId;
  
  if (sessionId) {
    validSessions.delete(sessionId);
  }
  
  // Vulnerability: We don't regenerate the session ID on logout
  // The same session ID remains in the cookie
  res.send(page(`
    <div data-testid="success">Logged out</div>
    <a href="/">Back to Login</a>
  `));
});

app.listen(PORT, () => console.log(`Mock session fixation login on ${PORT}`));