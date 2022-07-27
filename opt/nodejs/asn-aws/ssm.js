const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(
  catalog.LOG_PREFIX.SYSTEMS_MANAGER
);
const apiError = require('../asn-api/apiError');
const utils = require('../asn-common/utils');
const sdk = require('../asn-aws/sdk');
const ssm = sdk.getSystemsManagerClient();

/**
 * It stores a parameter by name into Systems Manager/Parameters Store Service.
 * @param {string} name parameters name
 * @param {string} value parameters value
 * @param {string} description parameters description
 * @param {boolean} encrypted true if you want to store an encrypted secret
 * @returns result
 */
async function putParameter(name, value, description, encrypted) {
  let logId = logger.time(arguments.callee.name);

  logger.trace('Storing parameter with name:', name);
  let params = {
    Name: name,
    Value: value,
    Type: encrypted ? 'SecureString' : 'String',
    DataType: 'text',
    Tier: 'Standard',
    Description: description ? description : '',
    Overwrite: true,
  };

  let result = await ssm
    .putParameter(params)
    .promise()
    .then(function (data) {
      logger.info('Parameter stored successfully');
      return data;
    })
    .catch(function (error) {
      logger.error(error.stack);
      throw error;
    });

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It looks up a parameter by name from Systems Manager/Parameters Store Service.
 * @param {*} paramName parameter name
 * @returns parameter
 */
async function getParameter(paramName, withDecryption) {
  let logId = logger.time(arguments.callee.name);

  logger.trace('Looking up parameter by name:', paramName);
  let params = { Name: paramName, WithDecryption: withDecryption };

  let result = await ssm
    .getParameter(params)
    .promise()
    .then(function (data) {
      if (data.Parameter) {
        logger.info('Parameter retrieved successfully');
        return data.Parameter.Value;
      } else {
        logger.warn('Parameter not found for:', paramName);
        throw new apiError.ResourceNotFound();
      }
    })
    .catch(function (error) {
      logger.error(error.stack);
      throw error;
    });

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It requests a set of parameters from its path.
 * @param {string} path parameters path.
 * @param {boolean} withDecryption true to decrypt the parameters
 * @returns list of params.
 */
async function getParameterByPath(path, withDecryption) {
  let logId = logger.time(arguments.callee.name);

  logger.trace('Looking up parameter by path:', path);
  let params = { Path: path, Recursive: true, WithDecryption: withDecryption };

  let result = ssm
    .getParametersByPath(params)
    .promise()
    .then(function (data) {
      if (data.Parameters) {
        logger.info('Parameters retrieved successfully');
        return data.Parameters;
      } else {
        logger.warn('There is no parameters for the requested path:', path);
        throw new apiError.ResourceNotFound();
      }
    })
    .catch(function (error) {
      logger.error(error.stack);
      throw error;
    });

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It deletes a parameter by name.
 * @param {string} name parameter name
 * @returns result
 */
async function deleteParameter(name) {
  let logId = logger.time(arguments.callee.name);

  logger.trace('Deleting parameter with name:', name);
  let params = { Name: name };
  let result = await ssm
    .deleteParameter(params)
    .promise()
    .then(function (data) {
      logger.info('Parameter deleted successfully');
      return data;
    })
    .catch(function (error) {
      logger.error(error.stack);
    });

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

module.exports = {
  putParameter,
  getParameter,
  getParameterByPath,
  deleteParameter,
};
