const catalog = require('./catalog.js');
const logger = require('./logger.js')(catalog.LOG_PREFIX.UTILS);
const { v5: uuidv5, v4: uuidv4 } = require('uuid');
const Decimal = require('decimal.js');
const fs = require('fs');
const { exception } = require('console');
const moment = require('moment');

module.exports.headerDelimeter = '***************************************';
module.exports.subHeaderDelimeter = '-------';

/**
 * It calculates the deviation percentage given between two numbers
 * @param {number} number1 number 1
 * @param {number} number2 number 2
 * @returns deviation between number1 and number2 expressed in percentage format
 */
module.exports.calculateDeviationPct = (number1, number2) => {
  let result =
    number1 > number2
      ? new Decimal(number2).mul(100).div(number1).minus(100).abs()
      : new Decimal(number1).mul(100).div(number2).minus(100).abs();
  return result.toNumber();
};

/**
 * It unwinds a Json Object.
 * It is like the oposite operation of grouping a Json Object.
 * @param {json} inputJson json to unwind
 * @param {string} unwindKeyName json key from which carry out the unwind operation
 * @returns unwinded object
 */
module.exports.unwindJsonObject = (inputJson, unwindKeyName) => {
  let result = [];
  let unwindedObject, nestedObjects;
  Object.keys(inputJson).forEach(function (key) {
    unwindedObject = {};
    unwindedObject[unwindKeyName] = key;
    nestedObjects = Array.isArray(inputJson[key])
      ? inputJson[key]
      : [inputJson[key]];
    nestedObjects.forEach((nestedObject) => {
      result.push(Object.assign({ ...unwindedObject }, nestedObject));
    });
  });
  return result;
};

/**
 * It translates a string datetime to a date string
 * @param {string} format string moment format
 * @returns date string
 */
String.prototype.formatDate = function (format) {
  if (!exports.isValidDate(this)) {
    throw new Error('Error formating date: Invalid Date: ' + this);
  }
  return moment(new Date(this).toISOString()).format(
    format ? format : catalog.DEFAULT_DATE_FORMAT
  );
};

/**
 * It merges recursivelly all the arrays in one
 * @param {array} array2 to merge with
 * @returns merged array
 */
Array.prototype.merge = function (array2) {
  let mergedArray2 = array2 ? array2.merge() : [];
  let result = [].concat.apply(mergedArray2, this);
  result =
    result.filter((item) => Array.isArray(item)).length > 0
      ? result.merge()
      : result;
  return result;
};
/**
 * It sums all the array items
 */
Array.prototype.plus = function () {
  let result = new Decimal(0);
  this.forEach((item) => {
    item = item instanceof Decimal ? item : new Decimal(item);
    result = result.plus(item);
  });
  return result;
};

/**
 * It retrieves the last item, and preserves the item within the array
 * @returns last item
 */
Array.prototype.last = function () {
  return this[this.length - 1];
};
/**
 * It waits the milliseconds given by argument.
 * @param {integer} ms milliseconds
 * @returns promise
 */
module.exports.sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * It translates all the json object's elements which are instance of 'Decimals' to 'Numbers'
 * @param {JsonWebKey} object json object to be translated
 * @return translated object
 */
module.exports.translateJsonDecimalsToNumbers = (object) => {
  Object.keys(object).forEach((key) => {
    if (object[key] instanceof Decimal) {
      object[key] = Number(object[key].valueOf());
    }
  });
  return object;
};

/**
 * It translates all the json object's elements which are instance of 'Number' to 'Decimal'
 * @param {JsonWebKey} object json object to be translated
 * @return translated object
 */
module.exports.translateJsonNumbersToDecimals = (object) => {
  Object.keys(object).forEach((key) => {
    if (exports.isNumeric(object[key])) {
      object[key] = new Decimal(object[key]);
    }
  });
  return object;
};

/**
 * It prints a header delimiter with a title.
 * @param {string} title
 */
module.exports.printHeader = (title) => {
  logger.info('\n' + title, '\n' + this.headerDelimeter);
};

/**
 * It encodes the given string into base64.
 * @param {string} data string to encode
 * @returns encoded string
 */
module.exports.base64 = (data) => {
  return Buffer.from(data).toString('base64');
};

/**
 * It decodes a base64 string.
 * @param {string} encodedData base64 string
 * @returns decoded string
 */
module.exports.decodeBase64 = (encodedData) => {
  return Buffer.from(encodedData, 'base64').toString('ascii');
};

/**
 * It translates the value to an Array if the given value is not yet an array.
 * @param {string} value value
 * @returns the given value as an Array
 */
