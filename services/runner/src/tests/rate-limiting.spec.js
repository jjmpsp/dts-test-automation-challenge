const { expect } = require("chai");
const { By, until } = require("selenium-webdriver");
const { createDriver } = require("../framework/driverFactory");
const { screenshotOnFailure, screenshotOnTest } = require("../framework/hooks");

describe("Rate Limiting Login", function () {
  this.timeout(6000);

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

  it("Rate Limiting - too many failed attempts triggers rate limit", async () => {
    // First, reset rate limiting for this IP
    await driver.get(baseUrl + "/reset");
    
    // Perform 6 failed login attempts to trigger rate limiting
    for (let i = 0; i < 6; i++) {
      await driver.get(baseUrl + "/");
      await driver.findElement(By.name("username")).sendKeys("invalid");
      await driver.findElement(By.name("password")).sendKeys("wrong");
      await driver.findElement(By.css("button[type='submit'],button")).click();
      
      // Check for error message on each attempt
      const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
      expect((await error.getText()).trim()).to.contain("Invalid");
    }
    
    // The 7th attempt should trigger rate limiting
    await driver.get(baseUrl + "/");
    const rateLimitError = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    expect((await rateLimitError.getText()).trim()).to.contain("Too many attempts");
  });

  it("Rate Limiting - valid credentials bypass rate limit after reset", async () => {
    // First, trigger rate limiting with failed attempts
    for (let i = 0; i < 6; i++) {
      await driver.get(baseUrl + "/");
      await driver.findElement(By.name("username")).sendKeys("invalid");
      await driver.findElement(By.name("password")).sendKeys("wrong");
      await driver.findElement(By.css("button[type='submit'],button")).click();
      
      if (i < 5) { // Don't wait for error on the last attempt as it should trigger rate limit
        const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
        expect((await error.getText()).trim()).to.contain("Invalid");
      }
    }
    
    // Now reset rate limiting
    await driver.get(baseUrl + "/reset");
    
    // Try to login with valid credentials after reset
    await driver.get(baseUrl + "/");
    await driver.findElement(By.name("username")).sendKeys("user");
    await driver.findElement(By.name("password")).sendKeys("pass");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    // Should succeed after reset
    const success = await driver.wait(until.elementLocated(By.css("[data-testid='success']")), 5000);
    expect((await success.getText()).trim()).to.contain("Logged in");
  });

  it("Rate Limiting - rate limit persists across page visits", async () => {
    // First, reset rate limiting
    await driver.get(baseUrl + "/reset");
    
    // Perform 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await driver.get(baseUrl + "/");
      await driver.findElement(By.name("username")).sendKeys("invalid");
      await driver.findElement(By.name("password")).sendKeys("wrong");
      await driver.findElement(By.css("button[type='submit'],button")).click();
      
      const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
      expect((await error.getText()).trim()).to.contain("Invalid");
    }
    
    // Visit the page again and try one more attempt
    await driver.get(baseUrl + "/");
    await driver.findElement(By.name("username")).sendKeys("invalid");
    await driver.findElement(By.name("password")).sendKeys("wrong");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    // Should now be rate limited
    const rateLimitError = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    expect((await rateLimitError.getText()).trim()).to.contain("Too many attempts");
  });
});