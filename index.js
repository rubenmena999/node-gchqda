const utils = require('./utils.js');
const Decimal = require('decimal.js');
const moment = require('moment');

let test = {
  US78378X1072: [
    {
      date: '2022-07-24',
      officialClosingPrice: 3957.25,
    },
    {
      date: '2022-07-25',
      officialClosingPrice: 3957.25,
    },
    {
      date: '2022-07-26',
      officialClosingPrice: 3952,
    },
  ],
  ES0SI0000005: [
    {
      date: '2022-07-25',
      adjustedGoogleClosingPrice: 8085.6,
      officialClosingPrice: 8085.6,
    },
    {
      date: '2022-07-26',
      adjustedGoogleClosingPrice: 8069.6,
      officialClosingPrice: 8069.6,
    },
  ],
  EU0009658145: [
    {
      date: '2022-07-25',
      officialClosingPrice: 3604.16,
    },
    {
      date: '2022-07-26',
      officialClosingPrice: 3575.36,
    },
  ],
};

function getUnderlyingsNearestClosingPrice(observationDates) {
  let logPrefix = `${this.logPrefix}.${getUnderlyingsNearestClosingPrice.name}`;
  console.info(
    logPrefix,
    'Finding the nearest closing price within the interval:',
    observationDates
  );

  let priceFound,
    nearestClosingPrices = [];
  let underlyingsPrices = this.underlyingsPricesUnwinded
    ? this.underlyingsPricesUnwinded
    : [];
  underlyingsPrices = underlyingsPrices.filter((p) =>
    observationDates.includes(p.date)
  );
  underlyingsPrices = underlyingsPrices.sortAsc((p) => p.date);
  underlyingsPrices.forEach((price) => {
    priceFound = underlyingsPrices.find(
      (p) => p.isinCode == price.isinCode && p.date == price.date
    );
    if (priceFound) {
      priceFound.price =
        priceFound.date == utils.pastDate(1)
          ? priceFound.officialClosingPrice
          : utils.getJsonValue(
              () => priceFound.adjustedClosingPrice,
              true,
              priceFound.adjustedGoogleClosingPrice
            );
      if (priceFound.price) nearestClosingPrices.push({ ...priceFound });
    }
    underlyingsPrices = underlyingsPrices.filter(
      (p) => p.isinCode != price.isinCode
    );
  });

  nearestClosingPrices = nearestClosingPrices.groupBy((p) => p.isinCode);
  Object.keys(nearestClosingPrices).forEach(
    (isinCode) =>
      (nearestClosingPrices[isinCode] = nearestClosingPrices[isinCode][0])
  );
  console.info(logPrefix, 'Result:', nearestClosingPrices);
  return nearestClosingPrices;
}

console.info(
  getUnderlyingsNearestClosingPrice([
    '2022-07-23',
    '2022-07-24',
    '2022-07-25',
    '2022-07-26',
  ])
);
