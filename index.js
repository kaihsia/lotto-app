require('dotenv').config();
const path = require('path');
const {
  verifyArrayLengths,
  findMatchingArrays,
  findDuplicatesInArray,
  fetchDataAndProcess,
  createApiOptions
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

function logResults(description, dataArray, pickedNumbers) {
    console.log(description);
    console.log('Is it accurate?', verifyArrayLengths(dataArray));
    console.log('Any matches?', findMatchingArrays(dataArray, pickedNumbers));
    console.log('Any duplicates?', findDuplicatesInArray(dataArray));
    console.log('Number of picks:', dataArray.length);
}

async function processLotteryResults() {
    try {
        const [megaArray, powerballArray] = await Promise.all([
            fetchDataAndProcess(
              resultsFiles.mega,
              createApiOptions(
                process.env.API_MEGA_URL,
                process.env.API_MEGA_HOST
              ),
              dataFiles.mega
            ),
            fetchDataAndProcess(
              resultsFiles.powerball,
              createApiOptions(
                process.env.API_POWER_URL,
                process.env.API_POWER_HOST
              ),
              dataFiles.powerball
            )
        ]);

        logResults("MEGAMILLION", megaArray, pickedNumbers.mega);
        logResults("POWERBALL", powerballArray, pickedNumbers.powerball);
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

processLotteryResults();
