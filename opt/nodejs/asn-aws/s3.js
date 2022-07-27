const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(catalog.LOG_PREFIX.S3);
const promiseHandler = require('../asn-common/promiseHandler')(logger);
const sdk = require('../asn-aws/sdk');
const s3Client = sdk.getS3Client();
const apiError = require('../asn-api/apiError');
const simpleParser = require('mailparser').simpleParser;
const ACL = { PUBLIC: 'public-read', PRIVATE: 'private' };

/**
 * It uploads objects like empty folders or files.
 * @param {string} bucketName bucketName in which to perform the upload
 * @param {string} objectKey object key is the object path wihtin the bucket
 * @param {Buffer} objectData buffer binary data to upload or undefined to create an empty folder
 * @param {string} objectTags string with the tags for the object "Key1=Value1"
 * @param {boolean} private true to set the object private, or false to set it as public
 * @returns upload result object
 */
async function uploadObject(
  bucketName,
  objectKey,
  objectData,
  objectTags,
  private
) {
  let logId = logger.time(arguments.callee.name);

  var params = {
    ACL: private && private == false ? ACL.PUBLIC : ACL.PRIVATE,
    Bucket: bucketName,
    Key: objectData ? objectKey : `${objectKey}/`,
    Body: objectData ? objectData : '',
  };

  if (objectTags) {
    params.Tagging = objectTags;
  }
  if (objectData) {
    logger.info(
      `Uploading ${params.ACL} object into s3: ${bucketName}/${objectKey}`
    );
  } else {
    logger.info(
      `Uploading ${params.ACL} empty folder: ${bucketName}/${objectKey}`
    );
  }

  let promise = s3Client.upload(params).promise();
  let result = await promiseHandler.handle(promise);
  logger.info('Object uploaded successfully');

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It downloads a specific object.
 * @param {string} bucketName bucket name in which the object is located
 * @param {string} objectKey object key
 * @param {boolean} returnUndefinedOnError true to return undefined if an error happens
 * @returns object file buffer stream
 */
async function getObject(bucketName, objectKey, returnUndefinedOnError) {
  let logId = logger.time(arguments.callee.name);
  let result;
  try {
    logger.info(`Downloading object from s3: ${bucketName}/${objectKey}`);
    let promise = s3Client
      .getObject({ Bucket: bucketName, Key: objectKey })
      .promise();
    result = await promiseHandler.handle(promise);
    logger.info('Object downloaded successfully');
  } catch (error) {
    logger.warn('Exception caught:', error);
    if (returnUndefinedOnError) {
      return undefined;
    } else if (error.toString().includes('NoSuchKey')) {
      throw new apiError.ResourceNotFound();
    } else {
      throw error;
    }
  }
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It deletes a specific object.
 * @param {*} bucketName bucket name in which the object is located
 * @param {*} objectKey object key
 */
async function deleteObject(bucketName, objectKey) {
  let logId = logger.time(arguments.callee.name);

  logger.info(`Deleting object from s3: ${bucketName}/${objectKey}`);
  let promise = s3Client
    .deleteObject({ Bucket: bucketName, Key: objectKey })
    .promise();
  let result = await promiseHandler.handle(promise);
  logger.info('Object deleted successfully');

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * Gets email html body from S3 Bucket
 * @param {object} mail info data.
 * @returns string html for email.
 */
async function getEmail(emailBucket, emailKeyPrefix, emailMessageId) {
  let logId = logger.time(arguments.callee.name);

  let request = {
    Bucket: emailBucket,
    Key: emailKeyPrefix + emailMessageId,
  };

  logger.info('Retrieving email from s3:', request);
  try {
    let s3Data = await s3Client.getObject(request).promise();
    logger.info('Raw email:' + s3Data.Body);
    let emailParsed = await simpleParser(s3Data.Body);
    logger.info('Parsed email:', JSON.stringify(emailParsed));
    return emailParsed.html
      ? Promise.resolve(emailParsed.html)
      : Promise.reject(
          'Email content not suitable for table parse: No html content.'
        );
  } catch (error) {
    logger.info(error, error.stack);
    return Promise.reject(error);
  } finally {
    logger.timeEnd(arguments.callee.name, logId);
  }
}

module.exports = {
  uploadObject,
  getObject,
  deleteObject,
  getEmail,
};
