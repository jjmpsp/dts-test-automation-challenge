const { expect } = require("chai");
const { By, until } = require("selenium-webdriver");
const { createDriver } = require("../framework/driverFactory");
const { screenshotOnFailure, screenshotOnTest } = require("../framework/hooks");

describe("Basic Login", function () {
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

  it("Basic - invalid credentials shows error", async () => {
    await driver.get(baseUrl + "/");
    await driver.wait(until.elementLocated(By.name("username")), 10000);
    await driver.findElement(By.name("username")).sendKeys("baduser");
    await driver.findElement(By.name("password")).sendKeys("badpass");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    const err = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    expect((await err.getText()).trim()).to.contain("Invalid");
  });

  it("Basic - empty fields show validation", async () => {
    await driver.get(baseUrl + "/");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    const err = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    expect((await err.getText()).trim()).to.contain("Missing");
  });

  it("Basic - valid credentials logs in", async () => {
    await driver.get(baseUrl + "/");
    await driver.findElement(By.name("username")).sendKeys("user");
    await driver.findElement(By.name("password")).sendKeys("pass");
    await driver.findElement(By.css("button[type='submit'],button")).click();
    const ok = await driver.wait(until.elementLocated(By.css("[data-testid='success']")), 5000);
    expect((await ok.getText()).trim()).to.contain("Logged in");
  });
});
