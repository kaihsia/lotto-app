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
            if (!uniqueElements.get(key).hasOwnProperty('firstOccurrence')) {
                uniqueElements.get(key).firstOccurrence = uniqueElements.get(key);
                uniqueElements.get(key).allOccurrences = [uniqueElements.get(key).firstOccurrence];
            }
            uniqueElements.get(key).allOccurrences.push(obj);
        } else {
            uniqueElements.set(key, obj);
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

async function fetchDataAndProcess(filePath, options, outputFilePath) {
    try {
      await fetchAPI(filePath, options);
      await transformAndWriteToJson(filePath, outputFilePath);
      return readArrayFromFile(outputFilePath);
    } catch (error) {
      console.error("Error:", filePath, error);
      throw error;
    }
}

module.exports = {
    transformAndWriteToJson,
    verifyArrayLengths,
    findMatchingArrays,
    findDuplicatesInArray,
    fetchAPI,
    readArrayFromFile,
    createApiOptions,
    fetchDataAndProcess,
}