const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(catalog.LOG_PREFIX.SES);
const sdk = require('../asn-aws/sdk');
const ses = sdk.getSESClient();

/**
 * It sends an email
 * @param {string} sender 'from' email address
 * @param {string} recipient 'to' email address
 * @param {string} recipientCC 'cc' email address
 * @param {string} recipientCCO 'cco' email address
 * @param {string} subject 'subject' email address
 * @param {string} bodyText 'body' as text format
 * @param {string} bodyHtml 'body' as html format
 * @returns email sent
 */
async function sendEmail(
  sender,
  recipient,
  recipientCC,
  recipientCCO,
  subject,
  bodyText,
  bodyHtml
) {
  logger.info(
    'Sending email for:',
    sender,
    recipient,
    recipientCC,
    recipientCCO,
    subject,
    bodyText,
    bodyHtml
  );

  const charset = 'UTF-8';
  var params = {
    Source: sender,
    Destination: {
      BccAddresses: Array.isArray(recipientCCO) ? recipientCCO : [recipientCCO],
      ToAddresses: Array.isArray(recipient) ? recipient : [recipient],
      CcAddresses: Array.isArray(recipientCC) ? recipientCC : [recipientCC],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: charset,
      },
      Body: {},
    },
  };
  if (bodyText) {
    params.Message.Body.Text = {
      Data: bodyText,
      Charset: charset,
    };
  }
  if (bodyHtml) {
    params.Message.Body.Html = {
      Data: bodyHtml,
      Charset: charset,
    };
  }

  let responseEmail;
  try {
    responseEmail = await ses.sendEmail(params).promise();
    logger.info('Email sent! Message: ', responseEmail);
  } catch (error) {
    logger.error('Error sending email:', error);
  }
  return responseEmail;
}

/**
 * Check if event is suitable for a SES event.
 * @param {object} event - Data bundle with context, email, etc.
 * @return {boolean} - True if SES Event.
 */
function isEmailEvent(event) {
  return (
    event &&
    event.hasOwnProperty('Records') &&
    event.Records.length == 1 &&
    event.Records[0].hasOwnProperty('eventSource') &&
    event.Records[0].eventSource == 'aws:ses' &&
    event.Records[0].eventVersion == '1.0'
  );
}

module.exports = {
  sendEmail,
  isEmailEvent,
};
