const moment = require('moment');
const catalog = require('../asn-common/catalog.js');
const logger = require('../asn-common/logger.js')(catalog.LOG_PREFIX.TRADES);
const utils = require('../asn-common/utils.js');

/**
 * Constants
 */
const bucketName = catalog.S3_BUCKETS_NAME.ORGANIZATIONS;
const issuersCollection = catalog.MONGO_COLLECTION.ISSUERS;
const productsCollection = catalog.MONGO_COLLECTION.PRODUCTS;
const quotesCollection = catalog.MONGO_COLLECTION.QUOTES;
const tradesCollection = catalog.MONGO_COLLECTION.TRADES;
const organizationsCollection = catalog.MONGO_COLLECTION.ORGANIZATIONS;
const mongoQueriesFiles = catalog.MONGO_QUERIES_FILES;
const productSubtypes = catalog.PRODUCT_CATALOG_SUBTYPE;
const tradeStatus = catalog.TRADE_LIFECYCLE_STATUS;
const valuatioDates = catalog.VALUATION_DATES;
const errors = catalog.ERROR_MESSAGES;
const couponTypes = catalog.COUPON_TYPES;

/**
 * It retrieves the trades calendar.
 * @param {json} trade trade
 */
function getTradeCalendar(trade) {
  let calendar = trade.termsheet.calendar
    ? trade.termsheet.calendar
    : trade.product.unsupportedFeatures
    ? trade.product.unsupportedFeatures.customCalendar
    : undefined;
  return calendar ? calendar : [];
}

/**
 * It retrieve trades calendar events separated in past and future events
 * @param {*} trade trade definition
 * @returns calendar events [pastEvents, futureEvents]
 */
function retrieveTradeCalendarEvents(trade) {
  let logId = logger.time(arguments.callee.name);

  let calendar = getTradeCalendar(trade);
  let currentDate = utils.getCurrentDateStr();

  let futureEvents = calendar.filter(
    (event) =>
      (event[valuatioDates.AUTOCALL] &&
        event[valuatioDates.AUTOCALL].gt(currentDate)) ||
      (event[valuatioDates.COUPON] &&
        event[valuatioDates.COUPON].gt(currentDate)) ||
      (event[valuatioDates.CALLABLE] &&
        event[valuatioDates.CALLABLE].gt(currentDate))
  );

  let pastEvents = calendar.filter(
    (event) =>
      (event[valuatioDates.AUTOCALL] &&
        event[valuatioDates.AUTOCALL].le(currentDate)) ||
      (event[valuatioDates.COUPON] &&
        event[valuatioDates.COUPON].le(currentDate))
  );

  pastEvents = pastEvents.sortAsc((item) => item.index);
  futureEvents = futureEvents.sortAsc((item) => item.index);

  logger.timeEnd(arguments.callee.name, logId);
  return [pastEvents, futureEvents];
}

/**
 * It calculates the trade's intrinsic value at maturity
 * @param {json} trade trade
 * @returns intrinsic value at maturity
 */
async function calculateIntrinsicValueAtMaturity(trade, performance) {
  let logId = logger.time(arguments.callee.name);

  let intrinsicValue;
  let productsCatalog = await dataCatalog.getProductsCatalog();
  let product = productsCatalog.find(
    (product) => product.uuid == trade.product.uuid
  );
  let issuePrice = trade.postTradeData.issuePricePct;
  let isCallPut = [productSubtypes.CALL, productSubtypes.PUT].includes(
    product.subtype
  );

  if (performance >= trade.termsheet.riskStrikePct || isCallPut) {
    let capitalProtected = isCallPut ? trade.termsheet.capitalProtectedPct : 1;
    let profit = calculateTradeProfit(trade, product.subtype, performance);
    intrinsicValue = issuePrice * capitalProtected + profit;
  } else {
    let riskStrike = trade.termsheet.riskStrikePct;
    let withBarrier =
      trade.termsheet.riskBarrierType != catalog.PRODUCT_BARRIER_TYPE.NOT;
    let barrierNotBreached = trade.lifecycle.riskBarrierLevelBreached == false;

    if (catalog.PRODUCT_CATALOG_INDEXES.BOOSTER_PUT_SPREAD == product.index) {
      let lowStrikePutSpread = trade.termsheet.lowStrikePutSpreadPct;
      intrinsicValue =
        issuePrice * Math.max(riskStrike * performance, lowStrikePutSpread);
    } else if (withBarrier && barrierNotBreached) {
      let bonus = trade.termsheet.bonusLevelPct
        ? trade.termsheet.bonusLevelPct
        : 0;
      let twinwinEffect = productSubtypes.TWIN_WIN
        ? trade.termsheet.putBought.putParticipationPct
        : 0;
      intrinsicValue = issuePrice + bonus + twinwinEffect;
    } else {
      let riskStrike = trade.termsheet.riskStrikePct;
      intrinsicValue = issuePrice - 1 - performance / riskStrike;
    }
  }

  logger.timeEnd(arguments.callee.name, logId);
  return intrinsicValue;
}

