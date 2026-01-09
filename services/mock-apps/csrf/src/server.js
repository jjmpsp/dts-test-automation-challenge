const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const PORT = parseInt(process.env.PORT || "51011", 10);
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

function genToken() { return crypto.randomBytes(12).toString("hex"); }

function page(content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CSRF Protected Login</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    body {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .login-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
      padding: 40px;
      width: 100%;
      max-width: 450px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .login-header h1 {
      color: #333;
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .login-header p {
      color: #666;
      font-size: 14px;
      background: #e8f4f8;
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid #11998e;
      margin-top: 10px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
      font-size: 14px;
    }
    
    input[type="text"],
    input[type="password"],
    input[type="hidden"] {
      width: 100%;
      padding: 14px;
      border: 2px solid #e1e5e9;
      border-radius: 10px;
      font-size: 16px;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
      background: #f8f9fa;
    }
    
    input[type="text"]:focus,
    input[type="password"]:focus {
      outline: none;
      border-color: #1998e;
      box-shadow: 0 0 0 3px rgba(17, 153, 142, 0.1);
      background: white;
    }
    
    .checkbox-group {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .checkbox-group input[type="checkbox"] {
      margin-right: 10px;
      width: auto;
    }
    
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(17, 153, 142, 0.4);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    .error {
      background: #fee;
      color: #e74c3c;
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid #e74c3c;
      margin-bottom: 20px;
      font-size: 14px;
    }
    
    .success {
      background: #efe;
      color: #27ae60;
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid #27ae60;
      margin-bottom: 20px;
      font-size: 14px;
      text-align: center;
    }
    
    .back-link {
      display: block;
      text-align: center;
      margin-top: 20px;
      color: #11998e;
      text-decoration: none;
      font-weight: 500;
    }
    
    .back-link:hover {
      text-decoration: underline;
    }
    
    @media (max-width: 480px) {
      .login-container {
        padding: 30px 20px;
      }
      
      .login-header h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-header">
      <h1>CSRF Protected Login</h1>
      <p>Security token required for authentication</p>
    </div>
    ${content}
  </div>
</body>
</html>`;
}

app.get("/", (req, res) => {
  const token = genToken();
  res.send(page(`
    <form method="post">
      <input type="hidden" name="serverToken" value="${token}" />
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" placeholder="Enter your username" required />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Enter your password" required />
      </div>
      <div class="form-group">
        <label for="token">Security Token</label>
        <input type="text" id="token" name="token" value="${token}" readonly />
      </div>
      <div class="checkbox-group">
        <input type="checkbox" id="skipToken" name="skipToken" />
        <label for="skipToken">Submit without security token (for testing)</label>
      </div>
      <button type="submit">Secure Login</button>
    </form>
  `));
});

app.post("/", (req, res) => {
  const u = (req.body.username || "").trim();
  const p = (req.body.password || "").trim();
  const serverToken = (req.body.serverToken || "").trim();
  let token = (req.body.token || "").trim();
  if (req.body.skipToken) token = "";

  if (!u || !p) return res.status(400).send(page(`<div data-testid="error">Missing username or password</div><a href="/">Back</a>`));
  if (u !== "user" || p !== "pass") return res.status(401).send(page(`<div data-testid="error">Invalid credentials</div><a href="/">Back</a>`));

  if (!token) return res.status(403).send(page(`<div data-testid="error">CSRF token missing</div><a href="/">Back</a>`));
  if (token !== serverToken) return res.status(403).send(page(`<div data-testid="error">Invalid token</div><a href="/">Back</a>`));

  return res.send(page(`<div data-testid="success">Logged in</div>`));
});

app.listen(PORT, () => console.log(`Mock CSRF login on ${PORT}`));