module.exports.toArray = (value) => {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

/**
 * It verifies if the given array has duplicates
 * @param {array} array list to check
 * @returns true if it has duplicates
 */
module.exports.checkForDuplicates = (array) => {
  return Array.isArray(array) && new Set(array).size !== array.length;
};

/**
 * It evaluates if the given sting date is a valid date
 * @return true if it is a valid date
 */
module.exports.isValidDate = (inputDate) => {
  let date = 'Invalid Date';
  if (inputDate instanceof Date) {
    date = inputDate;
  } else if (inputDate) {
    date = inputDate.toString().split('-');
    let year = date[0];
    let month = date[1];
    let day = date[2].includes('T')
      ? date[2].split('T')[0]
      : date[2].split(' ')[0];
    date =
      year.length != 4 || month.length != 2 || day.length != 2
        ? 'Invalid Date'
        : new Date(inputDate);
  }
  return date == 'Invalid Date' ? false : true;
};

/**
 * it compares two dates
 * @param {string} dateStrA date A
 * @param {string} dateStrB date B
 * @param {string} operand the operands can be: "eq", "ge", "gt", "le", "lt", "ne"
 */
module.exports.compareStringDates = (dateStrA, dateStrB, operator) => {
  if (!exports.isValidDate(dateStrA) || !exports.isValidDate(dateStrB)) {
    let errorMessage = `Error comparing dates: Invalid Date. dateStrA: ${dateStrA}, dateStrB: ${dateStrB}`;
    throw new Error(errorMessage);
  }

  switch (operator) {
    case 'eq':
      return dateStrA == dateStrB;
    case 'ge':
      return dateStrA >= dateStrB;
    case 'gt':
      return dateStrA > dateStrB;
    case 'le':
      return dateStrA <= dateStrB;
    case 'lt':
      return dateStrA < dateStrB;
    case 'ne':
      return dateStrA != dateStrB;
    default:
      throw new Error('Invalid date operand');
  }
};

/**
 * It deletes all the empty strings within an array.
 * @param {array} data array of strings
 * @return array without empty strings
 */
module.exports.removeArrayEmptyStrings = (data) => {
  data.forEach((item, i) => {
    data[i] = item.trim().length === 0 ? item.trim() : item;
  });
  return Array.isArray(data)
    ? data.filter((i) => [''].indexOf(i) === -1)
    : data;
};
/**
 * It deletes all the duplications within an array.
 * @param {array} dataArray array of data
 * @param {boolean} exclusionKeys object keys to exclude for the comparison
 * @return array without duplicates
 */
module.exports.removeArrayDuplicatedItems = (dataArray, exclusionKeys) => {
  let result = [];
  let sourceArrayStringified = [];
  let sourceArray = dataArray.clone();
  sourceArray.removeObjectsFileds(exclusionKeys);
  sourceArray.forEach((element) =>
    sourceArrayStringified.push(JSON.stringify(element))
  );
  sourceArrayStringified = sourceArrayStringified.filter(
    (v, i) => sourceArrayStringified.indexOf(v) === i
  );
  sourceArrayStringified.forEach((element) => result.push(JSON.parse(element)));
  return result;
};

/**
 * It iterates the current array to delete from its listed object the given fields by key
 * @param {array} fieldKeysToRemove fields keys to be removed from the objects
 */
Array.prototype.removeObjectsFileds = function (fieldKeysToRemove) {
  fieldKeysToRemove = exports.toArray(fieldKeysToRemove);
  this.forEach((element) => {
    fieldKeysToRemove.forEach((fieldKey) => {
      delete element[fieldKey];
    });
  });
};

/**
 * It removes from the given array all the undefined or null elements
 * @param {array} data input array
 * @returns filtered array
 */
module.exports.removeArrayUndefinedItems = (data) => {
  return data.filter((uuid) => uuid);
};

/**
 * It retrieves the differences between two arrays
 * @param {*} arr1 array 1
 * @param {*} arr2 array 2
 * @returns array with the differences
 */
module.exports.getArrayDiferences = (arr1, arr2) => {
  return arr1.filter((x) => !arr2.includes(x));
};

/**
 * It retrieves the intersection between two arrays
 * @param {*} arr1 array 1
 * @param {*} arr2 array 2
 * @returns array with the intersected elements
 */
module.exports.getArrayInterseciton = (arr1, arr2) => {
  return arr1.filter((x) => arr2.includes(x));
};

/**
 * It creates a copy of a JSON Object.
 * @param {json} object json object
 * @returns a new json object
 */
module.exports.cloneJsonObject = (object) => {
  return JSON.parse(JSON.stringify(object));
};

/**
 * It retrieves the JSON Key from its value.
 * @param {*} value JSON value
 * @returns JSON key
 */
module.exports.getJsonObjectKey = (object, value) => {
  return Object.keys(object).find((key) => object[key] === value);
};

/**
 * It translates a json objcet to a string escaping the double quotes.
 * @param {json} data json object
 * @returns json string representation
 */
module.exports.stringify = (data) => {
  let result = JSON.stringify(data, null, '');
  result = JSON.stringify(result);
  return result;
};

/**
 * It evaluates if the given data is a JSON value of type String.
 * Basically it evaluates if the given string is between double quotes.
 * @param {string} data source data to evaluate
 * @returns true if it represents a JSON String
 */
module.exports.isJsonString = (data) => {
  return data.toString().match('"(.*?)"') ? true : false;
};

/**
 * It evaluates if the given data is a JSON Object of any kind (Object or Array).
 * @param {json} data source data to evaluate
 * @returns true if it represents a JSON Object
 */
module.exports.isJsonObject = (data) => {
  return data && typeof data === 'object';
};

/**
 * It evaluates if the given data is a JSON Object of the type Array.
 * @param {json} data source data to evaluate
 * @returns true if it represents a JSON Array
 */
module.exports.isJsonArray = (data) => {
  return this.isJsonObject(data) && Array.isArray(data);
};

/**
 * It evaluates if the given data is a JSON Array formed by a set of primitive values,
 * that is, numbers or strings.
 * @param {json} data source data to evaluate
 * @returns true if the condition is satisfied
 */
module.exports.isJsonPrimitivesArray = (data) => {
  return (
    this.isJsonArray(data) &&
    data.every((e) => this.isJsonString(e) || !isNaN(data))
  );
};

/**
 * It evaluates if the given data is a JSON Array formed by a set of JSON Objects.
 * @param {json} data source data to evaluate
 * @returns true if the condition is satisfied
 */
module.exports.isJsonObjectsArray = (data) => {
  return this.isJsonArray(data) && data.some((item) => this.isJsonObject(item));
};

/**
 * It evaluates if the given data is an empty JSON. That is, an object or array with
 * no elements.
 * @param {json} json source data to evaluate
 * @returns true if the condition is satisfied
 */
module.exports.isEmptyJson = (json) => {
  let isAnEmptyObject = Object.keys(json).length === 0;
  return this.isAnEmptyArray(json) || isAnEmptyObject;
};

/**
 * It evaluates if the given object is an empty array or not.
 * @param {*} json array
 * @returns true if the given object is an empty array.
 */
module.exports.isAnEmptyArray = (json) => {
  return Array.isArray(json) && json.length === 0;
};

/**
 * It evaluates if the given nested key is defined within the provided json data.
 * @param {json} json json data
 * @param {*} jsonNestedKey nested key as string separated by dots
 * @returns true if the given nested key is defined within the json data
 */
module.exports.isJsonNestedKeyDefined = (json, jsonNestedKey) => {
  let nestedValue = { ...json };
  try {
    jsonNestedKey.split('.').forEach((element) => {
      nestedValue = nestedValue[element];
    });
    return nestedValue;
  } catch (error) {
    return undefined;
  }
};

/**
 * It appends all the JSON Elements present within the 'b' JSON into the 'a' JSON
 * @param {json} a json in which to append 'b' elements
 * @param {json} b json elements to be appended
 */
module.exports.appendJsonElements = (a, b) => {
  Object.entries(b).forEach(([key, value]) => {
    a[key] = value;
  });
};

/**
 * It trims leading and trailing whitespaces.
 * @param {json} json input json
 * @returns trimed json
 */
module.exports.trimJsonWhitespaces = (json) => {
  let result;
  if (json && this.isJsonObject(json)) {
    result = JSON.stringify(json).replace(/"\s+|\s+"/g, '"');
  } else if (json) {
    result = json.replace(/"\s+|\s+"/g, '"');
  }
  return result ? JSON.parse(result) : json;
};

/**
 * It looks up the words given by argument within the provided dictionary.
 * @param {json} jsonDictionary json object that represents a key-value dictionary
 * @param {*} words single word or a set of words that represent the second-level key in the dictionary
 * @param {string} key string that represents the first-level key in the dictionary
 * @returns the dictionary value if the words where found in the dicitonary
 */
module.exports.lookupWords = (jsonDictionary, words, key) => {
  let search = '';
  let resultArray = [];
  let resultValue = '';
  if (words) {
    if (Array.isArray(words) && Array.isArray(jsonDictionary[key])) {
      words.forEach((word) => {
        search = jsonDictionary[key][0][word];
        resultValue = search ? search : word;
        resultArray.push(resultValue);
      });
      return resultArray;
    } else if (Array.isArray(words)) {
      words.forEach((word) => {
        search = jsonDictionary[word];
        resultValue = search ? search : word;
        resultArray.push(resultValue);
      });
      return resultArray;
    } else if (Array.isArray(jsonDictionary[key])) {
      resultValue = jsonDictionary[key][0][words];
      return resultValue ? resultValue : words;
    } else {
      search = jsonDictionary[words];
      return search ? search : words;
    }
  }
};

/**
 * It replaces of all occurences in a string with the given replacement.
 * @param {string} string source data
 * @param {string} search string to search for replacement
 * @param {string} replace string to replace for each occurence
 * @returns resultant string after the replacement operation
 */
module.exports.replaceAll = (string, search, replace) => {
  return string.split(search).join(replace);
};

/**
 * It removes all characters which matches with the given string.
 * @param {string} sourceStr source string to evaluate
 * @param {string} search string to find and remove from the source string
 * @returns resultant string after the deletion operation
 */
module.exports.removeAllCharacters = (sourceStr, search) => {
  if (Array.isArray(search)) {
    search.forEach((s) => {
      sourceStr = this.replaceAll(sourceStr, s, '');
    });
    return sourceStr;
  }
  return this.replaceAll(sourceStr, search, '');
};

/**
 * It translates all the elements of an array to float.
 * @param {array} array set of elements
 * @returns an array formed by a set of elements of type float
 */
module.exports.parseFloat = (array) => {
  let result = [];
  array.forEach((s) => {
    result.push(parseFloat(s));
  });
  return result;
};

/**
 * It evaluates if the given string is empty.
 * @param {string} value data to evaluate
 * @returns true if the value is empty
 */
module.exports.isEmpty = (value) => {
  return (
    value == undefined ||
    value == null ||
    (typeof value === 'string' && value.length === 0)
  );
};

/**
 * It evaluates if the given string is not empty.
 * @param {*} value data to evaluate
 * @returns true if the value is not empty
 */
module.exports.isNotEmpty = (value) => {
  return !this.isEmpty(value);
};

/**
 * It evaluates if the given value is not null
 * @param {*} value data to evaluate
 * @returns true if the value is not null
 */
module.exports.isNotNull = (value) => {
  return (
    value != undefined &&
    (!isNaN(value) ||
      typeof value === 'boolean' ||
      this.isJsonObject(value) ||
      value.toLowerCase() != 'null')
  );
};

/**
 * It evaluates if an array is formed by a set of empty values.
 * @param {array} array set of values
 * @returns true if all the values are empty
 */
module.exports.areEmpty = (array) => {
  return array.some(this.isEmpty);
};

/**
 * It evaluates if a string is not null neither empty.
 * @param {string} str data to evaluate
 * @returns true if the data evaluated is not null neither empty
 */
module.exports.hasValue = (str) => {
  return this.isNotNull(str) && this.isNotEmpty(str);
};

/**
 * It evaluates if the given string is lower-case.
 * @param {string} str data to evaluate
 * @returns true if lowercase
 */
module.exports.isLowerCase = (str) => {
  return str == str.toLowerCase();
};

/**
 * It capitalizes a string, converting the first letter to uppercase.
 * @param {*} str string to convert
 * @returns capitalized string
 */
module.exports.capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * It translates an string from plural to singular.
 * @param {string} str data to translate
 * @returns resultant string after tanslation
 */
module.exports.plural2singular = (str) => {
  if (str.substr(str.length - 3).toLowerCase() == 'ies') {
    let result = str.slice(0, -3);
    return this.isLowerCase(str) ? result.concat('y') : result.concat('Y');
  } else if (str.substr(str.length - 1).toLowerCase() == 's') {
    return str.slice(0, -1);
  }
  return str;
};

/**
 * It translates a snake_case string to lowerCamelCase
 * @param {*} str string to translate
 * @returns lowerCamelCased string
 */
module.exports.snakeToLowerCamelCase = (str) => {
  let substrings = str.split('_');
  let result = substrings.shift().toLowerCase();
  substrings.forEach((element) => {
    element = element.toLowerCase();
    element = this.capitalize(element);
    result = result.concat(element);
  });
  return result;
};

/**
 * It translates a lowerCamelCase string to snake_case
 * @param {*} str string to translate
 * @returns snake_cased string
 */
module.exports.lowerCamelCaseToSnakeCase = (str) => {
  var result = str.replace(/([A-Z])/g, ' $1');
  return result.split(' ').join('_').toLowerCase();
};

/**
 * It translates an string from kebab-case to snake-case.
 * @param {string} str data to translate
 * @returns resultant string after translation
 */
module.exports.kebab2snake = (str) => {
  return str.replace('-', '_');
};

/**
 * It reads a local file
 * @param {string} filePath file path
 * @returns content of the file
 */
module.exports.readFile = (filePath) => {
  try {
    return [require('fs').readFileSync(filePath)];
  } catch (error) {
    return null;
  }
};

/**
 * Function used to get the current time for calculating execution times.
 * @returns current date
 */
module.exports.startTime = () => {
  return new Date();
};

/**
 * Function used to calculate the elapsed time between the given start time
 * and the current time.
 * @returns elapsed time from the given stat time
 */
module.exports.endTime = (startTime) => {
  let endTime = new Date();
  endTime = endTime - startTime;
  endTime = endTime /= 1000;
  return endTime.toFixed(3);
};

/**
 * It build the current time in the following format: HH:MM:SS:mm
 * @returns current time
 */
module.exports.getCurrentTime = () => {
  let currentDate = new Date();
  let hour = currentDate.getHours();
  let minutes = currentDate.getMinutes();
  let seconds = currentDate.getSeconds();
  let millis = currentDate.getMilliseconds();
  return `${hour}:${minutes}:${seconds}:${millis}`;
};

/**
 * It returns dodays date by using the defaults platform format
 * @returns date string representation
 */
module.exports.getCurrentDateStr = () => {
  return moment().format(catalog.DEFAULT_DATE_FORMAT);
};

/**
 * It returns dodays date by using the defaults platform format
 * @returns date string representation
 */
module.exports.getCurrentDateTimeStr = () => {
  return moment().format(catalog.DEFAULT_DATETIME_FORMAT);
};

/**
 * It builds the current timestamp in the following format: YYYY-MM-DD HH:MM:SS
 * @returns current timestamp
 */
module.exports.genDatabaseTimestamp = () => {
  let currentDate = new Date();
  let year = currentDate.getFullYear();
  let month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
  let day = ('0' + currentDate.getDate()).slice(-2);
  let hour = ('0' + currentDate.getHours()).slice(-2);
  let minutes = ('0' + currentDate.getMinutes()).slice(-2);
  let seconds = ('0' + currentDate.getSeconds()).slice(-2);
  return `${year}-${month}-${day} ${hour}:${minutes}:${seconds}`;
};

/**
 * It wraps a snippet execution in order to execute and print the final execution time.
 * @param {string} taskName task name
 * @param {*} code code to be executed
 * @returns the result of executing the given snippet
 */
module.exports.task = async (taskName, code) => {
  logger.time(taskName);
  try {
    return await code();
  } catch (error) {
    logger.error('Throwing exception');
    throw error;
  } finally {
    logger.timeEnd(taskName);
  }
};

/**
 * It generates a random unique identifier.
 * @returns random universal unique identifier
 */
module.exports.genRandomUuid = () => {
  logger.info('Generating Random JSON UUID');
  let result = uuidv4();
  logger.info('Result:', result);
  return result;
};

/**
 * It generates a unique identifier that represents a unique Mongo Document, based on its content.
 * @param {*} data json data
 * @returns uuid
 */
module.exports.genMongoUuid = (data) => {
  logger.info('Generating JSON UUID');
  let jsonCompacted = JSON.stringify(data);
  let jsonCompactedBase64 = this.base64(jsonCompacted);
  let namespace = catalog.UUID_NAMESPACES.MONGO_COLLECTIONS;
  let result = uuidv5(jsonCompactedBase64, namespace);
  logger.info('Result:', result);
  return result;
};

/**
 * It generates a password.
 * @returns random password
 */
module.exports.genRandomPassword = () => {
  let symbolsPart = this.lookupRandomCharacters(Array(2).fill('&$%#.'));
  let numericPart = this.lookupRandomCharacters(Array(2).fill('0123456789'));
  let alphaUpperPart = this.lookupRandomCharacters(
    Array(3).fill('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  );
  let alphaLowerPart = this.lookupRandomCharacters(
    Array(3).fill('abcdefghijklmnopqrstuvwxyz')
  );
  return `${symbolsPart[0]}${alphaLowerPart}${symbolsPart[1]}${numericPart}${alphaUpperPart}`;
};

/**
 * It returns a random set of characters from an input string
 * @param {string} inputStr input string
 * @returns result string
 */
module.exports.lookupRandomCharacters = (inputStr) => {
  return inputStr
    .map(function (x) {
      return x[Math.floor(Math.random() * x.length)];
    })
    .join('');
};

/**
 * It reads a local file.
 * @param {string} filePath file path
 * @returns file content in JSON format
 */
module.exports.readJsonLocalFile = (filePath) => {
  logger.info('Reading local file:', filePath);
  try {
    let fileContentStr = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContentStr);
  } catch (error) {
    logger.warn('File not found!');
    return undefined;
  }
};

/**
 * It writes a local file.
 * @param {string} filePath file path
 */
module.exports.writeJsonLocalFile = (filePath, jsonObject) => {
  logger.info('Writing local file:', filePath);
  try {
    fs.writeFileSync(filePath, JSON.stringify(jsonObject, null, 2));
  } catch (error) {
    logger.error('File write error!');
  }
};

/**
 * It validates if the input data is a promise or not.
 * @param {*} input input data
 * @returns true if the given input data is a promise
 */
module.exports.isPromise = (input) => {
  return !!input && typeof input.then === 'function';
};

/**
 * It truncates the given input string to a max size
 * @param {string} inputStr input string to truncate if exceeds the given max size.
 * @param {integer} maxLength max size
 */
module.exports.truncateString = (inputStr, maxLength) => {
  maxLength = maxLength ? maxLength : catalog.LOG_LENGTH_MAX;
  return inputStr && inputStr.length > maxLength
    ? `${inputStr.substring(0, maxLength)}...`
    : inputStr;
};

/**
 * It returns today date with format yyyy-mm-dd
 * @returns yyyy-mm-dd
 */
module.exports.todayDate = () => {
  return new Date().toISOString().slice(0, 10);
};

/**
 * It returns today date with format yyyy-mm-dd
 * @returns date
 */
module.exports.currentDate = () => {
  return new Date().toISOString().slice(0, 10);
};

/**
 * It lists the dates in between of two dates
 * @param {date} dateFrom date from
 * @param {date} dateTo date to
 * @param {boolean} inclusive true to include the dateForm and dateTo to the result
 * @returns array of dates
 */
module.exports.listDatesInBetween = (dateFrom, dateTo, inclusive) => {
  let date,
    dateList = [];
  if (!exports.isValidDate(dateFrom) || !exports.isValidDate(dateTo)) {
    throw new Error(
      `Error getting dates in between. Invalid Dates: ${dateFrom}, ${dateTo}`
    );
  }
  for (
    date = new Date(exports.followingDate(1, dateFrom));
    date < new Date(dateTo);
    date.setDate(date.getDate() + 1)
  ) {
    dateList.push(date.toISOString().slice(0, 10));
  }
  return exports.toBoolean(inclusive)
    ? [dateFrom, ...dateList, dateTo]
    : dateList;
};

/*module.exports.listDatesInBetween = (dateFrom, dateTo, inclusive) => {
  let date,
    dateList = [];
  for (
    date = inclusive ? new Date(dateFrom) : new Date(dateFrom) + 1;
    (inclusive && date <= new Date(dateTo)) || date < new Date(dateTo);
    date.setDate(date.getDate() + 1)
  ) {
    dateList.push(date);
  }
  return dateList.map((v) => v.toISOString().slice(0, 10));
};*/

/**
 * It returns n days back from the current date
 * @param {*} pastDays past days
 * @returns date
 */
module.exports.pastDate = (pastDays) => {
  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - pastDays);
  return yesterday.toISOString().slice(0, 10);
};

/**
 * It gets the amount of days that the current month has.
 * @returns intenger
 */
module.exports.getDaysInMonth = () => {
  let dt = new Date();
  let month = dt.getMonth();
  let year = dt.getFullYear();
  return new Date(year, month, 0).getDate();
};

/**
 * It calculates the dates interval from the given range type
 * @param {*} rangeType example: general.search.range.1y for the last year
 * @returns it returns an array with the dateFrom and dateTo for the range
 */
module.exports.getRangeDates = (rangeType) => {
  let toDate = `${this.todayDate()} 23:59:59`;
  let pastDays;

  switch (rangeType) {
    case catalog.SEARCH_RANGE.LAST_DAY:
      pastDays = 1;
      break;
    case catalog.SEARCH_RANGE.LAST_WEEK:
      pastDays = 7;
      break;
    case catalog.SEARCH_RANGE.LAST_MONTH:
      pastDays = this.getDaysInMonth();
      break;
    case catalog.SEARCH_RANGE.LAST_YEAR:
      pastDays = 365;
      break;
  }

  let fromDate = `${this.pastDate(pastDays)} 00:00:00`;
  return [fromDate, toDate];
};

/**
 * It evaluates if the given string is a valid number
 * @param input input to evaluate
 * @returns true if it is a valid numeric
 */
module.exports.isNumeric = (input) => {
  return (
    input != undefined &&
    typeof input != 'boolean' &&
    ((input != '' && !isNaN(input)) || input === 0)
  );
};

/**
 * It translates to primitive boolean the input value
 * @param {*} input input value
 * @returns primitive boolean
 */
module.exports.toBoolean = (value) => {
  return value === 'true' || value == true;
};

/**
 * It validates if this string is GREATER THAN the given one by argument
 * @param {string} str string to validate
 * @returns true if the condition is satisfied
 */
String.prototype.gt = function (str) {
  return exports.isNumeric(this) && exports.isNumeric(str)
    ? parseFloat(this) > parseFloat(str)
    : exports.compareStringDates(this, str, 'gt');
};

/**
 * It validates if this string is EQUAL or GREATHER THAN the given one by argument
 * @param {string} str string to validate
 * @returns true if the condition is satisfied
 */
String.prototype.ge = function (str) {
  return exports.isNumeric(this) && exports.isNumeric(str)
    ? parseFloat(this) >= parseFloat(str)
    : exports.compareStringDates(this, str, 'ge');
};

/**
 * It validates if this string is LESS THAN the given one by argument
 * @param {string} str string to validate
 * @returns true if the condition is satisfied
 */
String.prototype.lt = function (str) {
  return exports.isNumeric(this) && exports.isNumeric(str)
    ? parseFloat(this) < parseFloat(str)
    : exports.compareStringDates(this, str, 'lt');
};

/**
 * It validates if this string is EQUAL or LESS THAN the given one by argument
 * @param {string} str string to validate
 * @returns true if the condition is satisfied
 */
String.prototype.le = function (str) {
  return exports.isNumeric(this) && exports.isNumeric(str)
    ? parseFloat(this) <= parseFloat(str)
    : exports.compareStringDates(this, str, 'le');
};

/**
 * It implements the method includesAny for Arrays, in which it verifies if this array
 * includes any of the elements of the array given by argument.
 * @param {array} array2 second array
 * @returns true if any is included
 */
Array.prototype.includesAny = function (array2) {
  return this.some((item) => array2.includes(item));
};

/**
 * It implements the method insert for Arrays.
 * @param {*} index array index
 * @param {*} item item to be inserted
 */
Array.prototype.insert = function (index, item) {
  this.splice(index, 0, item);
};

/**
 * It deletes an item from an array
 * @param {*} item item to be deleted from the array
 * @returns array without the deleted item
 */
Array.prototype.remove = function (item) {
  do {
    this.splice(this.indexOf(item), 1);
  } while (this.indexOf(item) != -1);
};

/**
 * It implements the method groupBy for Arrays.
 * @param {function} funcProp function that contains the groupBy filter statement
 * @returns array groupd by the funcProp
 */
Array.prototype.groupBy = function (funcProp) {
  return this.reduce(function (acc, val) {
    (acc[funcProp(val)] = acc[funcProp(val)] || []).push(val);
    return acc;
  }, {});
};

/**
 * It sorts the array ascending
 * @param {function} function that indicates which item's attribute to use for ordering
 * @return sort array
 */
Array.prototype.sortAsc = function (getAttributeFunction) {
  return this.sort((a, b) =>
    !getAttributeFunction(a) ||
    getAttributeFunction(a).toString().gt(getAttributeFunction(b))
      ? 1
      : -1
  );
};

/**
 * It sorts the array descending
 * @param {function} function that indicates which item's attribute to use for ordering
 * @return sort array
 */
Array.prototype.sortDesc = function (getAttributeFunction) {
  return this.sort((a, b) =>
    getAttributeFunction(a) &&
    getAttributeFunction(a).toString().gt(getAttributeFunction(b))
      ? -1
      : 1
  );
};

/**
 * It sums all the array items
 */
Array.prototype.sum = function () {
  return this.reduce((a, b) => a + b, 0);
};

/**
 * It retrieves the min value
 * @param {boolean} useDecimals true (default) to use the Decimals library
 * @returns min value
 */
Array.prototype.min = function (useDecimals) {
  let result;
  if (useDecimals == undefined || useDecimals == true) {
    this.forEach((d) => {
      d = d instanceof Decimal ? d : new Decimal(d);
      if (!result || d.lt(result)) result = d;
    });
  } else {
    result = Math.min(...this);
  }
  return result;
};

/**
 * It retrieves the max value
 * @param {boolean} useDecimals true (default) to use the Decimals library
 * @returns max value
 */
Array.prototype.max = function (useDecimals) {
  let result;
  if (useDecimals == undefined || useDecimals == true) {
    this.forEach((d) => {
      d = d instanceof Decimal ? d : new Decimal(d);
      if (!result || d.gt(result)) result = d;
    });
  } else {
    result = Math.max(...this);
  }
  return result;
};

/**
 * It validates if this Number is EQUAL the given one by argument
 * @param {number} n number to validate
 * @returns true if the condition is satisfied
 */
Number.prototype.eq = function (n) {
  return this > n;
};

/**
 * It validates if this Number is GREATER THAN the given one by argument
 * @param {number} n number to validate
 * @returns true if the condition is satisfied
 */
Number.prototype.gt = function (n) {
  return this > n;
};

/**
 * It validates if this Number is EQUAL or GREATHER THAN the given one by argument
 * @param {number} n number to validate
 * @returns true if the condition is satisfied
 */
Number.prototype.gte = function (n) {
  return this >= n;
};

/**
 * It validates if this Number is LESS THAN the given one by argument
 * @param {number} n number to validate
 * @returns true if the condition is satisfied
 */
Number.prototype.lt = function (n) {
  return this > n;
};

/**
 * It validates if this Number is EQUAL or LESS THAN the given one by argument
 * @param {number} n number to validate
 * @returns true if the condition is satisfied
 */
Number.prototype.lte = function (n) {
  return this >= n;
};

/**
 * It translates the given Decimal to Number.
 * @returns translated number
 */
Decimal.prototype.toNumber = function () {
  return Number(this.valueOf());
};

/**
 * It retrieves the max value
 * @param {boolean} useDecimals true (default) to use the Decimals library
 * @returns max value
 */
Array.prototype.max = function (useDecimals) {
  let result;
  if (useDecimals == undefined || useDecimals == true) {
    this.forEach((d) => {
      d = d instanceof Decimal ? d : new Decimal(d);
      if (!result || d > result) result = d;
    });
  } else {
    result = Math.max(...this);
  }
  return result;
};

/**
 * It verifies if all of the given elements are included or not into the array.
 * @return true if all of them are included
 */
Array.prototype.isIncluded = function (data) {
  if (Array.isArray(data)) {
    let includes = true;
    for (let i = 0; i < data.length; i++) {
      if (!this.includes(data[i])) {
        includes = false;
        break;
      }
    }
    return includes;
  } else {
    return this.includes(data);
  }
};

/**
 * It verifies if any of the given elements are included or not into the array.
 * @return true if any of them are included
 */
Array.prototype.isAnyIncluded = function (data) {
  if (Array.isArray(data)) {
    let includes = false;
    for (let i = 0; i < data.length; i++) {
      if (this.includes(data[i])) {
        includes = true;
        break;
      }
    }
    return includes;
  } else {
    return this.includes(data);
  }
};

/**
 * It pushes all the given elements that do not exist into the array.
 * @param {*} data single element or set of elements to push
 * @param {boolean} sortFunction sort function
 */
Array.prototype.pushIfNotExists = function (data, sortFunction) {
  data = Array.isArray(data) ? data : [data];
  data.forEach((newItem) => {
    this.indexOf(newItem) === -1 ? this.push(newItem) : undefined;
  });
  if (sortFunction) {
    sortFunction(this);
  }
};

/**
 * It clones this array of objects
 * @returns cloned array
 */
Array.prototype.clone = function (array2) {
  return this.map((element) => {
    return JSON.parse(JSON.stringify(element));
  });
};

/**
 * It iterates the current array to delete from its listed object the given fields by key
 * @param {array} fieldKeysToRemove fields keys to be removed from the objects
 */
Array.prototype.removeObjectFileds = function (fieldKeysToRemove) {
  fieldKeysToRemove = exports.toArray(fieldKeysToRemove);
  this.forEach((element) => {
    fieldKeysToRemove.forEach((fieldKey) => {
      delete element[fieldKey];
    });
  });
};

/**
 * It pushes all the given elements that do not exist into the array.
 * @param {object} objects object o set of objects to validate if some of them are included into the source array
 * @param {boolean} sortFunction sort function
 */
Array.prototype.includesSomeObjects = function (objects, exclusionFields) {
  let doesItAlreadyExist = false;

  let sourceArray = this.clone();
  let sourceArrayStringified = [];
  sourceArray.removeObjectFileds(exclusionFields);
  sourceArray.forEach((element) =>
    sourceArrayStringified.push(JSON.stringify(element))
  );

  let newArray = Array.isArray(objects) ? [...objects] : [{ ...objects }];
  let newArrayStringified = [];
  newArray.removeObjectFileds(exclusionFields);
  newArray.forEach((element) =>
    newArrayStringified.push(JSON.stringify(element))
  );

  newArrayStringified.forEach((newItem) => {
    if (sourceArrayStringified.indexOf(newItem) !== -1)
      doesItAlreadyExist = true;
  });
  return doesItAlreadyExist;
};

/**
 * It adds a new non-existent element or updates the existent one into the array.
 * @param {object} object json object to upsert into the array
 * @param {string} objectKey object key to determine if the object already exists in the array
 * @return 1 if the object was was added as new object or 2 if it was just updated
 */
Array.prototype.upsert = function (object, objectKey) {
  let status;
  let objectFound = this.find((item) => item[objectKey] == object[objectKey]);
  if (objectFound) {
    this[this.indexOf(objectFound)] = object;
    status = 2;
  } else {
    this.push(object);
    status = 1;
  }
  return status;
};

/**
 * It retrieves the given attribute
 * @param {string} attributeName attribute name
 * @returns array of attributes
 */
Object.prototype.getAttribute = function (attributeName) {
  let result = [];
  let input = [].concat(this);
  input.forEach((element) => {
    if (element[attributeName]) result.push(element[attributeName]);
  });
  return result;
};

module.exports.getJsonValue = (
  getJsonElementFunction,
  condition,
  elseValue
) => {
  let result;
  if (typeof getJsonElementFunction !== 'function') {
    throw new Error('First argument must be a function');
  }
  try {
    if (condition == undefined || exports.toBoolean(condition))
      result = getJsonElementFunction();
    if (result == undefined) throw new Error();
  } catch {
    try {
      result = typeof elseValue === 'function' ? elseValue() : elseValue;
    } catch {}
  }
  return result;
};

/**
 * It retrives the nested json element's value, parsed to Decimal, if it exists or return the given one if it does not exist
 * @param {string} getJsonElementFunction function that retrieves the desired json element
 * @param {boolean} condition boolean condition that must be satisfied to retrive the desired json element
 * @param {*} elseValue value to return in case of not satisfying the condition or if the element was not found
 * @returns nested decimal value or the given one if it does not exist
 */
module.exports.getJsonDecimalValue = (
  getJsonElementFunction,
  condition,
  elseValue
) => {
  let value = exports.getJsonValue(
    getJsonElementFunction,
    condition,
    elseValue
  );
  return exports.isNumeric(value) ? new Decimal(value) : value;
};

/**
 * It retrieves all the nested values that matches the get funcion
 * @param {function} getJsonElementFunction function that retrieves the desired json element
 * @returns array of the found nested values
 */
Array.prototype.getAllValuesByKey = function (getJsonElementFunction) {
  let value,
    result = [];
  this.forEach((object) => {
    try {
      value = getJsonElementFunction(object);
      if (value) {
        result.push(value);
      }
    } catch (error) {}
  });
  return result;
};

/**
 * It returns n following days from the current date
 * @param {number} followingDays following days
 * @param {string} dateFrom dateFrom
 * @returns date
 */
module.exports.followingDate = (followingDays, dateFrom) => {
  let futureDate = dateFrom ? new Date(dateFrom) : new Date();
  futureDate.setDate(futureDate.getDate() + followingDays);
  return futureDate.toISOString().slice(0, 10);
};

/**
 * It converts a date to epoch timestamp format
 * @param {string} dateStr date
 * @returns epoch timestamp
 */
module.exports.convertDateToEpochTimestamp = (date) => {
  let timestamp = typeof date == 'string' ? new Date(date) : date;
  timestamp = timestamp.getTime().toString();
  timestamp = timestamp.substring(0, 10);
  return Number(timestamp);
};

module.exports.getShortUuid = (uuid) => {
  return uuid.substring(uuid.lastIndexOf('-') + 1);
};