/**
 * It calculates the current trade's profit
 * @param {json} product product catalog
 * @param {json} trade trade
 * @param {number} performance trade's underlyings performance
 * @returns trade's profit
 */
function calculateTradeProfit(product, trade, performance) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Calculating profit for:', product.description);
  let profit;

  if (
    [
      productSubtypes.AUTOCALL,
      productSubtypes.AUTOCALL_RC,
      productSubtypes.PHOENIX,
      productSubtypes.REVERSE_CONVERTIBLE,
    ].includes(product.subtype)
  ) {
    profit = Math.max(trade.postTradeData.issuePricePct, 100);
  } else if (
    [
      productSubtypes.CALL,
      productSubtypes.TRACKER,
      productSubtypes.OUTPERFORMER,
      productSubtypes.BONUS_NOTES,
      productSubtypes.BOOSTER,
    ].includes(product.subtype)
  ) {
    let callParticipation = trade.termsheet.callBought.callParticipationPct;
    let callStrike =
      productSubtypes.CALL == product.subtype
        ? trade.termsheet.callBought.callLowStrikeLevelPct
        : 100;

    let bonus =
      trade.lifecycle.riskBarrierLevelBreached != true &&
      trade.termsheet.bonusLevelPct
        ? trade.termsheet.bonusLevelPct
        : 0;

    let cap =
      productSubtypes.CALL == product.subtype
        ? trade.termsheet.callBought.capFloorLevelPct
        : trade.termsheet.capLevelPct;

    profit =
      callParticipation *
      Math.max(bonus, Math.min(performance - callStrike, cap));
  } else if (productSubtypes.PUT == product.subtype) {
    let putParticipation = trade.termsheet.putBought.putParticipationPct;
    let putHighStrike = trade.termsheet.putBought.putHighStrikeLevelPct;
    let capFloor = trade.termsheet.putBought.capFloorLevelPct;
    profit =
      putParticipation *
      Math.max(0, putHighStrike - Math.max(performance, capFloor));
  } else if (productSubtypes.TWIN_WIN == product.subtype) {
    let callParticipation = trade.termsheet.callBought.callParticipationPct;
    profit = callParticipation * performance - 1;
  }

  logger.timeEnd(arguments.callee.name, logId);
  return profit;
}

/**
 * It performs the calculations to build a trades portfolio.
 * @param {json} trade trade
 * @returns calculations in JSON format
 */
