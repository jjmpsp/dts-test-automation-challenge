const express = require("express");
const bodyParser = require("body-parser");

const PORT = parseInt(process.env.PORT || "51017", 10);
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

// Known users for enumeration testing
const knownUsers = ["admin", "user", "test", "demo"];
const validCredentials = { username: "admin", password: "password123" };

function page(content) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Mock Account Enumeration Login</title></head>
  <body style="font-family:Arial;margin:20px;">
    <h1>Mock Account Enumeration Login</h1>
    <p style="color:#666;">This app demonstrates account enumeration vulnerability. 
    Different error messages reveal whether a username exists.</p>
    ${content}
  </body></html>`;
}

app.get("/", (req, res) => {
  res.send(page(`
    <form method="post">
      <label>Username <input name="username" /></label><br/><br/>
      <label>Password <input name="password" type="password" /></label><br/><br/>
      <button type="submit">Login</button>
    </form>
  `));
});

app.post("/", (req, res) => {
  const u = (req.body.username || "").trim();
  const p = (req.body.password || "").trim();

  if (!u || !p) {
    return res.status(400).send(page(`<div data-testid="error">Missing username or password</div><a href="/">Back</a>`));
 }

  // Vulnerability: Different error messages based on whether user exists
  if (!knownUsers.includes(u)) {
    // User doesn't exist
    return res.status(401).send(page(`<div data-testid="error">User does not exist</div><a href="/">Back</a>`));
  }
  
  // User exists but password is wrong
  if (u === validCredentials.username && p === validCredentials.password) {
    return res.send(page(`<div data-testid="success">Logged in successfully</div>`));
 } else {
    // User exists but wrong password
    return res.status(401).send(page(`<div data-testid="error">Invalid password for existing user</div><a href="/">Back</a>`));
 }
});

// Additional endpoint for password reset to demonstrate another enumeration vector
app.get("/forgot-password", (req, res) => {
  res.send(page(`
    <form method="post" action="/forgot-password">
      <label>Email <input name="email" /></label><br/><br/>
      <button type="submit">Reset Password</button>
    </form>
  `));
});

app.post("/forgot-password", (req, res) => {
  const email = (req.body.email || "").trim();
  
  if (!email) {
    return res.status(400).send(page(`<div data-testid="error">Email required</div><a href="/forgot-password">Back</a>`));
  }
  
  // Vulnerability: Different responses based on whether email exists
  const userExists = knownUsers.some(user => email === `${user}@example.com`);
  
  if (userExists) {
    // Email exists - send reset email (vulnerable: confirms account exists)
    return res.send(page(`<div data-testid="success">Password reset email sent to ${email}</div>`));
 } else {
    // Email doesn't exist - don't send email (vulnerable: reveals account doesn't exist)
    return res.send(page(`<div data-testid="error">No account found for ${email}</div><a href="/forgot-password">Back</a>`));
  }
});

app.listen(PORT, () => console.log(`Mock account enumeration login on ${PORT}`));