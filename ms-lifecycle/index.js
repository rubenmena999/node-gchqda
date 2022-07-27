const catalog = require('../opt/nodejs/asn-common/catalog.js');
const logger = require('../opt/nodejs/asn-common/logger.js')(
  catalog.LOG_PREFIX.LIFECYCLE
);
const promiseHandler = require('../opt/nodejs/asn-common/promiseHandler.js')(
  logger
);
const trades = require('../opt/nodejs/asn-model/trades.js');
const lambda = require('../opt/nodejs/asn-aws/lambda');
const context = require('./context.js');

/** Constants */
const observationEventsTypes = catalog.EVENTS_TYPES.PRODUCT_OBSERVATION;
const marketstackFunctionName = catalog.LAMBDA_FUNCTION_NAME.MS_MARKETSTACK;
const statusTypes = catalog.TRADE_LIFECYCLE_STATUS;
const defaultSettings = catalog.NOTIFICATIONS_DEFAULT_SETTINGS;
const couponTypes = catalog.COUPON_TYPES;

/**
 * Microservice that executes the Trades Lifecycle Process.
 * @param {*} event lambda function input
 * @param {*} context lambda function context
 * @param {*} callback function to call in order to emit a HTTP Response to the client.
 */
exports.handler = function (event, context, callback) {
  lambda.controller(event, context, callback, async (request) => {
    logger.info('Executing Trades Lifecycle');

    let tradeContext,
      recipientUsersUuids,
      result = [];
    let trades = await lookupTrades(request);
    for (let i = 0; i < trades.length; i++) {
      tradeContext = new context.LifecycleContext(request, trades[i]);

      for (let i = 0; i < tradeContext.pastEvents.length; i++) {
        tradeContext.processingEvent = tradeContext.pastEvents[i];

        logger.info(
          `Processing Event ${tradeContext.processingEvent.index} for trade ${tradeContext.trade.uuid}`
        );
        await takeTradeSnapshot(tradeContext);
        await validateCorporateEvents(tradeContext);
        await validateCancelationAndMaturityCoupons(tradeContext);
        await validateBarrierCoupons(tradeContext);
        await validateGuaranteedCoupons(tradeContext);
        await validateMinCoupons(tradeContext);
        await validateTotalCouponsPayment(tradeContext);
        await validateRisk(tradeContext);

        if (tradeContext.isCanceled()) {
          break;
        }
      }

      if (tradeContext.isLiveExecution) {
        logger.info('Persisting trade lifecycle results');
        let tradeToUpdate = { ...tradeContext.trade };
        delete tradeToUpdate.uuid;
        delete tradeToUpdate.creationDate;
        await promiseHandler.handle(
          trades.putTrade(tradeContext.trade.uuid, tradeToUpdate)
        );

        logger.info(
          'Sending notifications to users:',
          tradeContext.lifecycleEvents.length
        );
        recipientUsersUuids = [tradeContext.trade.asnIntermediator.userUuid];
        for (let j = 0; j < tradeContext.lifecycleEvents.length; j++) {
          tradeContext.lifecycleEvents[i].notify(
            tradeContext.trade.uuid,
            recipientUsersUuids
          );
        }
      }
      result.push(tradeContext.toJson());
    }

    logger.info('Context Summary:', tradeContext.toJson());
    result = tradeContext.isSandbox ? result[0] : result;
    response.success(callback, result);
  });
};

/**
 * It lookups the trades to process
 * @param {*} request process request
 */
async function lookupTrades(request) {
  if (request.isSandboxExecution()) {
    logger.info('SANDBOX execution: taking trade to analyze from request body');
    return [request.body];
  } else {
    logger.info(
      'LIVE execution: looking up alive and callable trades from Database'
    );
    return await trades.getTrades({
      $or: [
        { 'lifecycle.status': statusTypes.ALIVE },
        { 'lifecycle.status': statusTypes.CALLABLE },
      ],
    });
  }
}

