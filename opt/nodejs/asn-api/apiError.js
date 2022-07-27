const utils = require('../asn-common/utils.js');
const catalog = require('../asn-common/catalog.js');
const logger = require('../asn-common/logger.js')(catalog.LOG_PREFIX.API_ERROR);

/**
 * HTTP Status Error Codes and Messages
 */
const httpError = {
  badRequest: { statusCode: 400, message: 'Bad Request' },
  badRequestBody: { statusCode: 400, message: 'Bad Request Body' },
  badRequestParameters: { statusCode: 400, message: 'Bad Request Parameters' },
  resourceForbidden: { statusCode: 403, message: 'Forbidden' },
  resourceNotFound: { statusCode: 404, message: 'Resource Not Found' },
  methodNotAllowed: { statusCode: 405, message: 'Method Not Allowed' },
  resourceConflict: { statusCode: 409, message: 'Conflict' },
  unprocessableEntity: { statusCode: 422, message: 'Unprocessable Entity' },
  tooManyRequests: { statusCode: 429, message: 'Too Many Requests' },
  internalServerError: { statusCode: 500, message: 'Internal Server Error' },
};

/**
 * Custom Errors.
 */
class APIError extends Error {
  /**
   * It wraps the given error as an APIError Instance.
   * @param {*} error API Error Instance
   */
  static throwError(error) {
    if (error instanceof this) {
      throw error;
    }
    if (error.code) {
      throw this.throw(error.code);
    }
    throw new InternalServerError();
  }

  /**
   * It throws a custom error based on its http status code.
   * @param {integer} httpCode http error code
   * @param {string} technicalMessage technical error message for developers
   * @param {stirng} customerMessage error message for the customer
   */
  static throw(statusCode, technicalMessage, customerMessage) {
    switch (parseInt(statusCode)) {
      case httpError.badRequest.statusCode:
        throw new BadRequest(technicalMessage, customerMessage);
      case httpError.resourceForbidden.statusCode:
        throw new ResourceForbidden(technicalMessage, customerMessage);
      case httpError.resourceNotFound.statusCode:
        throw new ResourceNotFound(technicalMessage, customerMessage);
      case httpError.methodNotAllowed.statusCode:
        throw new MethodNotAllowed(technicalMessage, customerMessage);
      case httpError.resourceConflict.statusCode:
        throw new ResourceConflict(technicalMessage, customerMessage);
      case httpError.tooManyRequests.statusCode:
        throw new TooManyRequests(technicalMessage, customerMessage);
      default:
        throw new InternalServerError(technicalMessage, customerMessage);
    }
  }

  /**
   * Constructor.
   * @param {integer} httpError http error
   * @param {string} technicalMessage technical error message for developers
   * @param {stirng} customerMessage error message for the customer
   */
  constructor(httpError, technicalMessage, customerMessage) {
    super(
      customerMessage
        ? httpError.message.concat(': ', customerMessage)
        : technicalMessage
        ? httpError.message.concat(': ', technicalMessage)
        : httpError.message
    );
    this.technicalMessage = technicalMessage;
    this.code = httpError.statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * The server cannot process the request due to an apparent client error
 * (e.g., malformed request syntax, size too large, invalid request message framing,
 * or deceptive request routing)
 */
class BadRequest extends APIError {
  constructor(technicalMessage, customerMessage) {
    super(httpError.badRequest, technicalMessage, customerMessage);
  }
}

/**
 * The server cannot process the request due to an apparent client error, due to
 * invalid body syntax.
 */
class BadRequestBody extends APIError {
  static defaultMessage = 'Invalid body properties';
  constructor(technicalMessage, customerMessage) {
    super(httpError.badRequestBody, technicalMessage, customerMessage);
  }
}

/**
 * The server cannot process the request due to an apparent client error, due to
 * invalid query parameters.
 */
class BadRequestParameters extends APIError {
  static defaultMessage = 'Invalid request parameters';
  constructor(technicalMessage, customerMessage) {
    super(httpError.badRequestParameters, technicalMessage, customerMessage);
  }
}

/**
 * The request contained valid data and was understood but the server is refusing action.
 * This may be due to the user does not have the necessary permissions.
 */
class ResourceForbidden extends APIError {
  constructor(technicalMessage, customerMessage) {
    super(httpError.resourceForbidden, technicalMessage, customerMessage);
  }
}

/**
 * The requested resource could not be found but may be available in the future.
 * Subsequent requests by the client are permissible.
 */
class ResourceNotFound extends APIError {
  constructor(technicalMessage, customerMessage) {
    super(httpError.resourceNotFound, technicalMessage, customerMessage);
  }
}

/**
 * A request method is not supported for the requested resource.
 */
class MethodNotAllowed extends APIError {
  constructor(technicalMessage, customerMessage) {
    super(httpError.methodNotAllowed, technicalMessage, customerMessage);
  }
}

/**
 * Indicates that the request could not be processed because of conflict in the current
 * state of the resource, such as an edit conflict between multiple simultaneous updates, or
 * duplicate entries on inserting into database.
 */
class ResourceConflict extends APIError {
  constructor(technicalMessage, customerMessage) {
    super(httpError.resourceConflict, technicalMessage, customerMessage);
  }
}

/**
 * The user has sent too many requests in a given amount of time. Intended for use
 * with rate-limiting schemes.
 */
class TooManyRequests extends APIError {
  constructor(technicalMessage, customerMessage) {
    super(httpError.tooManyRequests, technicalMessage, customerMessage);
  }
}

/**
 * A generic error message, given when an unexpected condition was encountered and no more
 * specific message is suitable.
 */
class InternalServerError extends APIError {
  constructor(technicalMessage, customerMessage) {
    super(httpError.internalServerError, technicalMessage, customerMessage);
  }
}

module.exports = {
  APIError,
  BadRequest,
  BadRequestBody,
  BadRequestParameters,
  ResourceForbidden,
  ResourceNotFound,
  MethodNotAllowed,
  ResourceConflict,
  TooManyRequests,
  InternalServerError,
  httpError,
};
