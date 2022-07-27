const catalog = require('../opt/nodejs/asn-common/catalog.js');
const logger = require('../opt/nodejs/asn-common/logger.js')(
  catalog.LOG_PREFIX.LIFECYCLE
);
const trades = require('../opt/nodejs/asn-model/trades.js');
const utils = require('../opt/nodejs/asn-common/utils');
const event = require('./event');

/**
 * Lifecycle Context: Since all the lifecycle steps share information,
 * this common information will be sotred in this context class,
 * which will be passed through all the steps.
 */
class LifecycleContext {
  /**
   * Constructor.
   * @param {json} request request metadata
   * @param {json} trade trade definition
   */
  constructor(request, trade) {
    logger.info('Creating new Lifecycle Context for the trade:', trade.uuid);
    this.currentDate = utils.getCurrentDateStr();
    this.request = request;
    this.trade = trade;
    this.events = [];
    this.traces = request.tracesMetadata.toJson();
    this.isLiveExecution = request.isLiveExecution();
    this.isSandbox = !this.isLiveExecution;
    this.calendar = trades.getTradeCalendar(this.trade)[
      (this.pastEvents, this.futureEvents)
    ] = trades.retrieveTradeCalendarEvents(trade);
    this.processingEvent = undefined;
    this.underlyingsData = undefined;
    this.basketPerformance = undefined;
  }

  /**
   * It creates a new lifecycle event
   */
  createEvent(eventType, notificationVariables) {
    logger.info(`Adding new event ${eventType}`);
    let newEvent = new event.LifecycleEvent(
      eventType,
      notificationVariables,
      this.isSandbox
    );
    this.events.push(newEvent);
  }

  /**
   * It push into the CANCEL coupon indexes array the given array if it does not exist.
   * @param index calendar index is only mandatory if is a memory coupon
   * @param isExtra true if it is an extra cancel coupon
   */
  addCancelCoupon(isExtra, index) {
    logger.info('Cancel Coupon: adding trades cancel coupons index');
    let calendarIndex = index ? index : this.processingEvent.index;
    if (isExtra == true) {
      this.trade.lifecycle.payedExtraCancelCouponIndexes.pushIfNotExists(
        calendarIndex
      );
    } else {
      this.trade.lifecycle.payedCancelCouponIndexes.pushIfNotExists(
        calendarIndex
      );
    }
  }

  /**
   * It push into the BARRIER coupon indexes array the given array if it does not exist.
   * @param index calendar index is only mandatory if is a memory coupon
   */
  addBarrierCoupon(index) {
    logger.info('Barrier Coupon: adding trades barrier coupons index');
    let calendarIndex = index ? index : this.processingEvent.index;
    this.trade.lifecycle.payedCouponBarrierIndexes.pushIfNotExists(
      calendarIndex
    );
  }

  /**
   * It push into the GUARANTEED coupon indexes array the given array if it does not exist.
   */
  addGuaranteedCoupon() {
    logger.info('Guaranteed Coupon: adding trades guaranteed coupons index');
    this.trade.lifecycle.payedGuaranteedCouponIndexes.pushIfNotExists(
      this.processingEvent.index
    );
  }

  /**
   * It push into the MIN coupon indexes array the given array if it does not exist.
   */
  addMinCoupon() {
    logger.info('Min Coupon: adding trades guaranteed coupons index');
    this.trade.lifecycle.payedCouponMinIndexes.pushIfNotExists(
      this.processingEvent.index
    );
  }

  /**
   * It validates if the trade is canceled or not
   * @return true if the trade is canceled
   */
  isCanceled() {
    return (
      this.trade.lifecycle.status ==
      catalog.TRADE_LIFECYCLE_STATUS.EARLY_REDEEMED
    );
  }

  /**
   * It validates if the trade is expired or not
   * @return true if the trade is expired
   */
  isExpired() {
    return (
      this.trade.lifecycle.status == catalog.TRADE_LIFECYCLE_STATUS.EXPIRED
    );
  }

  /**
   * It validates if the trade has a European Barrier
   * @return true if european
   */
  isEuropean() {
    return (
      this.trade.termsheet.riskBarrierType ==
      catalog.PRODUCT_BARRIER_TYPE.EUROPEAN
    );
  }

  /**
   * It validates if the trade has a American Barrier
   * @return true if american
   */
  isAmerican() {
    return (
      this.trade.termsheet.riskBarrierType ==
      catalog.PRODUCT_BARRIER_TYPE.AMERICAN
    );
  }

  /**
   * It validates if the trade has a Continuous Barrier
   * @return true if contiuous
   */
  isContinuous() {
    return (
      this.trade.termsheet.riskBarrierType ==
      catalog.PRODUCT_BARRIER_TYPE.AMERICAN
    );
  }

  /**
   * It validates if the barrier was breached
   * @returns true if breached
   */
  isBarrierBreached() {
    return this.trade.lifecycle.riskBarrierLevelBreached;
  }

  /**
   * It validates if the trade is out of risk or not
   * @return true if it is out of risk
   */
  isOutOfRisk() {
    let riskBarrierLevelPct = this.trade.termsheet.riskBarrierLevelPct;
    let outOfRiskThreshold =
      catalog.NOTIFICATIONS_DEFAULT_SETTINGS.OUTOF_RISK_THRESHOLD_PCT;
    return this.basketPerformance - riskBarrierLevelPct > outOfRiskThreshold;
  }

  /**
   * It validates if the trade is at risk
   * @returns true if at risk
   */
  isAtRisk() {
    return this.basketPerformance < this.trade.termsheet.riskBarrierLevelPct;
  }

  /**
   * It sets the trades barrier level breached
   */
  setBarrierBreached() {
    logger.info('Setting riskBarrierLevelBreached = true');
    this.trade.lifecycle.riskBarrierLevelBreached = true;
  }

  /**
   * It sets the trades last fixing level
   */
  setLastFixingLevel() {
    logger.info('Setting lastFixingLevel');
    let lastFixing = [];
    this.underlyingsData.forEach((underlying) => {
      lastFixing.push({
        issuerTickerCode: underlying.isinCode,
        lastFixingLevel: underlying.lastFixingLevel,
      });
    });
    this.trade.lifecycle.lastFixing = lastFixing;
  }

  /**
   * It clculates and set the trades intrinsic value at maturity
   */
  async setIntrinsicValueAtMaturity() {
    logger.info('Setting intrinsic value at maturity');
    this.trade.lifecycle.intrinsicValueAtMaturity = await promiseHandler.handle(
      trades.calculateIntrinsicValueAtMaturity(
        this.trade,
        this.basketPerformance
      )
    );
  }

  /**
   * It set the trade as early redeemed
   */
  setTradeEarlyRedeemed() {
    trades.lifecycle.status = catalog.TRADE_LIFECYCLE_STATUS.EARLY_REDEEMED;
  }

  /**
   * It set the trade as expired
   */
  setTradeExpired() {
    trades.lifecycle.status = catalog.TRADE_LIFECYCLE_STATUS.EXPIRED;
  }

  /**
   * It translates the object to JSON
   * @returns json representation
   */
  toJson() {
    return JSON.parse(
      JSON.stringify({
        tradeUuid: this.trade.uuid,
        dateTime: utils.getCurrentDateTimeStr(),
        isSandbox: this.isSandbox,
        calendar: this.calendar,
        events: this.events,
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

module.exports = {
  LifecycleContext,
};
