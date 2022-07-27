const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(catalog.LOG_PREFIX.SNS);
const apiError = require('../asn-api/apiError');
const sdk = require('../asn-aws/sdk');
const sns = sdk.getSNSClient();

/** Environment Variables */
const region = process.env.REGION;
const account = process.env.ACCOUNT;

/** Available Topics */
const topics = {
  MULTIPRICER: 'multipricer',
  WEBHOOK_CHAT: 'webhook-chat',
};

/** Common SNS Topic parameters */
let snsTopicParams = {
  TopicArn: `arn:aws:sns:${region}:${account}:`,
  Subject: 'RFQ',
  MessageAttributes: {},
  MessageStructure: 'string',
  Message: '',
};

/**
 * It publishes a chat message.
 * @param {*} issuers a issuer or an array of issuers
 * @param {json} message message to publish
 */
module.exports.publishChatMessage = async (webhookVariableName, message) => {
  if (webhookVariableName && message) {
    await this.publishMessage(
      topics.WEBHOOK_CHAT,
      {},
      {
        webhookVariableName: webhookVariableName,
        value: message,
      }
    );
  }
};

/**
 * It publishes a product to the SNS Multipricer Topic.
 * @param {*} issuers a issuer or an array of issuers
 * @param {json} message message to publish
 */
module.exports.publishMultipricerQuote = async (issuers, message) => {
  if (issuers && message) {
    let stringValue = Array.isArray(issuers) ? issuers : [issuers];
    let attributes = {
      issuers: {
        DataType: 'String.Array',
        StringValue: JSON.stringify(stringValue),
      },
    };
    await this.publishMessage(topics.MULTIPRICER, attributes, message);
  }
};

/**
 * It publishes a message to the given SNS Topic.
 * @param {string} topic SNS Topic
 * @param {*} attributes SNS Topic attributes
 * @param {*} message message to publish
 * @returns publication result
 */
module.exports.publishMessage = async (topic, attributes, message) => {
  logger.info('Publishing message to the Topic:', topic);
  let params = buildTopicParameters(topic, attributes, message);
  logger.info('Parameters:', JSON.stringify(params));
  return sns.publish(params).promise().then(onSuccess, onError);
};

/**
 * It builds the SNS Topic Parameters based on the given topic, attributes and message.
 * @param {string} topic SNS Topic
 * @param {*} attributes SNS Topic attributes
 * @param {*} message message to publish
 * @returns SNS Topic Parameters
 */
function buildTopicParameters(topic, attributes, message) {
  let params = { ...snsTopicParams };
  params.MessageAttributes = attributes;
  params.TopicArn += topic;
  params.Message = JSON.stringify(message);
  return params;
}

/**
 * Callback function to handle successfull SNS Publications.
 * @param {json} data publication result
 */
function onSuccess(data) {
  logger.info('Message ', data.MessageId, ' sent to the topic successfully');
}

/**
 * Callback function to handle failed SNS Publications.
 * @param {*} error error thrown
 */
function onError(error) {
  logger.error('Throwing exception ', error.code);
  throw new apiError.InternalServerError(error.message);
}