/**
 * It builds a todays snapshot of the trades metadata and stores it into database.
 * @param {tradeContext.LifecycleContext} tradeContext trade lifecycle context
 */
async function takeTradeSnapshot(tradeContext) {
  let logId = logger.time(arguments.callee.name);
  logger.info('Taking Trades Snapshot:', tradeContext.currentDate);

  let underlyingsPrices = await lambda.invoke(marketstackFunctionName, {
    traces: tradeContext.traces,
    action: 'prices',
    parameters: { grouped: true, lastPrice: true },
  });
  let tradeCalculations = trades.calculateTradeSnapshot(
    tradeContext.trade,
    underlyingsPrices
  );

  logger.info('Persisting trades snapshot into database');
  //tradeMetadata = trades.putTradesMetadata(trade.uuid, tradeRiskData)
  tradeContext.basketPerformance = tradeCalculations.basketPerformance;
  tradeContext.underlyingsData = tradeCalculations.underlyingsData;

  logger.timeEnd(arguments.callee.name, logId);
}

/**
 * It validates corporate events.
 * @param {tradeContext.LifecycleContext} tradeContext trade lifecycle context
 */
async function validateCorporateEvents(tradeContext) {
  let logId = logger.time(arguments.callee.name);
  logger.info('Validating Corporate Events');

  let initialFixing,
    initialFixingLevel,
    officialInitialFixingLevel,
    initialFixingChanged;
  let tradeUnderlying,
    tradeUnderlyings = tradeContext.trade.termsheet.underlyings;

  logger.info('Requesting Underlyings closing price at initialFixingDate');
  let underlyingsIsinCodes = tradeUnderlyings.getAttribute('isinCode');
  let underlyingsPrices = await lambda.invoke(marketstackFunctionName, {
    tracesMetadata: tradeContext.traces,
    action: 'prices',
    parameters: {
      isinCodes: underlyingsIsinCodes,
      dateFrom: tradeContext.trade.termsheet.initialFixingDate,
      dateTo: tradeContext.trade.termsheet.initialFixingDate,
      grouped: true,
      lastPrice: true,
    },
  });

  logger.info('Iterating prices to detect corporate events');
  for (var isinCode of Object.keys(underlyingsPrices)) {
    logger.info('Validating', isinCode);

    tradeUnderlying = tradeUnderlyings[isinCode];
    officialInitialFixingLevel = underlyingsPrices[isinCode].price;
    initialFixing = [...tradeUnderlying.initialFixing].sortDesc(
      (item) => item.observationDate
    )[0];
    initialFixingChanged =
      initialFixing.initialFixingLevel != officialInitialFixingLevel;
    if (
      initialFixing.observationDate.lt(tradeContext.currentDate) &&
      initialFixingChanged
    ) {
      logger.info(
        'Setting up the new initialFixingLevel change into the trade'
      );
      tradeUnderlying.initialFixing.push({
        observationDate: tradeContext.currentDate,
        initialFixingLevel: officialInitialFixingLevel,
      });

      logger.info('Setting up users notification');
      tradeContext.createEvent(
        observationEventsTypes.INITIAL_FIXING_LEVEL_CHANGE,
        [
          tradeContext.trade.postTradeData.distributorProductName,
          initialFixingLevel,
          officialInitialFixingLevel,
        ]
      );
    }
  }

  logger.timeEnd(arguments.callee.name, logId);
}

/**
 * It validates trades cancellations, maturities and coupons
 * @param {tradeContext.LifecycleContext} tradeContext trade lifecycle context
 */
