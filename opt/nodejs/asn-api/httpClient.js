const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(catalog.LOG_PREFIX.HTTP);
const promiseHandler = require('../asn-common/promiseHandler')(logger);
const axios = require('axios');
let params, body;

module.exports.HTTP_METHOD = {
  POST: 'POST',
  GET: 'GET',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};
module.exports.HTTP_HEADER = {
  AWS_TRACE_ID: 'X-Amzn-Trace-Id',
  CONTENT_TYPE: 'Content-Type',
};
module.exports.HTTP_CONTENT_TYPE = {
  FORM: 'multipart/form-data',
  JSON: 'application/json',
};

/**
 * HTTP POST Request
 * @param {string} url request url
 * @param {json} headers request headers
 * @param {json} body request body
 * @param {function} onSuccess callback function to handle successful operations
 * @param {function} onError callback function to handle failed operations
 * @returns response result in JSON format
 */
module.exports.post = async (url, headers, body, onSuccess, onError) => {
  return promiseHandler.validate(
    await request(
      this.HTTP_METHOD.POST,
      url,
      params,
      headers,
      body,
      onSuccess,
      onError
    )
      .then((data) => [data, undefined])
      .catch((error) => [undefined, error])
  );
};

/**
 * HTTP GET Request.
 * @param {string} url request url
 * @param {json} params request parameters
 * @param {json} headers request headers
 * @param {function} onSuccess callback function to handle successful operations
 * @param {function} onError callback function to handle failed operations
 * @returns response result in JSON format
 */
module.exports.get = async (url, params, headers, onSuccess, onError) => {
  return promiseHandler.validate(
    await request(
      this.HTTP_METHOD.GET,
      url,
      params,
      headers,
      body,
      onSuccess,
      onError
    )
      .then((data) => [data, undefined])
      .catch((error) => [undefined, error])
  );
};

/**
 * It performs an HTTP Request.
 * @param {*} method
 * @param {*} url
 * @param {*} params
 * @param {*} headers
 * @param {*} body
 * @param {*} onSuccess
 * @param {*} onError
 */
async function request(method, url, params, headers, body, onSuccess, onError) {
  try {
    logger.info(
      'HTTP Request:',
      JSON.stringify({
        method: method,
        url: url,
        params: params,
        headers: headers,
        body: body && typeof body === 'object' ? JSON.stringify(body) : body,
      })
    );

    let response, result;
    switch (method) {
      case exports.HTTP_METHOD.GET:
        response = await axios.get(url, { params: params, headers: headers });
        break;
      case exports.HTTP_METHOD.POST:
        response = await axios.post(url, body, { headers: headers });
        break;
      default:
        logger.warn(`The method ${method} is not implemented in httpClient`);
    }

    logger.info('Response Status:', response.status);
    if (onSuccess) {
      if (promiseHandler.isPromise(onSuccess)) {
        logger.trace('Handling HTTP onSuccess Promise');
        return promiseHandler.validate(
          await onSuccess(response)
            .then((data) => [data, undefined])
            .catch((error) => [undefined, error])
        );
      } else if (promiseHandler.isFunction(onSuccess)) {
        logger.trace('Handling HTTP onSuccess Function');
        return await promiseHandler.handle(onSuccess(response));
      } else {
        logger.warn(
          'The onSuccess callback input is neither a promise nor a function.'
        );
        logger.warn('onSuccess callback input:', onSuccess);
        return response;
      }
    }
  } catch (error) {
    logger.warn('Exception caught:', error.message);
    if (onError) {
      if (promiseHandler.isPromise(onError)) {
        logger.trace('Handling HTTP onError Promise');
        promiseHandler.validate(
          await onError(error)
            .then((data) => [data, undefined])
            .catch((error) => [undefined, error])
        );
      } else if (promiseHandler.isFunction(onError)) {
        logger.trace('Handling HTTP onError Function');
        return await promiseHandler.handle(onError(error));
      } else {
        logger.warn(
          'The onError callback input is neither a promise nor a function.'
        );
        logger.warn('onError callback input:', onError);
        throw error;
      }
    } else {
      throw error;
    }
  }
}
