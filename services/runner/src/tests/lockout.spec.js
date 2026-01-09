const { expect } = require("chai");
const { By, until } = require("selenium-webdriver");
const { createDriver } = require("../framework/driverFactory");
const { screenshotOnFailure, screenshotOnTest } = require("../framework/hooks");

describe("Lockout Login", function () {
  this.timeout(90000);

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

  it("Lockout - locks user after 3 failures", async () => {
    await driver.get(baseUrl + "/test/reset");
    await driver.get(baseUrl + "/");

    for (let i = 0; i < 3; i++) {
      await driver.findElement(By.name("username")).clear();
      await driver.findElement(By.name("password")).clear();
      await driver.findElement(By.name("username")).sendKeys("user");
      await driver.findElement(By.name("password")).sendKeys("wrong");
      await driver.findElement(By.css("button")).click();
      await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
      await driver.get(baseUrl + "/");
    }

    await driver.findElement(By.name("username")).sendKeys("user");
    await driver.findElement(By.name("password")).sendKeys("pass");
    await driver.findElement(By.css("button")).click();
    const err = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    expect((await err.getText()).trim()).to.contain("locked");
  });

  it("Lockout - locked user cannot login with correct password", async () => {
    await driver.get(baseUrl + "/test/lock");
    await driver.get(baseUrl + "/");
    await driver.findElement(By.name("username")).sendKeys("user");
    await driver.findElement(By.name("password")).sendKeys("pass");
    await driver.findElement(By.css("button")).click();
    const err = await driver.wait(until.elementLocated(By.css("[data-testid='error']")), 5000);
    expect((await err.getText()).trim()).to.contain("locked");
  });

  it("Lockout - user can login after lockout window", async () => {
    await driver.get(baseUrl + "/test/unlock");
    await driver.get(baseUrl + "/");
    await driver.findElement(By.name("username")).sendKeys("user");
    await driver.findElement(By.name("password")).sendKeys("pass");
    await driver.findElement(By.css("button")).click();
    const ok = await driver.wait(until.elementLocated(By.css("[data-testid='success']")), 5000);
    expect((await ok.getText()).trim()).to.contain("Logged in");
  });
});
