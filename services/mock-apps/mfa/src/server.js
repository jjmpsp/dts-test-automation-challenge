const express = require("express");
const bodyParser = require("body-parser");

const PORT = parseInt(process.env.PORT || "51012", 10);
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

let lastAuth = null;

function page(content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MFA Authentication</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    select {
      width: 100%;
      padding: 14px;
      border: 2px solid #e1e5e9;
      border-radius: 10px;
      font-size: 16px;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
      background: #f8f9fa;
    }
    
    input[type="text"]:focus,
    input[type="password"]:focus,
    select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      background: white;
    }
    
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
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
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
    
    .back-link:hover {
      text-decoration: underline;
    }
    
    .step-indicator {
      text-align: center;
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 10px;
      font-weight: 500;
      color: #666;
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
      <h1>MFA Authentication</h1>
    </div>
    ${content}
  </div>
</body>
</html>`;
}

app.get("/", (req, res) => {
  lastAuth = null;
  res.send(page(`
    <form method="post" action="/step1">
      <div class="form-group">
        <label for="otpMode">Test Mode</label>
        <select id="otpMode" name="otpMode">
          <option value="normal">Normal OTP</option>
          <option value="expired">Expired OTP</option>
        </select>
      </div>
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" placeholder="Enter your username" required />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Enter your password" required />
      </div>
      <button type="submit">Continue to MFA</button>
    </form>
  `));
});

app.post("/step1", (req, res) => {
  const u = (req.body.username || "").trim();
  const p = (req.body.password || "").trim();
  const otpMode = (req.body.otpMode || "normal").trim();

  if (!u || !p) return res.status(400).send(page(`<div data-testid="error" class="error">Missing username or password</div><a href="/" class="back-link">Back to Login</a>`));
  if (u !== "user" || p !== "pass") return res.status(401).send(page(`<div data-testid="error" class="error">Invalid credentials</div><a href="/" class="back-link">Back to Login</a>`));

  lastAuth = { otpMode };
  res.send(page(`
    <div class="step-indicator">Step 1 Complete - Enter OTP</div>
    <form method="post" action="/step2">
      <div class="form-group">
        <label for="otp">One-Time Password</label>
        <input type="text" id="otp" name="otp" placeholder="Enter your 6-digit code" maxlength="6" required />
      </div>
      <button type="submit">Verify OTP</button>
    </form>
  `));
});

app.post("/step2", (req, res) => {
  const otp = (req.body.otp || "").trim();
  if (!lastAuth) return res.status(400).send(page(`<div data-testid="error" class="error">No active MFA session</div><a href="/" class="back-link">Back to Login</a>`));

  if (lastAuth.otpMode === "expired") return res.status(401).send(page(`<div data-testid="error" class="error">OTP expired</div><a href="/" class="back-link">Back to Login</a>`));
  if (otp !== "123456") return res.status(401).send(page(`<div data-testid="error" class="error">Invalid OTP</div><a href="/" class="back-link">Back to Login</a>`));

  return res.send(page(`<div data-testid="success" class="success">MFA authentication complete!</div>`));
});

app.listen(PORT, () => console.log(`Mock MFA login on ${PORT}`));
