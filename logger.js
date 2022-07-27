const catalog = require('./catalog.js');
const LOG_LEVEL = process.env.LOG_LEVEL
  ? process.env.LOG_LEVEL.toUpperCase()
  : 'INFO';

var logger; // Singleton Variable

/**
 * Logger Wrapper to print console logs based on the LOG LEVEL set up.
 */
class Logger {
  /**
   * Constructor
   * @param {string} logPrefix prefix
   */
  constructor(logPrefix) {
    this.timerLogPrefix = this.formatLogPrefix(catalog.LOG_PREFIX.TIMER);
    logPrefix = this.formatLogPrefix(logPrefix);
    if (logPrefix) {
      this.logPrefix = ` ${logPrefix.toLowerCase()}`;
    } else {
      console.warn(catalog.LOG_MESSAGESLOG_PREFIX_NOT_EXIST);
      this.logPrefix = ` ${catalog.LOG_PREFIX.UNDEFINED}`;
    }
    this.stargingTimePrefix = ` Starting  '${this.logPrefix
      .trim()
      .toLowerCase()}`;
    this.finishedTimePrefix = ` Finished  '${this.logPrefix
      .trim()
      .toLowerCase()}`;
  }

  /**
   * It builds the log prefix
   * @param {string} prefix prefix
   */
  formatLogPrefix(logPrefix) {
    logPrefix = logPrefix.padEnd(
      catalog.LOG_PREFIX_MAX_LENGTH,
      catalog.SYMBOLS.SPACE
    );
    logPrefix = logPrefix.substring(0, catalog.LOG_PREFIX_MAX_LENGTH);
    return logPrefix;
  }

  /**
   * It retrieves the current log level
   * @returns LOG_LEVEL
   */
  functiongetLogLevel() {
    return this.LOG_LEVEL;
  }

  /**
   * It builds a message composed by all the given arguments
   * @param {*} arguments arguments
   */
  buildMessage() {
    let argumentsArray = arguments[0];
    let message = '';
    for (var i in argumentsArray) {
      message = `${message} ${argumentsArray[i]}`;
    }
    return message;
  }

  /**
   * It initiates timer for the guiven task name.
   * @param {string} taskName task name
   */
  time(taskName) {
    if (LOG_LEVEL == 'TRACE') {
      let executionId = Math.floor(100000 + Math.random() * 900000);
      console.info(
        ` ${this.timerLogPrefix}  ${executionId} ${this.stargingTimePrefix}.${taskName}'`
      );
      console.time(
        ` ${this.timerLogPrefix}  ${executionId} ${this.finishedTimePrefix}.${taskName}'`
      );
      return executionId;
    }
  }

  /**
   * It prints the elapsed time from the execution of the method 'time'.
   * @param {string} taskName task name
   */
  timeEnd(taskName, executionId) {
    if (LOG_LEVEL == 'TRACE') {
      console.timeEnd(
        ` ${this.timerLogPrefix}  ${executionId} ${this.finishedTimePrefix}.${taskName}'`
      );
    }
  }

  /**
   * It resets the console timers.
   */
  timeClear() {
    if (LOG_LEVEL == 'TRACE') {
      console._times.clear();
    }
  }

  /**
   * It prints a trace only if the Log Level is TRACE.
   * @param {string} logPrefix prefix
   */
  trace() {
    if (LOG_LEVEL == 'TRACE') {
      console.info(this.logPrefix, this.buildMessage(arguments));
    }
  }

  /**
   * It prints a trace only if the Log Level is TRACE or INFO.
   * @param {string} logPrefix prefix
   */
  info() {
    if (['TRACE', 'INFO'].includes(LOG_LEVEL)) {
      console.info(this.logPrefix, this.buildMessage(arguments));
    }
  }

  /**
   * It prints a trace only if the Log Level is TRACE, WARN or ERROR.
   * @param {string} logPrefix prefix
   */
  warn() {
    if (['TRACE', 'WARN', 'ERROR'].includes(LOG_LEVEL)) {
      console.warn(this.logPrefix, this.buildMessage(arguments));
    }
  }

  /**
   * It prints a trace only if the Log Level is TRACE or ERROR.
   * @param {string} logPrefix prefix
   */
  error() {
    if (['TRACE', 'ERROR'].includes(LOG_LEVEL)) {
      console.error(this.logPrefix, this.buildMessage(arguments));
    }
  }
}

module.exports = (logPrefix) => {
  return logger ? logger : new Logger(logPrefix);
};
