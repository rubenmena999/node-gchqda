const fs = require('fs');
const catalog = require('./catalog.js');
const countriesCollection = catalog.MONGO_COLLECTION.COUNTRIES;
const underlyingsCollection = catalog.MONGO_COLLECTION.UNDERLYINGS;
const productsCatalogCollection = catalog.MONGO_COLLECTION.PRODUCTS_CATALOG;
const errorsCollection = catalog.MONGO_COLLECTION.ISSUER_ERRORS;
const tickerTypes = catalog.TICKER_TYPES;
const errors = catalog.ERROR_MESSAGES;

let underlyingsCatalog = [];

function readJsonLocalFile(filePath) {
  console.info('Reading local file:', filePath);
  try {
    let fileContentStr = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContentStr);
  } catch (error) {
    console.warn('File not found!');
    return undefined;
  }
}

/**
 * Singleton function to get the Underlyings Catalog.
 * @returns it returns the catalog stored locally.
 * If it does not exists locally it is requested to database.
 */
async function getUnderlyingsCatalog() {
  let underlyingsCachedLocally =
    underlyingsCatalog && underlyingsCatalog.length > 0;
  return underlyingsCachedLocally
    ? underlyingsCatalog
    : readJsonLocalFile('./underlyings.json');
}

async function translateUnderlyingsTickers(
  sourceTickerType,
  targetTickerType,
  tickersCodes,
  exchangesTickerLastName
) {
  console.info('Translating Codes:', tickersCodes.toString());

  if (!tickersCodes || Array.isArray(tickersCodes).length == 0) {
    console.warn(catalog.LOG_MESSAGES.TICKERS_LIST_IS_EMPTY);
    return tickersCodes;
  }

  if (sourceTickerType == targetTickerType) {
    console.warn(catalog.LOG_MESSAGES.TICKERS_TRANSLATION_IS_EQUAL);
    return tickersCodes;
  }

  let underlying,
    sourceTickerCode,
    targetTickerCode,
    translatedTickersCodes = [];
  underlyingsCatalog = await getUnderlyingsCatalog();

  for (let i = 0; i < tickersCodes.length; i++) {
    sourceTickerCode = tickersCodes[i];
    console.info(
      `Translating ${sourceTickerType}=${sourceTickerCode} to ${targetTickerType}`
    );
    underlying = await retrieveUnderlyingFromCatalog(
      sourceTickerType,
      sourceTickerCode
    );
    targetTickerCode = retrieveUnderlyingTickerCode(
      underlying,
      targetTickerType,
      exchangesTickerLastName
    );
    translatedTickersCodes.push(targetTickerCode);
  }

  console.info('Translation:', translatedTickersCodes);
  return translatedTickersCodes;
}

/**
 * It retrieves from the Underlyings Catalog the underlying from its ticker code.
 * @param {string} sourceTickerType source ticker code type
 * @param {string} sourceTickerCode source ticker code value
 * @returns JSON Object that represents the underlying requested
 */
async function retrieveUnderlyingFromCatalog(
  sourceTickerType,
  sourceTickerCode
) {
  let underlyingsCatalog = await getUnderlyingsCatalog();
  let underlying =
    sourceTickerType == tickerTypes.ISIN_CODE
      ? underlyingsCatalog.find((u) => u.isinCode == sourceTickerCode)
      : sourceTickerType == tickerTypes.REUTERS_CODE
      ? underlyingsCatalog.find((u) => u.reutersCode == sourceTickerCode)
      : sourceTickerType == tickerTypes.BLOOMBERG_CODE
      ? underlyingsCatalog.find((u) => u.bloombergCode == sourceTickerCode)
      : sourceTickerType == tickerTypes.MARKETSTACK_CODE
      ? underlyingsCatalog.find((u) => u.marketstackCode == sourceTickerCode)
      : undefined;

  if (!underlying) {
    console.error(errors.SOURCE_TICKER_NOT_FOUND);
  }
  return underlying;
}

/**
 * It retrieves from a given Underlying the ticker code that matches with the requeted ticker type.
 * @param {json} underlying underlying data
 * @param {string} targetTickerType target ticker type
 * @param {object} exchangesTickerLastName issuer underlyings configuration data
 * @returns target ticker code value
 */
