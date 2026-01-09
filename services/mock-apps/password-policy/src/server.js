const express = require("express");
const bodyParser = require("body-parser");

const PORT = parseInt(process.env.PORT || "51015", 10);
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

function page(content) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Mock Password Policy Login</title></head>
  <body style="font-family:Arial;margin:20px;">
    <h1>Mock Password Policy Login</h1>
    <p style="color:#666;">This app enforces weak password policies. 
    Try passwords that meet different criteria to see how the policy works.</p>
    ${content}
  </body></html>`;
}

// Weak password policy implementation (for testing purposes)
function validatePassword(password) {
  const errors = [];
  
  // These checks represent a weak policy (for demonstration)
  if (password.length < 6) errors.push("too short");
  if (!/[A-Z]/.test(password)) errors.push("no uppercase");
  if (!/[a-z]/.test(password)) errors.push("no lowercase");
  if (!/\d/.test(password)) errors.push("no digit");
  
  return errors;
}

function isValidPassword(password) {
  const errors = validatePassword(password);
  return errors.length === 0;
}

app.get("/", (req, res) => {
  res.send(page(`
    <form method="post">
      <label>Username <input name="username" /></label><br/><br/>
      <label>Password <input name="password" type="password" /></label><br/><br/>
      <label>Confirm Password <input name="confirmPassword" type="password" /></label><br/><br/>
      <button type="submit">Register</button>
    </form>
    <br/>
    <p><strong>Password Policy:</strong></p>
    <ul>
      <li>At least 6 characters long</li>
      <li>Contains uppercase letter</li>
      <li>Contains lowercase letter</li>
      <li>Contains a digit</li>
    </ul>
  `));
});

app.post("/", (req, res) => {
  const u = (req.body.username || "").trim();
  const p = (req.body.password || "").trim();
  const cp = (req.body.confirmPassword || "").trim();

  if (!u) return res.status(400).send(page(`<div data-testid="error">Username required</div><a href="/">Back</a>`));
  if (!p) return res.status(400).send(page(`<div data-testid="error">Password required</div><a href="/">Back</a>`));
  if (p !== cp) return res.status(400).send(page(`<div data-testid="error">Passwords do not match</div><a href="/">Back</a>`));

  // Validate password against policy
  const validationErrors = validatePassword(p);
  if (validationErrors.length > 0) {
    return res.status(400).send(page(`<div data-testid="error">Password policy violations: ${validationErrors.join(", ")}</div><a href="/">Back</a>`));
  }

  // Simulate registration/login
  if (isValidPassword(p)) {
    return res.send(page(`<div data-testid="success">Registration successful with strong password</div>`));
  } else {
    return res.send(page(`<div data-testid="success">Registration successful</div>`));
  }
});

app.get("/login", (req, res) => {
  res.send(page(`
    <form method="post" action="/login">
      <label>Username <input name="username" /></label><br/><br/>
      <label>Password <input name="password" type="password" /></label><br/><br/>
      <button type="submit">Login</button>
    </form>
  `));
});

app.post("/login", (req, res) => {
  const u = (req.body.username || "").trim();
  const p = (req.body.password || "").trim();

  if (!u || !p) return res.status(400).send(page(`<div data-testid="error">Username and password required</div><a href="/login">Back</a>`));

  // Simple authentication for demo
  if (u === "admin" && p === "Password123") {
    return res.send(page(`<div data-testid="success">Logged in as admin</div>`));
  } else {
    return res.status(401).send(page(`<div data-testid="error">Invalid credentials</div><a href="/login">Back</a>`));
  }
});

app.listen(PORT, () => console.log(`Mock password policy login on ${PORT}`));