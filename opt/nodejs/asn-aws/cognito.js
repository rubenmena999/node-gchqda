const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(catalog.LOG_PREFIX.COGNITO);
const apiError = require('../asn-api/apiError');
const utils = require('../asn-common/utils');
const sdk = require('../asn-aws/sdk');
const cognito = sdk.getCognitoClient();
const errors = catalog.ERROR_MESSAGES;

/** User Pool Parameters */
let userPoolParams = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  Username: undefined,
  TemporaryPassword: undefined,
  DesiredDeliveryMediums: ['EMAIL'],
  UserAttributes: [{ Name: 'email_verified', Value: 'true' }],
  MessageAction: 'SUPPRESS',
};

/**
 * It creates a new user within the Cognito Users Pool
 * @param {string} email user email address
 * @returns result
 */
async function createUser(email) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Creating new user within the users pool for:', email);

  userPoolParams.Username = email;
  userPoolParams.UserAttributes.push({ Name: 'email', Value: email });
  userPoolParams.TemporaryPassword = utils.genRandomPassword(true);

  let result = await cognito
    .adminCreateUser(userPoolParams)
    .promise()
    .then(
      function (data) {
        return data;
      },
      function (error) {
        onError(error);
      }
    );

  result.TemporaryPassword = userPoolParams.TemporaryPassword;

  logger.trace('Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It deletes an existent user from the Cognito Users Pool
 * @param {string} uuid universal unique identifier which represents the user to be deleted
 * @returns result
 */
async function deleteUser(uuid) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Deleting user from cognito users pool:', uuid);

  var params = { UserPoolId: userPoolParams.UserPoolId, Username: uuid };
  let result = await cognito
    .adminDeleteUser(params)
    .promise()
    .then(
      function (data) {
        logger.trace('Result:', JSON.stringify(data));
        return data;
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
 * Callback funcion used to handle generic errors.
 * @param {*} error
 */
function onError(error) {
  if (error instanceof apiError.APIError) {
    throw error;
  } else if (error.code == 'UsernameExistsException') {
    throw new apiError.ResourceConflict(error.message);
  } else if (
    error.code == 'InvalidParameterException' &&
    error.message.includes('username')
  ) {
    throw new apiError.BadRequest(error.message);
  } else if (error.code == 'UserNotFoundException') {
    throw new apiError.ResourceNotFound(error.message, errors.INVALID_USERNAME);
  } else {
    throw new apiError.InternalServerError(`${error.code}: ${error.message}`);
  }
}

module.exports = {
  createUser,
  deleteUser,
};