function retrieveUnderlyingTickerCode(
  underlying,
  targetTickerType,
  exchangesTickerLastName
) {
  let targetTickerCode;

  if (targetTickerType == tickerTypes.ISIN_CODE) {
    targetTickerCode = underlying.isinCode;
  } else if (targetTickerType == tickerTypes.INVESTING_CODE) {
    targetTickerCode = underlying.investingCode;
  } else if (targetTickerType == tickerTypes.MARKETSTACK_CODE) {
    targetTickerCode = underlying.marketstackCode;
  } else if (
    targetTickerType == tickerTypes.BLOOMBERG_CODE ||
    targetTickerType == tickerTypes.REUTERS_CODE
  ) {
    let isNotAnIndex = underlying.type != catalog.UNDERLYING_TYPE.INDEX_EQUITY;
    targetTickerCode =
      targetTickerType == tickerTypes.BLOOMBERG_CODE
        ? underlying.bloombergCode
        : underlying.reutersCode;

    if (exchangesTickerLastName && isNotAnIndex) {
      console.info('Translating ticker to issuer format as:', underlying.type);

      let tickerLastName = exchangesTickerLastName
        ? exchangesTickerLastName[underlying.marketIdentifierCode]
        : undefined;

      tickerLastName = tickerLastName
        ? tickerLastName
        : targetTickerType == tickerTypes.BLOOMBERG_CODE
        ? catalog.TICKERS_LASTNAMES.BLOOMBERG[underlying.marketIdentifierCode]
        : targetTickerType == tickerTypes.REUTERS_CODE
        ? catalog.TICKERS_LASTNAMES.REUTERS[underlying.marketIdentifierCode]
        : undefined;

      tickerLastName = Array.isArray(tickerLastName)
        ? tickerLastName[0]
        : tickerLastName;

      targetTickerCode =
        !tickerLastName || tickerLastName == ''
          ? undefined
          : targetTickerType == tickerTypes.BLOOMBERG_CODE
          ? `${targetTickerCode.split(' ')[0]} ${tickerLastName}`
          : targetTickerType == tickerTypes.REUTERS_CODE
          ? `${targetTickerCode.split('.')[0]}.${tickerLastName}`
          : undefined;
    }
  }

  if (!targetTickerCode || targetTickerCode == '') {
    console.error(errors.TARGET_TICKER_NOT_FOUND);
  }

  return targetTickerCode;
}

(async () => {
  let result;
  let issuer = JSON.parse(fs.readFileSync('./issuer.json', 'utf8'));
  let underlyingsCatalog = await getUnderlyingsCatalog();

  result = await translateUnderlyingsTickers(
    sourceTickerCode,
    targetTickerCode,
    tickersCodes,
    exchangesTickerLastName
  );

  // Ejemplo de traducción de ISINS a BLOOMBERG y Biceversa
  result = await translateUnderlyingsTickers(
    catalog.TICKER_TYPES.ISIN_CODE,
    catalog.TICKER_TYPES.BLOOMBERG_CODE,
    ['ES0113900J37', 'ES0113211835']
  );

  result = await translateUnderlyingsTickers(
    catalog.TICKER_TYPES.BLOOMBERG_CODE,
    catalog.TICKER_TYPES.ISIN_CODE,
    ['SAN SM', 'BBVA SM']
  );

  // Ejemplo de traducción de ISINS a REUTERS y Biceversa
  result = await translateUnderlyingsTickers(
    catalog.TICKER_TYPES.ISIN_CODE,
    catalog.TICKER_TYPES.REUTERS_CODE,
    ['ES0113900J37', 'ES0113211835']
  );

  result = await translateUnderlyingsTickers(
    catalog.TICKER_TYPES.REUTERS_CODE,
    catalog.TICKER_TYPES.ISIN_CODE,
    ['SAN.MC', 'BBVA.MC']
  );

  // Ejemplo de traducción de ISINS a MARKETSTACK y Biceversa
  result = await translateUnderlyingsTickers(
    catalog.TICKER_TYPES.ISIN_CODE,
    catalog.TICKER_TYPES.MARKETSTACK_CODE,
    ['ES0113900J37', 'ES0113211835']
  );

  result = await translateUnderlyingsTickers(
    catalog.TICKER_TYPES.MARKETSTACK_CODE,
    catalog.TICKER_TYPES.ISIN_CODE,
    ['SAN.BMEX', 'BBVA.BMEX']
  );

  // Ejemplo de traducción de ISINS a Issuers Ticker
  let issuerUnderlyingsConfig = issuer.capabilities.underlyings;
  result = await translateUnderlyingsTickers(
    catalog.TICKER_TYPES.ISIN_CODE,
    issuerUnderlyingsConfig.tickerType,
    ['ES0113900J37', 'ES0113211835'],
    issuerUnderlyingsConfig.stocks.exchangesTickerLastName
  );
})();
