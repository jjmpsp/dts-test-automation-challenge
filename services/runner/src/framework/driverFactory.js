const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

function buildChromeOptions(headless) {
  const options = new chrome.Options();
  options.addArguments("--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--window-size=1280,800");
  if (headless) options.addArguments("--headless=new");
  return options;
}

async function createDriver({ headless = true } = {}) {
  return new Builder().forBrowser("chrome").setChromeOptions(buildChromeOptions(headless)).build();
}

module.exports = { createDriver };
