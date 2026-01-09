const { expect } = require("chai");
const { By, until } = require("selenium-webdriver");
const { createDriver } = require("../framework/driverFactory");
const { screenshotOnFailure, screenshotOnTest } = require("../framework/hooks");

describe("CSRF Login", function () {
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

  it("CSRF - missing token is rejected", async () => {
    await driver.get(baseUrl + "/");
    await driver.findElement(By.name("username")).sendKeys("user");
    await driver.findElement(By.name("password")).sendKeys("pass");
    await driver.findElement(By.name("skipToken")).click();
    await driver.findElement(By.css("button")).click();
    const err = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    expect((await err.getText()).trim()).to.contain("CSRF");
  });

  it("CSRF - invalid token is rejected", async () => {
    await driver.get(baseUrl + "/");
    await driver.findElement(By.name("username")).sendKeys("user");
    await driver.findElement(By.name("password")).sendKeys("pass");
    await driver.findElement(By.name("token")).clear();
    await driver.findElement(By.name("token")).sendKeys("invalid-token");
    await driver.findElement(By.css("button")).click();
    const err = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    expect((await err.getText()).trim()).to.contain("Invalid token");
  });

  it("CSRF - valid token allows login", async () => {
    await driver.get(baseUrl + "/");
    await driver.findElement(By.name("username")).sendKeys("user");
    await driver.findElement(By.name("password")).sendKeys("pass");
    await driver.findElement(By.css("button")).click();
    const ok = await driver.wait(until.elementLocated(By.css("[data-testid='success']")), 5000);
    expect((await ok.getText()).trim()).to.contain("Logged in");
  });
});
