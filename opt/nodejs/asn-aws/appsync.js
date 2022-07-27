const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(catalog.LOG_PREFIX.APPSYNC);
const promiseHandler = require('../asn-common/promiseHandler')(logger);
const utils = require('../asn-common/utils');
const sdk = require('../asn-aws/sdk');
const gql = require('graphql-tag');
const AWSAppSyncClient = require('aws-appsync').default;
var appsyncClient;

require('isomorphic-fetch');

/**
 * Environment Variables
 */
const region = process.env.AWS_REGION;

/**
 * AppSync Notification
 */
class Notification {
  /**
   * Constructor.
   * @param {Message} message message
   * @param {string} userUuid user's universal unique identifier to which the message is sent
   * @param {string} tradeUuid user's universal unique identifier to which the message is sent
   * @param {number} timeToLive EPOCH (ISO8601) time to live numeric value
   */
  constructor(message, userUuid, tradeUuid, timeToLive) {
    this.message = message;
    this.userUuid = userUuid;
    this.tradeUuid = tradeUuid;
    this.timeToLive = timeToLive;
  }

  /**
   * It translates the Notification Class to JSON Object.
   * @returns json representation
   */
  toJson() {
    return JSON.parse(
      JSON.stringify({
        userUuid: this.userUuid,
        tradeUuid: this.tradeUuid,
        timeToLive: this.timeToLive,
        message: this.message.toJson(),
      })
    );
  }

  buildMutationStr() {
    let notificationJson = this.toJson();
    let message = `message: ${JSON.stringify(notificationJson.message).replace(
      /"(\w+)"\s*:/g,
      '$1:'
    )}`;
    let userUuid = `userUuid: "${notificationJson.userUuid}",`;
    let tradeUuid = notificationJson.tradeUuid
      ? `tradeUuid: "${notificationJson.tradeUuid}",`
      : '';
    let timeToLive = notificationJson.timeToLive
      ? `timeToLive: ${notificationJson.timeToLive},`
      : '';
    return `mutation createNotification { createNotification(${userUuid}${tradeUuid}${timeToLive}${message}) {
            uuid creationDateTime timeToLive userUuid tradeUuid message { type active payload variables }
        }}`;
  }
}

/**
 * AppSync Notification Message
 */
class Message {
  /**
   * Constructor.
   * @param {string} type type of notification
   * @param {boolean} active true if the notification is active
   * @param {string} payload notifications string payload
   * @param {string} subject notifications subject
   * @param {array} variables notification string variables to replace within the payload
   */
  constructor(type, active, payload, subject, variables) {
    this.type = type;
    this.active = active;
    this.subject = subject;
    this.payload = utils.isJsonObject(payload)
      ? JSON.stringify(payload)
      : payload.toString();
    this.variables = variables;
  }
  /**
   * It translates the Notification Class to JSON Object.
   * @returns json representation
   */
  toJson() {
    return JSON.parse(
      JSON.stringify({
        type: this.type,
        active: this.active,
        subject: this.subject,
        variables: this.variables,
        payload: this.payload,
      })
    );
  }
}

/**
 * Send message to AppSync.
 * @param {*} apiId AppSync API Identifier
 * @param {Notification} notification notification class
 */
async function pushMessage(apiId, notification) {
  logger.info(
    `Pushing Notification to AppSync(${apiId}): ${notification.message.type}`
  );
  let mutation = notification.buildMutationStr();

  await promiseHandler.handle(executeMutation(apiId, mutation));
  logger.info('Notifiation pushed successfully');
}

/**
 * It executes a GraphQL Mutation.
 * @param {string} apiId AppSync API Identifier
 * @param {string} mutation GraphQL Mutation
 * @param {*} input
 * @returns mutation result in JSON format
 */
async function executeMutation(apiId, mutation, input) {
  try {
    await promiseHandler.handle(initializeAppSyncClient(apiId));
    let params = { mutation: gql(mutation), input };
    return await promiseHandler.handle(appsyncClient.mutate(params));
  } catch (error) {
    logger.warn('Error while trying to mutate data');
    throw error;
  }
}

/**
 * It initializes the AppSync Client.
 * @param {string} apiId AppSync API Identifier
 */
async function initializeAppSyncClient(apiId) {
  logger.info('Initializing AppSync Client');
  if (!appsyncClient) {
    appsyncClient = new AWSAppSyncClient({
      url: await promiseHandler.handle(lookupGraphqlApiUrl(apiId)),
      region: region,
      auth: { type: 'AWS_IAM', credentials: sdk.aws.config.credentials },
      disableOffline: true,
    });
  }
}

/**
 * It looks up the GraphQL API URL.
 * @param {string} apiId AppSync API Identifier
 * @returns GraphQL API URL
 */
async function lookupGraphqlApiUrl(apiId) {
  logger.info('Looking up GraphQL API URL');

  let appsync = sdk.getAppSyncClient();
  let params = { apiId: apiId };
  let result = await promiseHandler.handle(
    appsync.getGraphqlApi(params).promise()
  );
  result = result.graphqlApi.uris.GRAPHQL;

  logger.info('URL:', result);
  return result;
}

module.exports = {
  Notification,
  Message,
  pushMessage,
};
