const fs = require('fs');
const utils = require('./utils.js');
const catalog = require('./catalog.js');
const logger = require('./logger.js')(catalog.LOG_PREFIX.TRADES);
const countriesCollection = catalog.MONGO_COLLECTION.COUNTRIES;
const underlyingsCollection = catalog.MONGO_COLLECTION.UNDERLYINGS;
const productsCatalogCollection = catalog.MONGO_COLLECTION.PRODUCTS_CATALOG;
const errorsCollection = catalog.MONGO_COLLECTION.ISSUER_ERRORS;
const tickerTypes = catalog.TICKER_TYPES;
const errors = catalog.ERROR_MESSAGES;

function getUnderlyings() {
  let underlyings = fs.readFileSync('./underlyings.json');
  return JSON.parse(underlyings);
}

function find(sourceTickerType, sourceTickerCode) {
  let logId = logger.time(find.name);

  let tickerColumn;
  switch (sourceTickerType) {
    case tickerTypes.ISIN_CODE:
      tickerColumn = 'isinCode';
      break;
    case tickerTypes.REUTERS_CODE:
      tickerColumn = 'reutersCode';
      break;
    case tickerTypes.BLOOMBERG_CODE:
      tickerColumn = 'bloombergCode';
      break;
    case tickerTypes.MARKETSTACK_CODE:
      tickerColumn = 'marketstackCode';
      break;
    default:
      tickerColumn = undefined;
  }

  let underlyings = getUnderlyings();
  let underlying = tickerColumn
    ? underlyings.find((u) => u[tickerColumn] == sourceTickerCode)
    : undefined;

  if (!underlying) {
    console(errors.SOURCE_TICKER_NOT_FOUND);
  }

  logger.info('Underlying found:', JSON.stringify(underlying));
  logger.timeEnd(find.name, logId);
  return underlying;
}

function translatePricesToInternalFormat(prices, processParams) {
  let isGrouped = processParams.grouped == true;
  let isLastPrice = processParams.lastPrices == true;
  let underlying,
    underlyingPrices,
    result = isGrouped ? {} : [];

  let groupedPrices = prices.groupBy((item) => item.symbol);
  for (var marketStackSymbol of Object.keys(groupedPrices)) {
    underlying = find(catalog.TICKER_TYPES.MARKETSTACK_CODE, marketStackSymbol);
    underlyingPrices = groupedPrices[marketStackSymbol];

    if (isLastPrice) {
      underlyingPrices = [underlyingPrices.sortDesc((item) => item.date)[0]];
    }

    underlyingPricesAux = [];
    underlyingPrices.forEach((item) => {
      underlyingPricesAux.push({
        isinCode: !isGrouped ? underlying.isinCode : undefined,
        date: item.date.formatDate(),
        price: item.adj_close,
      });
    });
    underlyingPrices = isLastPrice
      ? underlyingPricesAux[0]
      : underlyingPricesAux;

    if (isGrouped) {
      result[underlying.isinCode] = underlyingPrices;
    } else {
      result = result.concat(underlyingPrices);
    }
  }

  return JSON.parse(JSON.stringify(result));

  /*let symbolsMap = new Map();
  let marketstackCode,
    isinCode,
    underlying,
    translatedPrice,
    translatedPrices = [];

  for (var i = 0; i < prices.length; i++) {
    marketstackCode = prices[i].symbol;
    isinCode = symbolsMap.get(marketstackCode);
    if (!isinCode) {
      underlying = find(catalog.TICKER_TYPES.MARKETSTACK_CODE, marketstackCode);
      isinCode = underlying ? underlying.isinCode : undefined;
      symbolsMap.set(marketstackCode, isinCode);
    }

    translatedPrice = {
      isinCode: isinCode,
      date: prices[i].date.formatDate(),
      price: prices[i].adj_close,
    };
    translatedPrices.push(translatedPrice);
  }
  return processParams.grouped == true
    ? groupPricesByIsin(translatedPrices)
    : translatedPrices;*/
}

/**
 * It implements the method groupBy for Arrays.
 * @param {function} funcProp function that contains the groupBy filter statement
 * @returns array groupd by the funcProp
 */
/*Array.prototype.groupBy = function (getAttributeFunction) {
  let attribute,
    groupedElements = {};
  this.forEach((input) => {
    attribute = getAttributeFunction(input);
    groupedElements[attribute] = groupedElements[attribute]
      ? groupedElements[attribute].concat(input)
      : [].concat(input);
  });
  return groupedElements;
};*/

let prices = [
  {
    open: 246.15,
    high: 248.9,
    low: 243.45,
    close: 244.25,
    volume: 781165,
    adj_high: null,
    adj_low: null,
    adj_close: 244.25,
    adj_open: null,
    adj_volume: null,
    split_factor: 1,
    dividend: 0,
    symbol: 'ADS.XETRA',
    exchange: 'XETRA',
    date: '2022-01-10T00:00:00+0000',
  },
  {
    open: 249.35,
    high: 258.15,
    low: 249.25,
    close: 254.75,
    volume: 1059329,
    adj_high: null,
    adj_low: null,
    adj_close: 254.75,
    adj_open: null,
    adj_volume: null,
    split_factor: 1,
    dividend: 0,
    symbol: 'ADS.XETRA',
    exchange: 'XETRA',
    date: '2022-01-11T00:00:00+0000',
  },
  {
    open: 4,
    high: 4.55,
    low: 4.4,
    close: 4,
    volume: 626174,
    adj_high: null,
    adj_low: null,
    adj_close: 4,
    adj_open: null,
    adj_volume: null,
    split_factor: 1,
    dividend: 0,
    symbol: 'SAN.BMEX',
    exchange: 'BMEX',
    date: '2022-01-12T00:00:00+0000',
  },
];

let processParams = { grouped: false, lastPrices: true };

//console.info(prices.groupBy((item) => item.symbol));

console.info(translatePricesToInternalFormat(prices, processParams));
