const fs = require('fs');
const axios = require('axios');

async function fetchAPI(filePath, options) {
    try {
        const response = await axios.request(options);
        const { data } = response.data;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        const { response, request, message } = error;
        if (error.response) {
            console.error('Response Error:', response.status);
            console.error('Response Data:', response.data);
        } else if (request) {
            console.error('No Response Received:', request);
        } else {
            console.error('Request Error:', message);
        }
    }
}

function transformArray(inputArray) {
    return inputArray.map(obj => {
        const { DrawingDate, FirstNumber, SecondNumber, ThirdNumber, FourthNumber, FifthNumber, PowerBall, MegaBall } = obj;
        
        const date = new Date(DrawingDate);
        const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}-${date.getFullYear()}`;
        const numbers = [FirstNumber, SecondNumber, ThirdNumber, FourthNumber, FifthNumber, PowerBall || MegaBall];

        return { date: formattedDate, numbers };
    });
}

function verifyArrayLengths(nestedArrays) {
    return nestedArrays.every(obj => obj.numbers.length === 6);
}

function findMatchingArrays(arrayA, arrayB) {
    const matches = [];

    arrayA.forEach(a => {
        arrayB.forEach(b => {
            if (a.numbers.length === b.length && a.numbers.every((value, index) => value === b[index])) {
                matches.push(a.numbers);
            }
        });
    });

    return matches;
}

function findDuplicatesInArray(arrays) {
    const uniqueElements = new Map();
    const duplicates = [];

    arrays.forEach(obj => {
        const key = JSON.stringify(obj.numbers);
        if (uniqueElements.has(key)) {
            const existingObj = uniqueElements.get(key);
            if (!existingObj.hasOwnProperty('firstOccurrence')) {
                existingObj.firstOccurrence = { ...existingObj };
                existingObj.allOccurrences = [existingObj.firstOccurrence];
            }
            existingObj.allOccurrences.push({ ...obj });
        } else {
            uniqueElements.set(key, { ...obj });
        }
    });

    uniqueElements.forEach(obj => {
        if (obj.hasOwnProperty('firstOccurrence')) {
            duplicates.push(...obj.allOccurrences);
        }
    });

    return duplicates;
}

function transformAndWriteToJson(inputFilePath, outputFilePath) {
    try {
      const inputData = fs.readFileSync(inputFilePath, 'utf8');
      const inputArray = JSON.parse(inputData);
      const transformedInputArray = transformArray(inputArray);
  
      let outputArray = [];
      
      if (fs.existsSync(outputFilePath)) {
        const outputData = fs.readFileSync(outputFilePath, 'utf8'); 
        outputArray = JSON.parse(outputData);
      }
  
      if (JSON.stringify(transformedInputArray) !== JSON.stringify(outputArray)) {
        let jsonString = '[' + transformedInputArray.map(obj => {
            let numbersString = `"numbers": [ ${obj.numbers.join(', ')} ]`;
            return `{\n  "date": "${obj.date}",\n  ${numbersString}\n}`;
        }).join(',\n') + ']';

        fs.writeFileSync(outputFilePath, jsonString);
        console.log(`Transformed data written to ${outputFilePath} successfully`);
      } else {
        console.log(`Transformed data has not changed. No need to write ${outputFilePath}`);
      }
    } catch (error) {
      console.error('Error writing data:', error);
    }
}
  
function readArrayFromFile(filePath) {
    try {
      const jsonData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('JSON Reading Error:', error);
      return [];
    }
}

function createApiOptions (url, host) {
    return {
        method: 'GET',
        url,
        headers: {
          'X-RapidAPI-Key': process.env.API_KEY,
          'X-RapidAPI-Host': host
        }
    }
}

function logResults(description, dataArray, pickedNumbers, randomNumbers) {
    const isAccurate = verifyArrayLengths(dataArray);
    const matches = findMatchingArrays(dataArray, pickedNumbers);
    const duplicates = findDuplicatesInArray(dataArray);
    const numberOfPicks = dataArray.length;
    const { date, numbers } = dataArray[0] // Latest drawing

    console.log('==========================================================');
    console.log(description);
    console.log(`Most recent drawing on ${date}: ${numbers}`);
    console.log(`Is it accurate? ${isAccurate}`);
    console.log(`Any matches? ${JSON.stringify(matches)}`);
    console.log(`Any duplicates? ${duplicates.map(d => `${d.date}: [${d.numbers.join(', ')}]`).join(' , ')}`);
    console.log(`Number of picks: ${numberOfPicks}`);
    console.log(`Random pick: ${JSON.stringify(randomNumbers)}`);
    console.log('==========================================================');
}

async function fetchAndLogResults(name, resultsFile, apiUrl, apiHost, dataFile, pickedNumbers) {
    try {
        const apiOptions = createApiOptions(apiUrl, apiHost);
        await fetchAPI(resultsFile, apiOptions);
        await transformAndWriteToJson(resultsFile, dataFile);
        const resultArray = readArrayFromFile(dataFile);
        const randomNumbers = generateBothLotteryGames(name, resultArray);
        logResults(name, resultArray, pickedNumbers, randomNumbers);
    } catch (error) {
        console.error(`Error processing ${name}:`, error);
    }
}

function isNumberSetUnique(newNumbers, previousDraws, isPowerNumber = false) {
    if (isPowerNumber) {
        return !previousDraws.some(draw => 
            draw.numbers[5] === newNumbers[5]
        );
    }
    
    const newSet = [...newNumbers.slice(0, 5)].sort().join(',');
    return !previousDraws.some(draw => {
        const prevSet = [...draw.numbers.slice(0, 5)].sort().join(',');
        return prevSet === newSet;
    });
}

function generateUniqueRandomNumbers(game, previousDraws) {
    const games = {
        POWERBALL: [69, 26],
        MEGAMILLION: [70, 25]
    }
    const mainCount = 5;
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (attempts < maxAttempts) {
        const numbers = Array.from({ length: games[game][0] }, (_, i) => i + 1);
        
        for (let i = 0; i < mainCount; i++) {
            const j = Math.floor(Math.random() * (games[game][0] - i)) + i;
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        const powerNumber = Math.floor(Math.random() * games[game][1]) + 1;
        const generatedNumbers = [...numbers.slice(0, mainCount), powerNumber];
        
        if (isNumberSetUnique(generatedNumbers, previousDraws)) {
            const sortedFirstFive = generatedNumbers.slice(0, 5).sort((a, b) => a - b);
            return [...sortedFirstFive, generatedNumbers[5]];;
        }
        
        attempts++;
    }
    
    throw new Error('Maxed out attempted to generate numbers');
}

function generateBothLotteryGames(game,previousDraws = []) {
    if (!Array.isArray(previousDraws)) {
        throw new Error('previousDraws is not an array');
    }

    return generateUniqueRandomNumbers(game, previousDraws);
}

module.exports = {
    fetchAndLogResults,
}
