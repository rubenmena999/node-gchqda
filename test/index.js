const fs = require('fs');
const utils = require('./utils.js');
const catalog = require('./catalog.js');
const logger = require('./logger.js')(catalog.LOG_PREFIX.TRADES);
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

function getUnderlyings() {
  let underlyings = fs.readFileSync('./underlyings.json');
  return JSON.parse(underlyings);
}

let foo2 = [
  { a: 'a1', b: 'b1' },
  { a: 'a2', b: 'b2' },
];

function getTradeCalendar(trade) {
  let calendar = trade.termsheet.calendar
    ? trade.termsheet.calendar
    : trade.product.unsupportedFeatures
    ? trade.product.unsupportedFeatures.customCalendar
    : undefined;
  return calendar ? calendar : [];
}

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

let trade = {
  organizationUuid: '0af59bf4-c2bb-48c3-94b3-f2e18f8044fb',
  issuerName: 'societe',
  product: {
    external: true,
    multipricerFit: true,
    multipricerCalendarFit: true,
  },
  postTradeData: {
    distributorProductName: 'APOLLON OXY ITX 25 01 2022',
    issuePricePct: 100,
    initialNotionalPurchased: 120000,
    distributor: {
      selfExecute: false,
    },
    portfolios: [
      {
        unitUuid: '631f8746-2ae5-4b49-83c5-515aff295d5e',
        notionalInvested: 120000,
      },
    ],
  },
  lifecycle: {
    status: 'trade.status.expired',
    riskBarrierLevelBreached: false,
    payedCancelCouponIndexes: [10],
    lastFixing: [
      {
        issuerTickerCode: 'ITX SQ',
        lastFixingLevel: 27.85,
      },
    ],
  },
  termsheet: {
    isinCode: 'XS1526120446',
    commonCode: '152612044',
    maturityDate: '2022-01-25',
    issueDate: '2017-01-25',
    issueSize: 120000,
    currency: 'EUR',
    settlement: 'multipricer.cash',
    initialFixingDate: '2017-01-18',
    lastFixingDate: '2022-01-18',
    riskStrikePct: 100,
    riskBarrierType: 'multipricer.european',
    riskBarrierLevelPct: 80,
    frequency: '6m',
    underlyings: [
      {
        isinCode: 'ES0148396007',
        issuerTickerCode: 'ITX SQ',
        initialFixingLevelCurrency: 'EUR',
        initialFixing: [
          {
            observationDate: '2017-01-18',
            initialFixingLevel: 29.8061,
          },
        ],
      },
    ],
    calendar: [
      {
        index: 1,
        autocallValuationDate: '2017-07-18',
        autocallPaymentDate: '2017-07-25',
        autocallBarrierPct: 110,
        cancelCouponPct: 4.5,
        cancelCouponMemory: true,
        couponBarrierMemory: false,
        extraCancelCouponMemory: false,
      },
      {
        index: 2,
        autocallValuationDate: '2018-01-18',
        autocallPaymentDate: '2018-01-25',
        autocallBarrierPct: 110,
        cancelCouponPct: 4.5,
        cancelCouponMemory: true,
        couponBarrierMemory: false,
        extraCancelCouponMemory: false,
      },
      {
        index: 3,
        autocallValuationDate: '2018-07-18',
        autocallPaymentDate: '2018-07-25',
        autocallBarrierPct: 110,
        cancelCouponPct: 4.5,
        cancelCouponMemory: true,
        couponBarrierMemory: false,
        extraCancelCouponMemory: false,
      },
      {
        index: 4,
        autocallValuationDate: '2019-01-18',
        autocallPaymentDate: '2019-01-25',
        autocallBarrierPct: 110,
        cancelCouponPct: 4.5,
        cancelCouponMemory: true,
        couponBarrierMemory: false,
        extraCancelCouponMemory: false,
      },
      {
        index: 5,
        autocallValuationDate: '2019-07-18',
        autocallPaymentDate: '2019-07-25',
        autocallBarrierPct: 110,
        cancelCouponPct: 4.5,
        cancelCouponMemory: true,
        couponBarrierMemory: false,
        extraCancelCouponMemory: false,
      },
      {
        index: 6,
        autocallValuationDate: '2020-01-20',
        autocallPaymentDate: '2020-01-27',
        autocallBarrierPct: 110,
        cancelCouponPct: 4.5,
        cancelCouponMemory: true,
        couponBarrierMemory: false,
        extraCancelCouponMemory: false,
      },
      {
        index: 7,
        autocallValuationDate: '2020-07-20',
        autocallPaymentDate: '2020-07-27',
        autocallBarrierPct: 110,
        cancelCouponPct: 4.5,
        cancelCouponMemory: true,
        couponBarrierMemory: false,
        extraCancelCouponMemory: false,
      },
      {
        index: 8,
        autocallValuationDate: '2021-01-18',
        autocallPaymentDate: '2021-01-25',
        autocallBarrierPct: 110,
        cancelCouponPct: 4.5,
        cancelCouponMemory: true,
        couponBarrierMemory: false,
        extraCancelCouponMemory: false,
      },
      {
        index: 9,
        autocallValuationDate: '2021-07-19',
        autocallPaymentDate: '2021-07-26',
        autocallBarrierPct: 110,
        cancelCouponPct: 4.5,
        cancelCouponMemory: true,
        couponBarrierMemory: false,
        extraCancelCouponMemory: false,
      },
      {
        index: 10,
        autocallValuationDate: '2022-04-18',
        autocallPaymentDate: '2022-05-25',
        autocallBarrierPct: 80,
        cancelCouponPct: 45,
        cancelCouponMemory: true,
        couponBarrierMemory: false,
        extraCancelCouponMemory: false,
      },
    ],
  },
  issuerUuid: '54f0b149-da8e-4846-969e-fcb3216a74a9',
  reconciliation: {
    termsheet: [
      'currency',
      'settlement',
      'basketType',
      'underlyings.isinCode',
      'initialFixingDate',
      'lastFixingDate',
      'riskStrikePct',
      'riskBarrierType',
      'riskBarrierLevelPct',
      'frequency',
      'lowStrikePutSpreadPct',
      'capitalProtectedPct',
      'callParticipationPct',
      'capLevelPct',
      'bonusLevelPct',
      'putBought.putHighStrikeLevelPct',
      'putBought.putParticipationPct',
      'putBought.capFloorLevelPct',
      'callBought.callLowStrikeLevelPct',
      'callBought.callCapitalPParticipationPct',
      'callBought.capFloorLevelPct',
    ],
    calendar: ['autocallBarrierPct', 'cancelCouponPct', 'cancelCouponMemory'],
  },
  tags: ['external', 'loader'],
};

//let [pastEvents, futureEvents] = retrieveTradeCalendarEvents(trade);
//console.info('pastEvents:', JSON.stringify(pastEvents, null, 2));
//console.info('futureEvents:', JSON.stringify(futureEvents, null, 2));

let x = [{ index: 2, message: 'adios' }, { index: 5 }, { index: 3 }];

console.info(x.upsert({ index: 1, message: 'hola' }, 'index'));
console.info(x);
