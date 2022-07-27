const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(catalog.LOG_PREFIX.LAMBDA);
const apiError = require('../asn-api/apiError');
const response = require('../asn-api/response');
const httpClient = require('../asn-api/httpClient');
const utils = require('../asn-common/utils');
const sns = require('../asn-aws/sns');
const sdk = require('../asn-aws/sdk');
const lambdaClient = sdk.getLambdaClient();
const httpHeader = httpClient.HTTP_HEADER;

/**
 * Lambda Request Metadata
 */
class Request {
  /**
   * Constructor.
   * @param {json} lambda event
   * @param {json} lambda context
   */
  constructor(event, context) {
    if (!event.payload) {
      throw new apiError.InternalServerError('Invalid Request');
    }
    this.traces = this.buildTraces(event, context);
    this.action = this.validateAction(event);
    this.parameters = event.payload.parameters
      ? { ...event.payload.parameters }
      : {};
    this.body = event.payload.body ? { ...event.payload.body } : undefined;
    this.executionTime = undefined;
    this.statusCode = undefined;
    this.error = undefined;
  }

  /**
   * It validates the lambda action
   * @param {json} lambda event
   * @returns lambda action string
   */
  validateAction(event) {
    if (
      !event.payload ||
      !event.payload.action ||
      typeof event.payload.action != 'string'
    ) {
      throw new apiError.InternalServerError(
        'Lambda Action is mandatory, it has been not found or invalid'
      );
    }
    return event.payload.action;
  }

  /**
   * It builds the traces metadata.
   * @param {json} lambda event
   * @param {json} lambda context
   */
  buildTraces(event, context) {
    let result = [];
    let traces = event.payload.traces ? event.payload.traces : [];
    traces = Array.isArray(traces) ? traces : [traces];
    traces.forEach((trace) => {
      result.push(Trace.fromJson(trace));
    });
    return result.concat(new Trace(event, context));
  }

  /**
   * It check if the request is in SANDBOX mode
   * @returns true if the request is in SANDBOX mode or false if LIVE.
   */
  isSandboxExecution() {
    return this.parameters.sandbox === 'true';
  }

  /**
   * It check if the request is in LIVE mode
   * @returns true if the request is in LIVE mode or false if SANDBOX.
   */
  isLiveExecution() {
    return !this.isSandboxExecution();
  }

  /**
   * It translates the object to JSON
   * @returns json representation
   */
  toJson() {
    return JSON.parse(
      JSON.stringify({
        traces: this.traces ? JSON.parse(JSON.stringify(this.traces)) : [],
        action: this.action,
        parameters: this.parameters,
        body: this.body,
      })
    );
  }

  /**
   * It translates the object to String
   * @returns string representation
   */
  toString() {
    return JSON.stringify(this.toJson());
  }
}

/**
 * Lambda Trace Metadata.
 * This class contains the necessary metadata to trace a lambda along the system.
 */
class Trace {
  /**
   * Constructor.
   * @param {json} lambda event
   * @param {json} lambda context
   */
  constructor(event, context) {
    this.event =
      event && event.payload && event.payload.body
        ? { ...event.payload.body }
        : { ...event };
    this.lambdaRequestId =
      context && context.awsRequestId ? context.awsRequestId : undefined;
    this.lambdaFunctionName =
      context && context.functionName ? context.functionName : undefined;
    this.apiGatewayRequestId = this.event.requestContext
      ? this.event.requestContext.requestId
      : undefined;
    this.traceId = this.event.headers
      ? this.event.headers[httpHeader.AWS_TRACE_ID]
      : this.event.traceId
      ? this.event.traceId
      : undefined;
  }

  /**
   * It initializes the object from the given JSON
   * @param {json} inputJson input json
   */
  static fromJson(inputJson) {
    let trace = new Trace();
    trace.traceId = inputJson.traceId;
    trace.lambdaRequestId = inputJson.lambdaRequestId;
    trace.lambdaFunctionName = inputJson.lambdaFunctionName;
    return trace;
  }

