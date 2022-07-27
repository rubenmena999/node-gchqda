const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(catalog.LOG_PREFIX.DYNAMO_DB);
const apiError = require('../asn-api/apiError');
const utils = require('../asn-common/utils');
const sdk = require('../asn-aws/sdk');
const ddbDocumentClient = sdk.getDynamoDocClient();
const ddb = sdk.getDynamoClient();

/** Relational Database Tables Metadata */
var tablesMetadata;

/**
 * It fetchs a single item querying by a primary key.
 * @param {*} tableName table name
 * @param {*} keyName key name
 * @param {*} keyType key type ('S' for Strings, 'N' for numbers)
 * @param {*} keyValue key value
 * @returns fetched item in JSON format.
 */
async function fetchItemByPrimaryKey(tableName, keyName, keyType, keyValue) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Fetching Item by primary key');

  let params = { TableName: tableName, Key: {} };
  params.Key[keyName] = {};
  params.Key[keyName][keyType] = keyValue;
  logger.trace('Params:', JSON.stringify(params));

  let fetchPromise = ddb.getItem(params).promise();
  let result = await fetchPromise.then(onSuccess, onError);
  logger.trace('Result:', JSON.stringify(result));

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It fetchs a single item querying by a secondary index.
 * @param {*} tableName table name
 * @param {*} keyName key name
 * @param {*} keyType key type ('S' for Strings, 'N' for numbers)
 * @param {*} keyValue key value
 * @returns fetched item in JSON format.
 */
async function fetchItemByIndex(tableName, keyName, keyType, keyValue) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Fetching Item by primary key');

  let params = { TableName: tableName, ExpressionAttributeValues: {} };
  params.IndexName = `${keyName}-index`;
  params.KeyConditionExpression = `${keyName} = :${keyName}`;
  params.ExpressionAttributeValues[`:${keyName}`] = {};
  params.ExpressionAttributeValues[`:${keyName}`][keyType] = keyValue;
  logger.trace('Params:', JSON.stringify(params));

  let fetchPromise = ddb.query(params).promise();
  let result = await fetchPromise.then(onSuccess, onError);
  logger.trace('Result:', JSON.stringify(result));

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It fetchs a collection querying by a field's list.
 * @param {*} tableName table name
 * @param {*} fieldName field name
 * @param {*} fieldType field type ('S' for Strings, 'N' for numbers)
 * @param {*} fieldValues field values
 * @returns fetched collection in JSON format.
 */
async function fetchCollectionByFieldInList(
  tableName,
  fieldName,
  fieldType,
  fieldValues
) {
  let logId = logger.time(arguments.callee.name);

  logger.info(
    `Fetching collection by field list: ${tableName}.${fieldName} = ${fieldValues}`
  );

  let item = '';
  let filterExpression = `#${fieldName} in (`;
  let expressionAttributeValues = {};

  fieldValues.forEach(function (fieldValue, i) {
    item = `${fieldName}${i}`;
    filterExpression += `:${item},`;
    expressionAttributeValues[`:${item}`] = {};
    expressionAttributeValues[`:${item}`][fieldType] = fieldValue;
  });
  filterExpression = filterExpression.slice(0, -1);
  filterExpression += ')';

  let expressionAttributeNames = {};
  expressionAttributeNames[`#${fieldName}`] = fieldName;

  let params = {
    TableName: tableName,
    FilterExpression: filterExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  logger.info('Params: ', JSON.stringify(params));
  let result = await ddb
    .scan(params)
    .promise()
    .then(
      function (result) {
        return result.Items;
      },
      function (error) {
        onError(error);
      }
    );
  logger.trace('Result:', JSON.stringify(result));

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It books a new item.
 * @param {string} tableName table name in which we are going to insert the item
 * @param {json} item item to insert
 * @returns persisted item result in JSON format
 */
async function insertItem(tableName, item) {
  let logId = logger.time(arguments.callee.name);

  logger.info(`Inserting Item ${JSON.stringify(item)} in ${tableName}`);
  let params = { TableName: tableName, Item: item };
  let result = await ddbDocumentClient
    .put(params)
    .promise()
    .then(function (result) {
      logger.info('Item inserted successfully');
      if (!utils.isEmptyJson(result)) {
        logger.trace('Result:', JSON.stringify(result));
        return result;
      }
    }, onError);

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It updates an existem item.
 * @param {string} tableName table name in which we are going to insert the item
 * @param {json} item item to update
 * @returns persisted item result in JSON format
 */
async function updateItem(tableName, key, updateExpression, values) {
  let logId = logger.time(arguments.callee.name);

  let params = {
    TableName: tableName,
    key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: values,
    ReturnValues: 'UPDATED_NEW',
  };
  logger.info(`Updating ${JSON.stringify(params)}`);

  let result = await ddbDocumentClient
    .update(params)
    .promise()
    .then(function (result) {
      logger.info('Item updated successfully');
      if (!utils.isEmptyJson(result)) {
        logger.trace('Result:', JSON.stringify(result));
        return result;
      }
    }, onError);

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It deletes an item by key.
 * @param {string} tableName table name in which we are going to insert the item
 * @param {json} key matching criteria
 * @returns deleted entity result in JSON format
 */
async function deleteItem(tableName, key) {
  let logId = logger.time(arguments.callee.name);

  logger.info(`Deleting Item ${JSON.stringify(key)} from ${tableName}`);
  let params = { TableName: tableName, Key: key };

  let result = await ddb
    .deleteItem(params)
    .promise()
    .then(function (result) {
      logger.info('Item deleted successfully');
      if (!utils.isEmptyJson(result)) {
        logger.trace('Result:', JSON.stringify(result));
        return result;
      }
    }, onError);

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * Callback function to handle successful operations.
 * @param {json} result operation result in JSON format
 * @returns entity unique identifier
 */
async function onSuccess(result) {
  logger.trace('Result:', JSON.stringify(result));

  if ((!utils.isEmptyJson(result) && result.Items) || result.Item) {
    logger.info('Unmarshalling result to translate to JSON format');
    result = result.Items ? result.Items : result.Item;
    return await unmarshall(result);
  }
  onError(new apiError.ResourceNotFound());
}

/**
 * Callback function to handle failed operations.
 * @param {*} error error thrown
 */
function onError(error) {
  logger.warn(`Throwing exception: ${error.code}. ${error.message}`);
  apiError.APIError.throwError(error);
}

/**
 * It converts a set of DynamoDB records into a JSON object.
 * @param {json} result operation result in JSON format
 * @returns result in json format
 */
async function unmarshall(data) {
  logger.info('Unmarshalling records');
  let result = [];

  if (Array.isArray(data)) {
    for (var i in data) {
      result.push(await sdk.aws.DynamoDB.Converter.unmarshall(data[i]));
    }
  } else {
    result = await sdk.aws.DynamoDB.Converter.unmarshall(data);
  }
  return result;
}

module.exports = {
  fetchItemByPrimaryKey,
  fetchItemByIndex,
  fetchCollectionByFieldInList,
  insertItem,
  updateItem,
  deleteItem,
  unmarshall,
};
