const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(
  catalog.LOG_PREFIX.SECRETS_MANAGER
);
const utils = require('../asn-common/utils');
const sdk = require('../asn-aws/sdk');
const sm = sdk.getSecretsManagerClient();

/**
 * It looks up a certificate by name.
 * It first validates if the certificate is already loaded in the given argument,
 * if not it takes a look into the filesystem, and finally in secrets manager.
 * @param {string} certificateName certificate name
 * @param {string} certificate variable in which the certificate must be stored
 * @returns certificate
 */
async function lookupCertificate(certificateName, certificate) {
  logger.info('Looking up certificate: ', certificateName);

  if (certificate) {
    logger.info('Certificate is already loaded');
    return certificate;
  } else {
    logger.info('Certificate is not loaded yet');
  }

  certificate = utils.readFile(certificateName);
  if (certificate) {
    logger.info('Certificate has been loaded from local filesystem');
    return certificate;
  } else {
    logger.info('Certificate is not present in local filesystem');
  }

  try {
    certificate = await getSecret(certificateName);
    logger.info('Certificate has been loaded from secrets manager');
    return certificate;
  } catch (error) {
    logger.info('Certificate is not found in secret manager');
  }

  throw Error('Certificate not found');
}

/**
 * It looks up a secret by name from Secrets Manager.
 * @param {*} secretName secret name
 * @returns secret
 */
async function getSecret(secretName) {
  let logId = logger.time(arguments.callee.name);

  logger.trace('Looking up secret:', secretName);
  let result = await sm
    .getSecretValue({ SecretId: secretName })
    .promise()
    .then(onSuccess, onError);

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * Callback function to handle success responses from Secret Manager.
 * @param {*} data retrieved secret
 * @returns secret
 */
function onSuccess(data) {
  let result = '';
  if ('SecretString' in data) {
    result = data.SecretString;
  } else {
    let buff = new Buffer(data.SecretBinary, 'base64');
    result = buff.toString('ascii');
  }
  logger.info('Secret retrieved successfully');

  try {
    return JSON.parse(result);
  } catch (error) {
    return result;
  }
}

/**
 * Callback function to handle errors when calling Secrets Manager.
 * @param {*} error thrown error
 */
function onError(error) {
  if (error) {
    if (error.code === 'DecryptionFailureException')
      // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
      throw error;
    else if (error.code === 'InternalServiceErrorException')
      // An error occurred on the server side.
      throw error;
    else if (error.code === 'InvalidParameterException')
      // You provided an invalid value for a parameter.
      throw error;
    else if (error.code === 'InvalidRequestException')
      // You provided a parameter value that is not valid for the current state of the resource.
      throw error;
    else if (error.code === 'ResourceNotFoundException')
      // We can't find the resource that you asked for.
      throw error;
  }
}

module.exports = {
  getSecret,
  lookupCertificate,
};
