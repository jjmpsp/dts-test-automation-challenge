const { expect } = require("chai");
const { By, until } = require("selenium-webdriver");
const { createDriver } = require("../framework/driverFactory");
const { screenshotOnFailure, screenshotOnTest } = require("../framework/hooks");

describe("Account Enumeration Login", function () {
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

  it("Account Enumeration - non-existent user reveals account doesn't exist", async () => {
    await driver.get(baseUrl + "/");
    
    await driver.findElement(By.name("username")).sendKeys("nonexistent");
    await driver.findElement(By.name("password")).sendKeys("any");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    const errorMsg = await error.getText();
    expect(errorMsg).to.contain("User does not exist");
  });

  it("Account Enumeration - existing user with wrong password reveals account exists", async () => {
    await driver.get(baseUrl + "/");
    
    await driver.findElement(By.name("username")).sendKeys("admin");
    await driver.findElement(By.name("password")).sendKeys("wrongpassword");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    const errorMsg = await error.getText();
    expect(errorMsg).to.contain("Invalid password for existing user");
    // This message reveals that the user exists
  });

  it("Account Enumeration - existing user with correct password logs in", async () => {
    await driver.get(baseUrl + "/");
    
    await driver.findElement(By.name("username")).sendKeys("admin");
    await driver.findElement(By.name("password")).sendKeys("password123");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    const success = await driver.wait(until.elementLocated(By.css("[data-testid='success']")), 5000);
    expect((await success.getText()).trim()).to.contain("Logged in");
  });

  it("Account Enumeration - password reset reveals account existence", async () => {
    // Test with non-existent email
    await driver.get(baseUrl + "/forgot-password");
    await driver.findElement(By.name("email")).sendKeys("nonexistent@example.com");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    const errorMsg = await error.getText();
    expect(errorMsg).to.contain("No account found for nonexistent@example.com");
    
    // Go back and test with existing email
    await driver.get(baseUrl + "/forgot-password");
    await driver.findElement(By.name("email")).sendKeys("admin@example.com");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    const success = await driver.wait(until.elementLocated(By.css("[data-testid='success']")), 5000);
    const successMsg = await success.getText();
    expect(successMsg).to.contain("Password reset email sent to admin@example.com");
    // This confirms the account exists
  });

  it("Account Enumeration - can enumerate known users", async () => {
    // Test each known user to confirm they exist
    const knownUsers = ["admin", "user", "test", "demo"];
    
    for (const user of knownUsers) {
      await driver.get(baseUrl + "/");
      await driver.findElement(By.name("username")).sendKeys(user);
      await driver.findElement(By.name("password")).sendKeys("wrong");
      await driver.findElement(By.css("button[type='submit'],button")).click();
      
      const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
      const errorMsg = await error.getText();
      
      // Should get "Invalid password for existing user" for all known users
      expect(errorMsg).to.contain("Invalid password for existing user");
    }
 });
});