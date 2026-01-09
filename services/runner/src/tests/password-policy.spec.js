const { expect } = require("chai");
const { By, until } = require("selenium-webdriver");
const { createDriver } = require("../framework/driverFactory");
const { screenshotOnFailure, screenshotOnTest } = require("../framework/hooks");

describe("Password Policy Login", function () {
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

  it("Password Policy - weak password rejected", async () => {
    await driver.get(baseUrl + "/");
    
    await driver.findElement(By.name("username")).sendKeys("testuser");
    await driver.findElement(By.name("password")).sendKeys("weak"); // Too short
    await driver.findElement(By.name("confirmPassword")).sendKeys("weak");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    const errorMsg = await error.getText();
    expect(errorMsg).to.contain("Password policy violations");
    expect(errorMsg).to.contain("too short");
  });

  it("Password Policy - password without uppercase rejected", async () => {
    await driver.get(baseUrl + "/");
    
    await driver.findElement(By.name("username")).sendKeys("testuser");
    await driver.findElement(By.name("password")).sendKeys("password123"); // No uppercase
    await driver.findElement(By.name("confirmPassword")).sendKeys("password123");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    const errorMsg = await error.getText();
    expect(errorMsg).to.contain("Password policy violations");
    expect(errorMsg).to.contain("no uppercase");
  });

  it("Password Policy - password without lowercase rejected", async () => {
    await driver.get(baseUrl + "/");
    
    await driver.findElement(By.name("username")).sendKeys("testuser");
    await driver.findElement(By.name("password")).sendKeys("PASSWORD123"); // No lowercase
    await driver.findElement(By.name("confirmPassword")).sendKeys("PASSWORD123");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    const errorMsg = await error.getText();
    expect(errorMsg).to.contain("Password policy violations");
    expect(errorMsg).to.contain("no lowercase");
  });

  it("Password Policy - password without digit rejected", async () => {
    await driver.get(baseUrl + "/");
    
    await driver.findElement(By.name("username")).sendKeys("testuser");
    await driver.findElement(By.name("password")).sendKeys("Password"); // No digit
    await driver.findElement(By.name("confirmPassword")).sendKeys("Password");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    const errorMsg = await error.getText();
    expect(errorMsg).to.contain("Password policy violations");
    expect(errorMsg).to.contain("no digit");
  });

  it("Password Policy - strong password accepted", async () => {
    await driver.get(baseUrl + "/");
    
    await driver.findElement(By.name("username")).sendKeys("testuser");
    await driver.findElement(By.name("password")).sendKeys("Password123");
    await driver.findElement(By.name("confirmPassword")).sendKeys("Password123");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    const success = await driver.wait(until.elementLocated(By.css("[data-testid='success']")), 5000);
    expect((await success.getText()).trim()).to.contain("Registration successful");
  });

  it("Password Policy - mismatched passwords rejected", async () => {
    await driver.get(baseUrl + "/");
    
    await driver.findElement(By.name("username")).sendKeys("testuser");
    await driver.findElement(By.name("password")).sendKeys("Password123");
    await driver.findElement(By.name("confirmPassword")).sendKeys("Different123");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    
    const error = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    expect((await error.getText()).trim()).to.contain("Passwords do not match");
  });
});