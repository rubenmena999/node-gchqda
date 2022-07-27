const apiError = require('../asn-api/apiError');

/** Singleton Variable **/
var promiseHandler;

/**
 * Promise Handler
 */
class PromiseHandler {
  /**
   * Constructor.
   * @param {*} logger logger
   */
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * It validates if the input data is a promise or not.
   * @param {*} input input data
   * @returns true if the given input data is a promise
   */
  isPromise(input) {
    return typeof input === 'object' && typeof input.then === 'function';
  }

  /**
   * It validates if the input data is a function or not.
   * @param {*} input input data
   * @returns true if the given input data is a function
   */
  isFunction(input) {
    return typeof input === 'function';
  }

  /**
   * It handles the given code
   * @param {*} input could be a function or a promise
   * @returns
   */
  async handle(input, resourceNotFoundValidation) {
    let promise = this.isPromise(input)
      ? input
      : this.isFunction(input)
      ? new Promise(input)
      : undefined;

    if (promise) {
      let [result, error] = await promise
        .then((data) => [data, undefined])
        .catch((error) => [undefined, error]);
      return this.validate([result, error], resourceNotFoundValidation);
    } else {
      this.logger.warn(
        'The input is neither a promise nor a function. The same input is returned back.'
      );
      return input;
    }
  }

  /**
   * It validates the resolved promise by checking the result.
   * @returns the promise result
   */
  validate([result, error], resourceNotFoundValidation) {
    if (error && error instanceof Error) {
      this.logger.warn('Throwing exception:', error);
      throw error;
    } else if (
      resourceNotFoundValidation &&
      resourceNotFoundValidation(result)
    ) {
      throw new apiError.ResourceNotFound();
    }
    return result;
  }
}

module.exports = (logger) => {
  return promiseHandler ? promiseHandler : new PromiseHandler(logger);
};