  /**
   * It translates the object to JSON
   * @returns json representation
   */
  toJson() {
    return JSON.parse(
      JSON.stringify({
        traceId: this.traceId,
        lambdaRequestId: this.lambdaRequestId,
      })
    );
  }

  /**
   * It translates the object to String
   * @returns string representation
   */
  toString() {
    return JSON.stringify(this.toJson());
  }
}

/**
 * It invokes a lambda function.
 * @param {*} functionName lambda function name
 * @param {*} payload lambda function input payload
 * @returns lambda invocation result
 */
async function invoke(functionName, payload) {
  let logId = logger.time(arguments.callee.name);

  var params = {
    FunctionName: functionName,
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: JSON.stringify({ payload: payload }),
  };

  logger.info('Invocation params:', JSON.stringify(params));
  let result = await lambdaClient
    .invoke(params)
    .promise()
    .then(
      function (result) {
        result = result && result.Payload ? JSON.parse(result.Payload) : {};
        if ([200, 204].includes(result.statusCode)) {
          return result && result.body ? JSON.parse(result.body) : {};
        }

        logger.error(
          'Invocation finished on error with status:',
          result.statusCode
        );
        apiError.APIError.throw(result.statusCode);
      },
      function (error) {
        logger.error('Invocation finished on error:', error.code);
        throw new apiError.InternalServerError(error.message);
      }
    );

  logger.trace('Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * Generic Lambda Controller that handles the Lambda Invocations.
 * @param {json} event HTTP Request
 * @param {function} callback HTTP Response Callback Function
 * @param {string} actionFunction funtion that executes the lambda's logic
 * @param {boolean} validate false to disable validations. Default value: true
 */
async function controller(event, context, callback, actionFunction) {
  context.callbackWaitsForEmptyEventLoop = false;

  let logId = logger.time(arguments.callee.name);
  let startTime = utils.startTime();
  let tenant = process.env.TENANT
    ? process.env.TENANT.toUpperCase()
    : undefined;
  let version = process.env.VERSION ? process.env.VERSION : undefined;
  let logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : undefined;
  let request;

  try {
    logger.info(
      `Tenant: ${tenant}; Backend Version ${version}; Log Level: ${logLevel}`
    );
    logger.info('Event: ', JSON.stringify(event));
    logger.info('Context: ', JSON.stringify(context));

    if (actionFunction) {
      request = new Request(event, context);
      logger.info('Executing lambda action:', request.action);
      await actionFunction(request);
    } else {
      throw new apiError.InternalServerError('Lambda Action not implemented');
    }

    response.validateCallbackExecution(callback);
  } catch (error) {
    logger.error('Exception caught:', error.stack);

    let isHandledError = error instanceof apiError.APIError;
    let isHandledInternalServerError =
      error instanceof apiError.InternalServerError;
    if (
      isHandledInternalServerError ||
      !isHandledError ||
      error.statusCode == 500
    ) {
      logger.info('Publishing error message to webhook-chat topic');
      request.error = {
        errorCode: error.statusCode ? error.statusCode : 500,
        errorMessage: error.message,
        errorStack: error.stack,
      };
      let snsMessage = request.toJson();
      snsMessage.body = JSON.stringify(snsMessage.body);
      await sns.publishChatMessage(
        catalog.WEBHOOKS.ALERTS,
        `Backend MS Error: ${JSON.stringify(snsMessage, null, 2)}\n`
      );
    }
    response.httpError(callback, error);
  } finally {
    request.executionTime = utils.endTime(startTime);
    request.statusCode = callback.statusCode;
    logger.info(`MS Request Summary: ${request.toString()}`);
    logger.timeEnd(arguments.callee.name, logId);
    logger.timeClear();
  }
}

module.exports = {
  invoke,
  controller,
  Request,
  Trace,
};