async function calculateTradeSnapshot(trade, underlyingsPrices) {
  let logId = logger.time(arguments.callee.name);
  logger.info('Taking trades calculation snapshot for:', trade.uuid);

  let result = {};
  let productsCatalog = await dataCatalog.getProductsCatalog();
  result.productSubtype = productsCatalog.find(
    (product) => trade.product.productCatalogUuid == product.uuid
  ).subtype;
  result.nearestPeriod = retrieveNextCalendarEvent(
    trade,
    result.productSubtype
  );

  result.purchasedNotional = trade.postTradeData.initialNotionalPurchased;
  if (
    trade.postTradeData.secondaryPurchased &&
    trade.postTradeData.secondaryPurchased.length > 0
  ) {
    result.purchasedNotional = result.purchasedNotional
      ? result.purchasedNotional
      : 0;
    for (var i = 0; i < trade.postTradeData.secondaryPurchased.length; i++) {
      result.purchasedNotional +=
        trade.postTradeData.secondaryPurchased[i].notional;
    }
  }
  if (
    trade.marketData &&
    trade.marketData.secondaryMarketPrice &&
    trade.marketData.secondaryMarketPrice.length > 0
  ) {
    result.valuation = trade.marketData.secondaryMarketPrice.sort(
      (a, b) => Date.parse(b.date) - Date.parse(a.date)
    )[0].secondaryMarketPricePct;
  }
  if (
    trade.postTradeData.secondarySold &&
    trade.postTradeData.secondarySold.length > 0
  ) {
    result.purchasedNotional = result.purchasedNotional
      ? result.purchasedNotional
      : 0;
    for (var i = 0; i < trade.postTradeData.secondarySold.length; i++) {
      result.purchasedNotional -= trade.postTradeData.secondarySold[i].notional;
    }
  }

  result.basketPerformance = calculateBasketPerformance(
    trade,
    underlyingsPrices
  );
  result.couponCalendar = buildCouponCalendar(trade, result.productSubtype);
  result.underlyingsData = translateRiskAnalisys(trade, underlyingsPrices);

  if (trade.marketData) {
    if (
      trade.marketData.thirdPartyValuations &&
      trade.marketData.thirdPartyValuations.length > 0
    )
      result.thirdPartyValuations = trade.marketData.thirdPartyValuations.sort(
        (a, b) => Date.parse(b.date) - Date.parse(a.date)
      )[0].thirdPartyValuationsPricePct;
    let actualYear = new Date().getUTCFullYear();
    let secondaryMarketPriceYearBeforeList =
      trade.marketData.secondaryMarketPrice
        .filter(
          (item) => moment(item.date, 'YYYY-MM-DD').year() == actualYear - 1
        )
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    let secondaryMarketPriceYearBeforePct =
      secondaryMarketPriceYearBeforeList != null &&
      secondaryMarketPriceYearBeforeList.length > 0
        ? secondaryMarketPriceYearBeforeList[0].secondaryMarketPricePct
        : 0;
    //TODO Manuel:If expired, send intrinsicValueAtMaturity instead secondaryMarketPricePct
    let profitabilityData = calculateProfitability(
      trade,
      result.valuation,
      secondaryMarketPriceYearBeforePct
    );
    result.receivedCoupons = profitabilityData.receivedCoupons;
    result.accumulatedProfitability =
      profitabilityData.accumulatedProfitability;
    if (profitabilityData.profitabilityYTD) {
      result.profitabilityYTD = profitabilityData.profitabilityYTD;
    }
  }

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It performs the calculation of Trade's Basket Performance
 * @param {json} trade trade
 * @param {json} underlyingsPrices underlyings prices
 * @returns worst off level
 */
function calculateBasketPerformance(trade, underlyingsPrices) {
  let logId = logger.time(arguments.callee.name);

  let initialFixing, initialFixingLevel;
  let basketPerformance,
    underlyingPerformance,
    underlyingsPerformances = [];
  let underlyingPrice,
    underlyings = trade.termsheet.underlyings;
  if (underlyings.length == underlyingsPrices.length) {
    logger.info('Calculating underlyings performance');
    underlyings.forEach((underlying) => {
      underlyingPrice = underlyingsPrices[underlying.isinCode].price;
      initialFixing = underlying.initialFixing.sortDesc(
        (item) => item.observationDate
      )[0];
      initialFixingLevel = initialFixing.initialFixingLevel;
      underlyingPerformance = underlyingPrice / initialFixingLevel;
      underlyingsPerformances.push(underlyingPerformance);
      logger.info(
        `${underlying.isinCode} performance: ${underlyingPrice}/${initialFixingLevel} = ${underlyingPerformance}`
      );
    });

    logger.info('Calculating basket performance');
    let isWorstOf =
      trade.termsheet.basketType == catalog.PRODUCT_BASKET_TYPE.WORST;
    let isEqually =
      trade.termsheet.basketType == catalog.PRODUCT_BASKET_TYPE.EQUALLY;
    basketPerformance = isWorstOf
      ? underlyingsPerformances.min()
      : isEqually
      ? underlyingsPerformances.sum() / underlyings.length
      : undefined;
  } else {
    logger.warn(
      'Some underlyings prices could not be provided',
      JSON.stringify(underlyingsPrices)
    );
  }

  logger.info('Basket performance:', basketPerformance);
  logger.timeEnd(arguments.callee.name, logId);
  return basketPerformance;
}

/**
 * It retrieves the nearest next event from the trades calendar.
 * @param {json} trade trade
 * @param {string} productSubtype product subtype category
 * @returns nearest period
 */
function retrieveNextCalendarEvent(trade, productSubtype) {
  let logId = logger.time(arguments.callee.name);

  let result;
  let calendar = getTradeCalendar(trade);
  if (calendar && calendar.length > 0) {
    let valuationField = 'autocallValuationDate';
    switch (productSubtype) {
      case productSubtypes.PHOENIX:
        valuationField = 'couponValuationDate';
        break;
      case productSubtypes.REVERSE_CONVERTIBLE:
        valuationField = 'couponPaymentDate';
        break;
      case productSubtypes.CALLABLE:
        valuationField =
          calendar.length > 0 && calendar[0].couponValuationDate
            ? 'couponValuationDate'
            : 'callableValuationDate';
    }
    let todayDateStr = utils.getCurrentDateStr();

    let calendarSortedAsc = [...calendar].sortAsc(
      (item) => item[valuationField]
    );
    let calendarLastEvent = calendarSortedAsc[calendarSortedAsc.length - 1];
    let isExpired =
      trade.lifecycle.status == tradeStatus.EXPIRED ||
      calendarLastEvent[valuationField].le(todayDateStr);
    let isEarlyRedeemed = trade.lifecycle.status == tradeStatus.EARLY_REDEEMED;
    let observationDate = isEarlyRedeemed
      ? trade.lifecycle.earlyRedeemedDate
      : todayDateStr;
    result = isExpired
      ? calendarLastEvent
      : calendarSortedAsc.filter((event) =>
          event[valuationField].gt(observationDate)
        )[0];
  }
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It builds the coupon payment calendar from the trades calendar.
 * @param {json} trade trade
 * @param {string} productSubtype product subtype
 * @returns coupons payment calendar in JSON format
 */
function buildCouponCalendar(trade, productSubtype) {
  let logId = logger.time(arguments.callee.name);
  let couponCalendar = [];

  getTradeCalendar(trade).forEach((event) => {
    let coupon = {};
    coupon.index = event.index;
    coupon.valuationDate = event.couponValuationDate;
    coupon.paymentDate = event.couponPaymentDate;
    coupon.cancellationLevel = event.couponBarrierLevelPct;
    if (productSubtype == tradeStatus.PHOENIX && !event.guaranteedCouponPct) {
      coupon.couponBarrier = event.couponBarrierMemory
        ? event.couponBarrierPct * event.index
        : event.couponBarrierPct;
    }
    if (event.couponMinPct) {
      coupon.minCoupon = event.couponMinPct;
    }
    if (event.guaranteedCouponPct) {
      coupon.guarantedCoupon = event.guaranteedCouponPct;
    }
    if (event.extraCancelCouponPct) {
      coupon.extraCancelCoupon = event.extraCancelCouponMemory
        ? event.extraCancelCouponPct * event.index
        : event.extraCancelCouponPct;
    }
    couponCalendar.push(coupon);
  });

  logger.timeEnd(arguments.callee.name, logId);
  return couponCalendar;
}

function translateRiskAnalisys(trade, underlyingsPrices) {
  let logId = logger.time(arguments.callee.name);

  let underlyingsData = [];
  let underlying,
    underlyings = trade.termsheet.underlyings;
  if (underlyings && underlyings.length >= 0) {
    underlying = underlyings[i];

    for (var i = 0; i < underlyings.length; i++) {
      let item = {};
      let initialFixingLevel = underlying.initialFixing.sort(
        (a, b) => Date.parse(b.observationDate) - Date.parse(a.observationDate)
      )[0].initialFixingLevel;
      item.isinCode = underlying.isinCode;
      item.issuerTickerCoce = underlying.issuerTickerCode;
      let underlyingIsinCode = underlying.isinCode;
      if (underlyingsPrices[underlyingIsinCode]) {
        item.lastFixingLevel = underlyingsPrices[underlyingIsinCode];
        item.performance =
          underlyingsPrices[underlyingIsinCode].price / initialFixingLevel;
        item.actualPrice = underlyingsPrices[underlyingIsinCode].price;
        item.distanceToBarrier =
          (trade.termsheet.riskBarrierLevelPct / 100 - item.performance) /
          item.performance;
      }
      item.protection = trade.termsheet.riskBarrierLevelPct;
      item.putStrike = trade.termsheet.riskStrikePct;
      item.putStrikePrice =
        (initialFixingLevel * trade.termsheet.riskStrikePct) / 100;
      if (trade.marketData) {
        item.totalNoteDelta = trade.marketData.deltaOfNote.sort(
          (a, b) => Date.parse(b.date) - Date.parse(a.date)
        )[0].deltaOfNotePricePct;
        item.probTouchBarrier = trade.marketData.breachBarrierProbability.sort(
          (a, b) => Date.parse(b.date) - Date.parse(a.date)
        )[0].breachBarrierProbabilityPricePct;
      }
      underlyingsData.push(item);
    }

    let isEqually =
      trade.termsheet.basketType == catalog.PRODUCT_BASKET_TYPE.EQUALLY;
    if (isEqually && underlyings.length > 1) {
      let item = {};
      item.underlying = 'portfolio.riskAnalisys.basketLevel';
      item.protection = trade.termsheet.riskBarrierLevelPct;
      item.putStrike = trade.termsheet.riskStrikePct;
      item.performance =
        underlyingsData
          .map((item) => item.performance)
          .reduce((a, b) => a + b, 0) / underlyingsData.length;
      item.distanceToBarrier =
        (trade.termsheet.riskBarrierLevelPct / 100 - item.performance) /
        item.performance;
      underlyingsData.unshift(item);
    }
  }
  logger.timeEnd(arguments.callee.name, logId);
  return underlyingsData;
}

function calculateProfitability(
  trade,
  secondaryMarketPricePct,
  secondaryMarketPriceYearBeforePct
) {
  let logId = logger.time(arguments.callee.name);

  //Fun with coupons
  let result = {};
  result.receivedCoupons = this.sumCoupons(trade);
  result.accumulatedProfitability =
    (result.receivedCoupons +
      secondaryMarketPricePct -
      trade.postTradeData.issuePricePct) /
    trade.postTradeData.issuePricePct;
  if (
    secondaryMarketPriceYearBeforePct == 0 ||
    secondaryMarketPriceYearBeforePct == undefined ||
    secondaryMarketPriceYearBeforePct == null
  ) {
    result.profitabilityYTD = result.accumulatedProfitability;
  } else {
    let actualYear = new Date().getUTCFullYear();
    result.profitabilityYTD =
      (this.sumCoupons(trade, actualYear) +
        secondaryMarketPricePct -
        secondaryMarketPriceYearBeforePct) /
      secondaryMarketPriceYearBeforePct;
  }
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It adds the coupons
 * @param {*} trade trade definition
 * @param {*} calendar trades calendar
 * @param {*} couponType coupon type to add
 * @returns the coupons sum
 */
function sumPayedCoupons(trade, calendar, couponType) {
  let couponIndexes,
    couponKey,
    couponsTotal = 0;
  switch (couponType) {
    case couponTypes.CANCEL_COUPON:
      couponKey = 'cancelCouponPct';
      couponIndexes = trade.lifecycle.payedCancelCouponIndexes;
      break;
    case couponTypes.EXTRA_CANCEL_COUPON:
      couponKey = 'extraCancelCouponPct';
      couponIndexes = trade.lifecycle.payedExtraCancelCouponIndexes;
      break;
    case couponTypes.BARRIER_COUPON:
      couponKey = 'couponBarrierPct';
      couponIndexes = trade.lifecycle.payedCouponBarrierIndexes;
      break;
    case couponTypes.GUARANTEED_COUPON:
      couponKey = 'guaranteedCouponPct';
      couponIndexes = trade.lifecycle.payedGuaranteedCouponIndexes;
      break;
    case couponTypes.MIN_COUPON:
      couponKey = 'couponMinPct';
      couponIndexes = trade.lifecycle.payedCouponMinIndexes;
      break;
  }
  couponIndexes.forEach((index) => {
    couponsTotal += calendar[index][couponKey];
  });
  return couponsTotal;
}

module.exports = {
  getTradeCalendar,
  retrieveTradeCalendarEvents,
  calculateIntrinsicValueAtMaturity,
  calculateTradeSnapshot,
  sumPayedCoupons,
};