async function validateCancelationAndMaturityCoupons(tradeContext) {
  let logId = logger.time(arguments.callee.name);

  let [processingEvent, pastEvents, futureEvents] = [
    tradeContext.processingEvent,
    tradeContext.pastEvents,
    tradeContext.futureEvents,
  ];

  if (tradeContext.basketPerformance >= processingEvent.autocallBarrierPct) {
    logger.info('Autocall Barrier Breached: calculating coupon payments');

    let isExtraCoupon =
      processingEvent.cancelCouponPct == 0 &&
      processingEvent.extraCancelCouponPct != 0;
    let isCouponMemory = isExtraCoupon
      ? processingEvent.extraCancelCouponMemory
      : processingEvent.cancelCouponMemory;
    let couponPct = isExtraCoupon
      ? processingEvent.extraCancelCouponPct
      : processingEvent.cancelCouponPct;
    let payedCouponsIndexes = isExtraCoupon
      ? tradeContext.trade.lifecycle.payedExtraCancelCouponIndexes
      : tradeContext.trade.lifecycle.payedCancelCouponIndexes;

    if (couponPct > 0) {
      tradeContext.addCancelCoupon(isExtraCoupon);
      if (isCouponMemory) {
        logger.info('Coupon memory is active: looking up unpayed coupons');
        pastEvents
          .filter((event) => !payedCouponsIndexes.includes(event.index))
          .forEach((unpayedCouponEvent) => {
            tradeContext.addCancelCoupon(
              isExtraCoupon,
              unpayedCouponEvent.index
            );
          });
      }
    }

    logger.info('Trade early redeemed at event index:', processingEvent.index);
    tradeContext.setTradeEarlyRedeemed();
  }

  if (futureEvents.length == 0) {
    tradeContext.setTradeExpired();
  }
  if (tradeContext.isCanceled()) {
    tradeContext.createEvent(
      observationEventsTypes.COUPONS_PAYMENT_AT_EARLY_REDEEM,
      []
    );
  } else if (tradeContext.isExpired()) {
    tradeContext.setLastFixingLevel();
    tradeContext.setIntrinsicValueAtMaturity();
    tradeContext.createEvent(
      observationEventsTypes.COUPONS_PAYMENT_AT_MATURITY,
      []
    );
  }

  logger.timeEnd(arguments.callee.name, logId);
}

/**
 * It validates trades barrier coupons.
 * @param {tradeContext.LifecycleContext} tradeContext trade lifecycle context
 */
async function validateBarrierCoupons(tradeContext) {
  let logId = logger.time(arguments.callee.name);

  logger.info("Iterating past events to validate 'barrier coupons' payments");
  let trade = tradeContext.trade;

  if (
    tradeContext.basketPerformance >=
    tradeContext.processingEvent.couponBarrierLevelPct
  ) {
    logger.info(
      'Coupon Barrier Breached: setting up trades barrier coupons indexes'
    );
    tradeContext.addBarrierCoupon();

    if (tradeContext.processingEvent.couponBarrierMemory) {
      logger.info('Coupon memory is active: looking up unpayed coupons');
      tradeContext.pastEvents
        .filter(
          (event) =>
            !trade.lifecycle.payedCouponBarrierIndexes.includes(event.index)
        )
        .forEach((unpayedCouponEvent) => {
          tradeContext.addBarrierCoupon(unpayedCouponEvent.index);
        });
    }
    tradeContext.createEvent(observationEventsTypes.COUPONS_PAYMENT);
  }

  logger.timeEnd(arguments.callee.name, logId);
}

/**
 * It validates trades guaranteed coupons.
 * @param {tradeContext.LifecycleContext} tradeContext trade lifecycle context
 */
async function validateGuaranteedCoupons(tradeContext) {
  let logId = logger.time(arguments.callee.name);

  if (tradeContext.processingEvent.guaranteedCouponPct > 0) {
    tradeContext.addGuaranteedCoupon();
    tradeContext.createEvent(observationEventsTypes.GUARANTEED_COUPON);
  }

  logger.timeEnd(arguments.callee.name, logId);
}

/**
 * It validates trades min coupons.
 * @param {tradeContext.LifecycleContext} tradeContext trade lifecycle context
 */
