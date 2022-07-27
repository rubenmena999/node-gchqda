const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(catalog.LOG_PREFIX.RESPONSE);
const apiError = require('../asn-api/apiError');
const utils = require('../asn-common/utils');

/**
 * It emits a callback execution to response the client with a Successful Response.
 * @param {function} callback HTTP Request Callback function
 * @param {json} jsonBody response
 * @param {number} httpCode http status code
 */
module.exports.success = (callback, jsonBody, httpCode) => {
  httpCode = httpCode ? httpCode : jsonBody ? 200 : 204;
  let jsonResponse = buildResposne(httpCode, jsonBody);

  logger.info('Calling callback function');
  logger.info('Response:', JSON.stringify(jsonResponse));

  callback(null, jsonResponse);
  callback.called = true;
  callback.success = true;
  callback.statusCode = httpCode;
};

/**
 * It emits a callback execution to response the client with an Error Response.
 * @param {function} callback HTTP Request Callback function
 * @param {*} error response
 */
module.exports.httpError = (callback, error) => {
  let httpCode = 500;
  let httpMessage = apiError.httpError.internalServerError.message;
  let technicalMessage = error ? error.message : 'Unknown Exception';

  if (error instanceof apiError.APIError) {
    httpCode = error.code;
    httpMessage = error.message;
    if (utils.isNotEmpty(error.technicalMessage)) {
      technicalMessage = error.technicalMessage;
    }
  }
  logger.warn('Technical error message: ', technicalMessage);

  let jsonResponse = buildResposne(httpCode, {
    error: {
      code: httpCode,
      message: httpMessage,
    },
  });

  logger.info('Calling callback function');
  logger.info('Response:', JSON.stringify(jsonResponse));

  callback(null, jsonResponse);
  callback.called = true;
  callback.success = true;
  callback.statusCode = httpCode;
};

/**
 * It validates if the HTTP Request Callback has been already executed,
 * that is, if the response has been sent to the client yet.
 * @param {function} callback HTTP Request Callback function
 */
module.exports.validateCallbackExecution = (callback) => {
  if (callback.called) {
    logger.info('Callback function was executed.');
  } else {
    logger.warn('Callback function was not executed.');
    throw new Error('Missing callback execution.');
  }
};

/**
 * It builds a valid HTTP Response that API Gateway could process succesfully.
 * API Gateway expects a response with a specific format, it ensures that the sintax
 * is satisfied.
 * @param {*} statusCode HTTP Response Status Code
 * @param {*} body HTTP Response Body
 * @returns HTTP Response
 */
const buildResposne = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(body),
});
