require('dotenv').config();
const path = require('path');
const {
  fetchAndLogResults,
} = require('./utils');

const apiBasePath = path.join(__dirname, './api');
const resultsFiles = {
    mega: `${apiBasePath}/megamillionsResults.json`,
    powerball: `${apiBasePath}/powerballResults.json`
};
const dataFiles = {
    mega: `${apiBasePath}/megamillion.json`,
    powerball: `${apiBasePath}/powerball.json`
};
const pickedNumbers = {
    mega: require(`${apiBasePath}/myMegaPickedNumbers`),
    powerball: require(`${apiBasePath}/myPowerPickedNumbers`)
};

async function processLotteryResults() {
  try {
      await Promise.all([
          fetchAndLogResults(
              "MEGAMILLION",
              resultsFiles.mega,
              process.env.API_MEGA_URL,
              process.env.API_MEGA_HOST,
              dataFiles.mega,
              pickedNumbers.mega
          ),
          fetchAndLogResults(
              "POWERBALL",
              resultsFiles.powerball,
              process.env.API_POWER_URL,
              process.env.API_POWER_HOST,
              dataFiles.powerball,
              pickedNumbers.powerball
          )
      ]);
  } catch (error) {
      console.error("An error occurred:", error);
  }
}

processLotteryResults();