async function validateMinCoupons(tradeContext) {
  let logId = logger.time(arguments.callee.name);

  let trade = tradeContext.trade;
  let processingEvent = tradeContext.processingEvent;
  let existMinCoupon = processingEvent && processingEvent.couponMinPct > 0;
  let noCancelCoupons = trade.lifecycle.payedCancelCouponIndexes.length == 0;
  let noBarrierCoupons = trade.lifecycle.payedCouponBarrierIndexes.length == 0;
  if (existMinCoupon && noBarrierCoupons && noCancelCoupons) {
    tradeContext.addMinCoupon();
    tradeContext.createEvent(observationEventsTypes.MIN_COUPON);
  }

  logger.timeEnd(arguments.callee.name, logId);
}

/**
 * It validates total amount of coupons to be payed
 * @param {tradeContext.LifecycleContext} tradeContext trade lifecycle context
 */
async function validateTotalCouponsPayment(tradeContext) {
  let logId = logger.time(arguments.callee.name);

  let trade = tradeContext.trade;
  let calendar = tradeContext.calendar;
  let cancelCouponTotalPct = trades.sumPayedCoupons(
    trade,
    calendar,
    couponTypes.CANCEL_COUPON
  );
  let extraCancelCouponTotalPct = trades.sumPayedCoupons(
    trade,
    calendar,
    couponTypes.EXTRA_CANCEL_COUPON
  );
  let barrierCouponTotalPct = trades.sumPayedCoupons(
    trade,
    calendar,
    couponTypes.BARRIER_COUPON
  );
  let guaranteedCouponTotalPct = trades.sumPayedCoupons(
    trade,
    calendar,
    couponTypes.GUARANTEED_COUPON
  );
  let minCouponTotalPct = trades.sumPayedCoupons(
    trade,
    calendar,
    couponTypes.MIN_COUPON
  );
  let totalCoupons =
    minCouponTotalPct +
    guaranteedCouponTotalPct +
    barrierCouponTotalPct +
    cancelCouponTotalPct +
    extraCancelCouponTotalPct;

  if (totalCoupons == 0) {
    tradeContext.createEvent(observationEventsTypes.NO_COUPONS_PAYMENT);
  } else if (tradeContext.isCanceled()) {
    tradeContext.createEvent(
      observationEventsTypes.COUPONS_PAYMENT_AT_EARLY_REDEEM
    );
  } else if (tradeContext.isExpired()) {
    tradeContext.createEvent(
      observationEventsTypes.COUPONS_PAYMENT_AT_MATURITY
    );
  }

  logger.timeEnd(arguments.callee.name, logId);
}

/**
 * It validates trades risk.
 * @param {tradeContext.LifecycleContext} tradeContext trade lifecycle context
 */
async function validateRisk(tradeContext) {
  let logId = logger.time(arguments.callee.name);
  logger.info('Validating Risks Events');

  if (
    (!tradeContext.isCanceled() && tradeContext.isContinuous()) ||
    tradeContext.isAmerican() ||
    tradeContext.trade.termsheet.lastFixingDate == context.currentDate
  ) {
    if (tradeContext.isAtRisk()) {
      tradeContext.setBarrierBreached();
      tradeContext.createEvent(observationEventsTypes.AT_RISK, [
        tradeContext.trade.termsheet.isinCode,
        tradeContext.trade.postTradeData.distributorProductName,
        tradeContext.trade.termsheet.riskBarrierType,
        tradeContext.trade.termsheet.riskBarrierLevelPct,
      ]);
    } else if (
      tradeContext.isEuropean() &&
      tradeContext.isBarrierBreached() &&
      tradeContext.isOutOfRisk()
    ) {
      tradeContext.createEvent(observationEventsTypes.OUTOF_RISK, [
        tradeContext.trade.termsheet.isinCode,
        tradeContext.trade.postTradeData.distributorProductName,
        defaultSettings.OUTOF_RISK_THRESHOLD_PCT,
        tradeContext.trade.termsheet.riskBarrierLevelPct,
      ]);
    }
  }

  logger.timeEnd(arguments.callee.name, logId);
}
