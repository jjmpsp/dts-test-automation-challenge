const { expect } = require("chai");
const { By, until } = require("selenium-webdriver");
const { createDriver } = require("../framework/driverFactory");
const { screenshotOnFailure, screenshotOnTest } = require("../framework/hooks");

describe("Session Fixation Login", function () {
  this.timeout(60000);

  let driver;
  const baseUrl = process.env.BASE_URL;
  const headless = (process.env.HEADLESS || "true").toLowerCase() === "true";
  const runId = process.env.RUN_ID;
  const artifactsDir = process.env.ARTIFACTS_DIR || "/artifacts";

  beforeEach(async () => { driver = await createDriver({ headless }); });

  afterEach(async function () {
    try {
      if (this.currentTest && this.currentTest.state === "failed") {
        await screenshotOnFailure(driver, this.currentTest, runId, artifactsDir);
      }
      await screenshotOnTest(driver, this.currentTest, runId, artifactsDir);
    } finally {
      if (driver) await driver.quit();
    }
  });

  it("Session Fixation - session ID preserved after login", async () => {
    // Visit the login page and capture the session ID before login
    await driver.get(baseUrl + "/");
    const initialSessionInput = await driver.findElement(By.name("sessionId"));
    const initialSessionId = await initialSessionInput.getAttribute("value");
    
    // Perform login with valid credentials
    await driver.findElement(By.name("username")).sendKeys("user");
    await driver.findElement(By.name("password")).sendKeys("pass");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    // Verify login was successful
    const success = await driver.wait(until.elementLocated(By.css("[data-testid='success']")), 5000);
    expect((await success.getText()).trim()).to.contain("Logged in");
    
    // Navigate to dashboard and verify session ID is still the same
    await driver.get(baseUrl + "/dashboard");
    const dashboardSuccess = await driver.wait(until.elementLocated(By.css("[data-testid='success']")), 5000);
    expect((await dashboardSuccess.getText()).trim()).to.contain("Dashboard");
    
    // The session fixation vulnerability means the session ID is preserved
    // This is the behavior we're testing for - the same session ID should persist
    await driver.get(baseUrl + "/");
    const postLoginSessionInput = await driver.findElement(By.name("sessionId"));
    const postLoginSessionId = await postLoginSessionInput.getAttribute("value");
    
    // Verify that the session ID remained the same after login (vulnerability)
    expect(postLoginSessionId).to.equal(initialSessionId);
  });

  it("Session Fixation - session ID preserved after logout", async () => {
    // Login first
    await driver.get(baseUrl + "/");
    await driver.findElement(By.name("username")).sendKeys("user");
    await driver.findElement(By.name("password")).sendKeys("pass");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    // Verify login success
    const success = await driver.wait(until.elementLocated(By.css("[data-testid='success']")), 500);
    expect((await success.getText()).trim()).to.contain("Logged in");
    
    // Get the session ID after login
    const sessionAfterLogin = await driver.findElement(By.name("sessionId"));
    const sessionIdAfterLogin = await sessionAfterLogin.getAttribute("value");
    
    // Logout
    await driver.get(baseUrl + "/logout");
    
    // Go back to login page and check if session ID is still the same
    await driver.get(baseUrl + "/");
    const sessionAfterLogout = await driver.findElement(By.name("sessionId"));
    const sessionIdAfterLogout = await sessionAfterLogout.getAttribute("value");
    
    // Session fixation vulnerability: session ID is not regenerated on logout
    expect(sessionIdAfterLogout).to.equal(sessionIdAfterLogin);
  });

  it("Session Fixation - invalid credentials preserves session ID", async () => {
    // Get initial session ID
    await driver.get(baseUrl + "/");
    const initialSessionInput = await driver.findElement(By.name("sessionId"));
    const initialSessionId = await initialSessionInput.getAttribute("value");
    
    // Attempt login with invalid credentials
    await driver.findElement(By.name("username")).sendKeys("invalid");
    await driver.findElement(By.name("password")).sendKeys("wrong");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    // Verify login failed
    const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    expect((await error.getText()).trim()).to.contain("Invalid");
    
    // Go back to login and check session ID
    await driver.get(baseUrl + "/");
    const afterFailedLoginSession = await driver.findElement(By.name("sessionId"));
    const afterFailedLoginSessionId = await afterFailedLoginSession.getAttribute("value");
    
    // Session fixation vulnerability: session ID is preserved even after failed login
    expect(afterFailedLoginSessionId).to.equal(initialSessionId);
  });
});