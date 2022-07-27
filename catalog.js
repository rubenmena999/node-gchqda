module.exports.DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
module.exports.DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DDThh:mm:ss[Z]';
module.exports.NIGHTWATCH_TAG = 'nightwatch';
module.exports.ASN_SUPPORT_EMAIL = 'support@asn-global.com';
module.exports.DOCDB_DEFAULT_LIMIT = 10;
module.exports.LOG_LEVEL = process.env.LOG_LEVEL
  ? process.env.LOG_LEVEL.toUpperCase()
  : 'INFO';
module.exports.LOG_LENGTH_MAX = process.env.LOG_LENGTH_MAX
  ? Number(process.env.LOG_LENGTH_MAX)
  : 1000;
module.exports.LOG_TRUNCATE_ENABLED =
  process.env.LOG_TRUNCATE_ENABLED === 'true' ||
  process.env.LOG_TRUNCATE_ENABLED == true;
module.exports.CACHE_REQUESTED_DATES_MAX_LENGTH = 7;
module.exports.API_MAX_SECONDS_ALERT = {
  DEFAULT: 10,
  DATA: 60,
};
module.exports.LANGUAGES = {
  SPAIN: 'ES',
  ENGLISH: 'GB',
  DEUTCH: 'DE',
};
module.exports.SYMBOLS = {
  SPACE: ' ',
  LINE_BREAK: '\n',
  LINE_TAB: '\t',
};
module.exports.TENANT_NAME = {
  DEV: 'DEV',
  TEST: 'TEST',
  PROD: 'PROD',
};
module.exports.AUDIT_SOURCE = {
  OPPORTAL: 'OPPORTAL',
  BACKEND: 'BACKEND',
};
module.exports.LOG_LEVEL_TYPES = {
  INFO: 'INFO',
  WARN: 'WARNING',
  TRACE: 'TRACE',
  ERROR: 'ERROR',
};
module.exports.LOG_PREFIX_MAX_LENGTH = 9;
module.exports.LOG_PREFIX = {
  TIMER: 'timer',
  INDEX: 'index',
  WARMUP: 'warmup',
  MARKETSTACK: 'market',
  MARKET_DATA: 'marketdata',
  ISSUERS: 'issuers',
  MORGAN: 'morgan',
  BBVA: 'bbva',
  SOCIETE: 'societe',
  BARCLAYS: 'barclays',
  MAREX: 'marex',
  CREDIT_AGRICOLE: 'creditagricole',
  GOLDMAN_SACHS: 'goldmansachs',
  JULIUS_BAER: 'juliusbaer',
  UBS: 'ubs',
  HSBC: 'hsbc',
  TRANSLATOR: 'transltr',
  EC2: 'ec2',
  SSM: 'ssm',
  SNS: 'sns',
  SES: 'ses',
  S3: 's3',
  COGNITO: 'cognito',
  DYNAMO_DB: 'ddb',
  DOCUMENT_DB: 'docdb',
  SECRETS_MANAGER: 'secret',
  SYSTEMS_MANAGER: 'ssm',
  LAMBDA: 'lambda',
  APPSYNC: 'appsync',
  API: 'api',
  API_ERROR: 'apierror',
  HTTP: 'http',
  REQUEST: 'request',
  RESPONSE: 'response',
  VALIDATOR: 'validatr',
  JSON_TRANSLATOR: 'json',
  UTILS: 'utils',
  POLICIES: 'policies',
  ORGANIZATIONS: 'orgs',
  PORTFOLIOS: 'pfolios',
  PRODUCTS: 'products',
  QUOTES: 'quotes',
  TRADES: 'trades',
  UNDERLYINGS: 'undrlyng',
  USERS: 'users',
  DATA: 'data',
  METADATA: 'metadata',
  SCHEDULER: 'scheduler',
  TESTING: 'testing',
  UUIDS: 'uuids',
  AUDITS: 'audits',
  UNDEFINED: 'undefined',
  WEBHOOK: 'webhook',
  LIFECYCLE: 'lifecycle',
  CONTEXT: 'context',
};
module.exports.EC2_INSTANCES = {
  BASTION: 'ec2-bastion',
};
module.exports.DOCUMENT_DB_CLUSTER = {
  ID: 'docdb-cluster-dev',
};
module.exports.LAMBDA_FUNCTION_NAME = {
  API_POLICIES: 'api-policies',
  API_USERS: 'api-users',
  API_ORGANIZATIONS: 'api-organizations',
  API_ORGANIZATIONS_CUSTODIAN: 'api-organizations-custodian',
  API_ORGANIZATIONS_ISSUER: 'api-organizations-issuer',
  API_ORGANIZATIONS_UNIT: 'api-organizations-unit',
  API_ORGANIZATIONS_ROLE: 'api-organizations-role',
  API_PRODUCTS: 'api-products',
  API_QUOTES: 'api-quotes',
  API_TRADES: 'api-trades',
  API_ISSUERS: 'api-issuers',
  API_DATA: 'api-data',
  MS_AUDITS: 'ms-audits',
  MS_LIFECYCLE: 'ms-lifecycle',
  MS_MARKETDATA: 'ms-marketdata',
  MS_MARKETSTACK: 'ms-marketstack',
};
module.exports.MONGO_COLLECTION = {
  USERS: 'users',
  POLICIES: 'policies',
  ORGANIZATIONS: 'organizations',
  PRODUCTS_CATALOG: 'productsCatalog',
  PRODUCTS: 'products',
  QUOTES: 'quotes',
  TRADES: 'trades',
  TRADES_METADATA: 'tradesMetadata',
  ISSUERS: 'issuers',
  COUNTRIES: 'countries',
  UNDERLYINGS: 'underlyings',
  MARKET_DATA: 'marketData',
  ISSUER_ERRORS: 'multipricerErrors',
};
module.exports.MULTIPRICER_EXECUTION_TYPE = {
  LIVE: 'live',
  SANDBOX: 'sandbox',
};
module.exports.ISSUERS = {
  SOCIETE: 'societe',
  BARCLAYS: 'barclays',
  MORGAN: 'morgan',
  MORGAN_PLC: 'morgan-plc',
  MORGAN_BV: 'morgan-bv',
  MAREX: 'marex',
  BBVA: 'bbva',
  CREDIT_AGRICOLE: 'creditagricole',
  GOLDMAN_SACHS: 'goldmansachs',
  JULIUS_BAER: 'juliusbaer',
  UBS: 'ubs',
};
module.exports.SOCIETE_STATUS = {
  REQUEST_ACCEPTED: 'Accepted',
  QUOTE_REJECTED: 'Rejected',
  QUOTE_RECEIVED: 'Quoted',
  QUOTE_FAILED: 'Failed',
};
module.exports.BARCLAYS_STATUS = {
  IN_PROGRESS: 'inProgress',
  QUOTE_REJECTED: 'fail',
  QUOTED: 'success',
};
module.exports.RFQ_STATUS = {
  NEW_REQUEST: 'newRequest',
  REQUEST_SENT: 'requestSent',
  REQUEST_ACCEPTED: 'requestAccepted',
  QUOTE_REJECTED: 'quoteRejected',
  QUOTE_RECEIVED: 'quoteReceived',
  SANDBOX: 'sandbox',
  UNKNOWN: 'unknown',
};
module.exports.UUID_NAMESPACES = {
  MONGO_COLLECTIONS: 'b0cdb69d-9f2a-42b2-82b5-ba1f41ab6e89',
};
module.exports.LOG_MESSAGES = {
  NOTHING_TO_ROLLBACK:
    'Nothing to rollback. The resource is already present, it was not deleted.',
  LOG_PREFIX_NOT_EXIST: 'The provided log prefix is undefined',
  CACHE_INTERVAL_FOUND:
    'Prices where found in cache for the given symbol and interval',
  CACHE_INTERVAL_NOT_FOUND:
    'The whole requested interval was NOT found in cache for the symbol',
  CACHE_INTERVAL_DELETION:
    'The whole interval will be removed from cache in order to be requested agian',
  TICKERS_LIST_IS_EMPTY:
    'Tickers codes cannot be translated because the tickers codes list is empty',
  TICKERS_TRANSLATION_IS_EQUAL:
    'Tickers are not translated because sourceTickerType == targetTickerType',
};
module.exports.ERROR_MESSAGES = {
  ENDPOINT_NOT_IMPLEMENTED: 'API Endpoint not implemented',
  MISSING_PATH_PARAMETER: 'Missing path parameter',
  UUID_NOT_EXIST: 'Any of the provided uuids does not exist',
  ISSUERS_NOT_PRESENT: 'Issuers are not present',
  ISSUER_CREDENTIALS_MALFORMED: 'Credentials malformed',
  BODY_MALFORMED: 'Body malformed, cannot be parsed',
  INVALID_USERNAME: 'The username must be a valid email',
  PRODUCT_CATALOG_NOT_FOUND:
    'It does not corresponds with a valid product catalog',
  PRODUCT_CATALOG_NOT_UNIQUE:
    'More than one products were found within the catalog',
  TRADE_VALIDATION_NOTIONAL:
    'The trade notional does not match with the portfolios ones',
  UNIT_PORTFOLIO_USERS_NOT_ALLOWED:
    'Users cannot be associated to portfolio units',
  FILE_MULTIPART_NOT_VALID:
    'The body must be a single form multipart file data',
  FILE_OBJECT_TYPE_NOT_VALID: 'Invalid objectType',
  FILE_CONTENT_TYPE_NOT_VALID: 'Invalid file content type',
  TRADE_ISIN_CODE_NOT_FOUND: 'Trade isinCode not found',
  SOURCE_TICKER_NOT_FOUND:
    'Source Ticker code not found within underlyings catalog',
  TARGET_TICKER_NOT_FOUND:
    'Target Ticker code not found within underlyings catalog',
  UNDERLYING_TRANSLATION_FAILED: 'The ticker code translation failed',
};
module.exports.MONGO_QUERIES_FILES = {
  ORGANIZATION_TREE: '/opt/nodejs/asn-queries/organizationsTree.json',
  USER_ORGANIZATIONS_UNITS:
    '/opt/nodejs/asn-queries/userOrganizationsUnits.json',
  USER_PORTFOLIOS_TRADES: '/opt/nodejs/asn-queries/userPortfoliosTrades.json',
  ISSUERS_SELECTION: '/opt/nodejs/asn-queries/issuersSelection.json',
  ISSUERS_ACTIVITY: '/opt/nodejs/asn-queries/issuersActivity.json',
  QUOTES_EAGER: '/opt/nodejs/asn-queries/quotesEager.json',
  QUOTES_SEARCH: '/opt/nodejs/asn-queries/quotesSearch.json',
  QUOTES_SEARCH_OPTIMIZED: '/opt/nodejs/asn-queries/quotesSearchOptimized.json',
  /** borrar */
  USER_QUOTES_EAGER: '/opt/nodejs/asn-queries/userQuotesEager.json',
  USER_QUOTES_GROUPED: '/opt/nodejs/asn-queries/userQuotesGrouped.json',
  USER_QUOTES_OPTIMIZED_GROUPED:
    '/opt/nodejs/asn-queries/userQuotesOptimizedGrouped.json',
  USER_QUOTES_OPTIMIZED_GROUPED_DELETION:
    '/opt/nodejs/asn-queries/userQuotesOptimizedDeletion.json',
  USER_QUOTES_GROUPED_DELETION:
    '/opt/nodejs/asn-queries/userQuotesDeletion.json',
  /** borrar */
  ALIVE_TRADES_UNDERLYINGS:
    '/opt/nodejs/asn-queries/aliveTradesUnderlyings.json',
  ALIVE_TRADES_PORTFOLIOS: '/opt/nodejs/asn-queries/aliveTradesPortfolios.json',
};
module.exports.MONGO_COLLECTIONS = {
  AUDITS: 'audits',
  POLICIES: 'policies',
  ORGANIZATIONS: 'organizations',
  PRODUCTS_CATALOG: 'productsCatalog',
  PRODUCTS: 'products',
  QUOTES: 'quotes',
  TRADES: 'trades',
  ISSUERS: 'issuers',
  COUNTRIES: 'countries',
  UNDERLYINGS: 'underlyings',
};
module.exports.ORGANIZATIONS_CLASS = {
  ASN: 'organizations.class.asn',
  DISTRIBUTOR: 'organizations.class.distributor',
  SUB_DISTRIBUTOR: 'organizations.class.subdistributor',
};
module.exports.ORGANIZATIONS_UNIT_CLASS = {
  ROOT: 'organizations.unit.class.root',
  DISTRIBUTOR: 'organizations.unit.class.distributor',
  SUB_DISTRIBUTOR: 'organizations.unit.class.subdistributor',
  PORTFOLIO: 'organizations.unit.class.portfolio',
  UNIT: 'organizations.unit.class.unit',
};
module.exports.DOCUMENTS = {
  KID: 'general.kid',
  TERMSHEET: 'general.termsheet',
  TARGET_MARKET: 'general.targetMarket',
};
module.exports.PROCESS_TYPE = {
  AUTO: 'general.auto',
  MANUAL: 'general.manual',
};
module.exports.CONNECTION_TYPE = {
  EMAIL: 'connection.type.email',
  API: 'connection.type.api',
  FIX: 'connection.type.fix',
};
module.exports.TRADE_LIFECYCLE = {
  PRE_TRADE: 'trade.lifecycle.preTrade',
  TRADE: 'trade.lifecycle.trade',
  POST_TRADE: 'trade.lifecycle.postTrade',
};
module.exports.CURRENCIES = {
  EUR: 'EUR',
  USD: 'USD',
  GBP: 'GBP',
  CHF: 'CHF',
};
module.exports.TICKER_TYPES = {
  ISIN_CODE: 'underlying.tickerType.isinCode',
  REUTERS_CODE: 'underlying.tickerType.reutersCode',
  BLOOMBERG_CODE: 'underlying.tickerType.bloombergCode',
  INVESTING_CODE: 'underlying.tickerType.investing',
  MARKETSTACK_CODE: 'underlying.tickerType.marketstackCode',
};
module.exports.ISSUERS_CODES = {
  ISIN: 'issuers.codes.isin',
  COMMON: 'issuers.codes.common',
  WKN: 'issuers.codes.wkn',
  SWX: 'issuers.codes.swx',
  VALOREN: 'issuers.codes.valoren',
  RIC: 'issuers.codes.ric',
  BLOOMBERG: 'issuers.codes.bloomberg',
};
module.exports.CLEARING_HOUSES = {
  EUROCLEAR: 'clearingHouses.euroclear',
  CLEARSTREAM: 'clearingHouses.clearstream',
  CEDEL: 'clearingHouses.cedel',
  SIX: 'clearingHouses.six',
};
module.exports.RATING_AGENCIES = {
  STANDARD_AND_POORS: 'rating.agencies.sp',
  MOODYS: 'rating.agencies.moodys',
  FITCH: 'rating.agencies.fitch',
};
module.exports.VALUATION_AGENCIES = {
  BLOOMBERG: 'valuation.agencies.bloomberg',
  TELEKURS: 'valuation.agencies.telekurs',
  REUTERS: 'valuation.agencies.reuters',
};
module.exports.ISSUERS_SPECIAL_CAPABILITIES = {
  BARRIER_ONE_STAR: 'issuers.specialCapabilities.barrierOneStar',
  STRIKE_MIN: 'issuers.specialCapabilities.strikeMin',
};
module.exports.PRODUCT_SETTLEMENT = {
  CASH: 'multipricer.cash',
  PHYSHICAL: 'multipricer.physical',
  CASH_OR_PHYSHICAL: 'multipricer.cashOrPhysical',
};
module.exports.PRODUCT_STRIKE_TYPE = {
  TODAY_AT_CLOSE: 'multipricer.todayAtClose',
  ISSUE_DATE: 'multipricer.issueDate',
  LIVE: 'multipricer.live',
  MINIMUM: 'multipricer.minimun',
  CUSTOM: 'multipricer.custom',
};
module.exports.PRODUCT_BASKET_TYPE = {
  WORST: 'multipricer.worst',
  BEST: 'multipricer.best',
  EQUALLY: 'multipricer.equally',
};
module.exports.PRODUCT_BARRIER_TYPE = {
  NOT: 'multipricer.not',
  AMERICAN: 'multipricer.american',
  EUROPEAN: 'multipricer.european',
  CONTINUOUS: 'multipricer.continous',
};
module.exports.PRODUCT_SOLVER_FOR = {
  REOFFER: 'multipricer.reoffer',
  UPFRONT: 'multipricer.upfront',
  COUPON_PCT: 'multipricer.couponPct',
  RISK_BARRIER_LEVEL_PCT: 'multipricer.riskBarrierLevelPct',
  AUTOCALL_BARRIER_PCT: 'multipricer.autocallBarrierPct',
  RISK_STRIKE_PCT: 'multipricer.riskStrikePct',
  CALL_PARTICIPATION_PCT: 'multipricer.callParticipationPct',
  CAP_LEVEL_PCT: 'multipricer.capLevelPct',
  BONUS: 'multipricer.bonus',
  CALL_LEVEL_CALL_PUT: 'multipricer.callLevelCallPut',
  PUT_LEVEL_CALL_PUT: 'multipricer.putLevelCallPut',
  CAP_LEVEL_CALL_PUT: 'multipricer.capLevelCallPut',
  FLOOR_LEVEL_CALL_PUT: 'multipricer.floorLevelCallPut',
};
module.exports.PRODUCT_FREQUENCY = {
  ONE_MONTHS: '1m',
  TWO_MONTHS: '2m',
  THREE_MONTHS: '3m',
  SIX_MONTHS: '6m',
  TWELVE_MONTHS: '12m',
  AT_EXPIRY: 'multipricer.atExpiry',
  DISCOUNT: 'multipricer.discount',
  PERIODICALLY: 'multipricer.periodPayment',
};
module.exports.PRODUCT_COUPON_PERIOD = {
  NOMINAL: 'multipricer.nominal',
  ANNUAL: 'multipricer.annual',
};
module.exports.PRODUCT_COUPON_TYPE = {
  GUARANTEED: 'multipricer.guaranteed',
  CONDITIONAL: 'multipricer.conditional',
};
module.exports.PRODUCT_COUPON_BARRIER = {
  REDEMPTION_LEVEL: 'multipricer.redemptionLevel',
  COUPON_BARRIER_PCT: 'multipricer.couponBarrierPct',
};
module.exports.VALUATION_DATES = {
  AUTOCALL: 'autocallValuationDate',
  CALLABLE: 'callableValuationDate',
  COUPON: 'couponValuationDate',
};
module.exports.COUPON_TYPES = {
  CANCEL_COUPON: 'coupons.cancel',
  EXTRA_CANCEL_COUPON: 'coupons.extraCancelCoupon',
  BARRIER_COUPON: 'coupons.barrierCoupon',
  GUARANTEED_COUPON: 'coupons.guaranteedCoupons',
  MIN_COUPON: 'coupons.minCoupon',
};
module.exports.SEARCH_RANGE_QUOTES_DEFAULT = 'general.search.range.last10';
module.exports.SEARCH_RANGE = {
  LAST_TEN: 'general.search.range.last10',
  LAST_DAY: 'general.search.range.1d',
  LAST_WEEK: 'general.search.range.1w',
  LAST_MONTH: 'general.search.range.1m',
  LAST_YEAR: 'general.search.range.1y',
};
module.exports.UNDERLYING_TYPE = {
  SHARE_ORDINARY: 'underlying.type.shareOrdinary',
  INDEX_EQUITY: 'underlying.type.indexEquity',
  ETF: 'underlying.type.etf',
  ADR: 'underlying.type.adr',
};
module.exports.CLIENT_TYPE = {
  RETAIL: 'client.type.retail',
  PROFESSIONAL: 'client.type.professional',
  ELIGIBLE: 'client.type.eligible',
};
module.exports.PRODUCT_CATALOG_GROUP = {
  AUTOCALL_PHOENIX_CALLABLE: 'product.group.autocallPhoenixCallable',
  REVERSE_CONVERTIBLE: 'product.group.reverseConvertible',
  TRACKER_OUTPERFORMER_BONUS_BOOSTER:
    'product.group.trackerOutperformerBonusBooster',
  CALL_PUT: 'product.group.callput',
  TWIN_WIN: 'product.group.twinwin',
  CLN: 'product.group.cln',
};
module.exports.PRODUCT_CATALOG_TYPE = {
  YIELD: 'product.type.yield',
  PARTICIPATION: 'product.type.participation',
};
module.exports.PRODUCT_CATALOG_SUBTYPE = {
  AUTOCALL: 'product.subtype.autocall',
  AUTOCALL_RC: 'product.subtype.autocallrc',
  PHOENIX: 'product.subtype.phoenix',
  CALLABLE: 'product.subtype.callable',
  CALLABLE_RC: 'product.subtype.callablerc',
  REVERSE_CONVERTIBLE: 'product.subtype.reverseConvertible',
  TRACKER: 'product.subtype.tracker',
  OUTPERFORMER: 'product.subtype.outperformer',
  BONUS_NOTES: 'product.subtype.bonusNotes',
  BOOSTER: 'product.subtype.booster',
  CALL: 'product.subtype.call',
  PUT: 'product.subtype.put',
  TWIN_WIN: 'product.subtype.twinwin',
  CLN: 'product.subtype.cln',
};
module.exports.PRODUCT_CATALOG_INDEXES = {
  AUTOCALL_CC: 1,
  AUTOCALL_CCM: 2,
  AUTOCALL_CC_MC: 3,
  AUTOCALL_CCM_MC: 4,
  PHOENIX_BC: 5,
  PHOENIX_BCM: 6,
  PHOENIX_BC_MC: 7,
  PHOENIX_BCM_MC: 8,
  PHOENIX_BC_CC: 9,
  PHOENIX_BC_CCM: 10,
  PHOENIX_BCM_CC: 11,
  PHOENIX_BCM_CCM: 12,
  PHOENIX_BC_MC_CC: 13,
  PHOENIX_BC_MC_CCM: 14,
  REVERSE_CONVERTIBLE_AUTOCALL: 15,
  REVERSE_CONVERTIBLE_AUTOCALL_ECC: 16,
  REVERSE_CONVERTIBLE_AUTOCALL_ECCM: 17,
  TWIN_WIN: 18,
  TRACKER: 19,
  OUTPERFORMER: 20,
  BONUS_NOTES: 21,
  BONUS_NOTES_CAP: 22,
  BOOSTER_PUT_SPREAD: 23,
  BOOSTER_LEV_PUT: 24,
  BOOSTER_ATM_PUT: 25,
  CALL: 26,
  CALL_SPREAD: 27,
  CALL_BARRIER: 28,
  PUT: 29,
  PUT_SPREAD: 30,
  REVERSE_CONVERTIBLE: 31,
  REVERSE_CONVERTIBLE_AT_MATURITY: 32,
  REVERSE_CONVERTIBLE_PP: 33,
  CALLABLE_CC: 34,
  CALLABLE_CCM: 35,
  CALLABLE_CC_MC: 36,
  CALLABLE_CCM_MC: 37,
  CALLABLE_BC: 38,
  CALLABLE_BCM: 39,
  CALLABLE_BC_MC: 40,
  CALLABLE_BCM_MC: 41,
  CALLBALE_BC_CC: 42,
  CALLBALE_BC_CCM: 43,
  CALLABLE_BCM_CC: 44,
  CALLBALE_BCM_CCM: 45,
  CALLABLE_BC_MC_CC: 46,
  CALLABLE_BC_MC_CCM: 47,
  CALLABLE_RC_AUTOCALL: 48,
  CALLABLE_RC_AUTOCALL_ECC: 49,
  CALLABLE_RC_AUTOCALL_ECCM: 50,
  CALLABLE_BCM_MC_CC: 51,
  CALLABLE_BCM_MC_CCM: 52,
  PHOENIX_BCM_MC_CC: 53,
  PHOENIX_BCM_MC_CCM: 54,
  TWIN_WIN_CC: 55,
  TWIN_WIN_CCM: 56,
  TWIN_WIN_GC: 57,
  CLN_TRANCHA: 58,
  CLN_BASKET_SU: 59,
};
module.exports.PRODUCT_CATALOG_YIELD = {
  AUTOCALL_PHOENIX_CALLABLE: 'product.group.autocallPhoenixCallable',
  REVERSE_CONVERTIBLE: 'product.group.reverseConvertible',
};
module.exports.PRODUCT_CATALOG_PARTICIPATION = {
  TRACKER_OUTPERFORMER_BONUS_BOOSTER:
    'product.group.trackerOutperformerBonusBooster',
  CALL_PUT: 'product.group.callput',
};
module.exports.TRADE_LIFECYCLE_STATUS = {
  ALIVE: 'trade.status.alive',
  EXPIRED: 'trade.status.expired',
  CALLABLE: 'trade.status.callable',
  EARLY_REDEEMED: 'trade.status.earlyRedeemed',
};
module.exports.ENUMS = {
  LANGUAGES: Object.values(this.LANGUAGES),
  CLIENT_TYPE: Object.values(this.CLIENT_TYPE),
  CURRENCIES: Object.values(this.CURRENCIES),
  CONNECTION_TYPE: Object.values(this.CONNECTION_TYPE),
  ISSUERS_CODES: Object.values(this.ISSUERS_CODES),
  ISSUERS_SPECIAL_CAPABILITIES: Object.values(
    this.ISSUERS_SPECIAL_CAPABILITIES
  ),
  PRODUCT_CATALOG_PARTICIPATION: Object.values(
    this.PRODUCT_CATALOG_PARTICIPATION
  ),
  PRODUCT_CATALOG_YIELD: Object.values(this.PRODUCT_CATALOG_YIELD),
  PRODUCT_SETTLEMENT: Object.values(this.PRODUCT_SETTLEMENT),
  PRODUCT_STRIKE_TYPE: Object.values(this.PRODUCT_STRIKE_TYPE),
  PRODUCT_BASKET_TYPE: Object.values(this.PRODUCT_BASKET_TYPE),
  PRODUCT_BARRIER_TYPE: Object.values(this.PRODUCT_BARRIER_TYPE),
  PRODUCT_SOLVER_FOR: Object.values(this.PRODUCT_SOLVER_FOR),
  PRODUCT_FREQUENCY: Object.values(this.PRODUCT_FREQUENCY),
  PRODUCT_COUPON_PERIOD: Object.values(this.PRODUCT_COUPON_PERIOD),
  PRODUCT_COUPON_TYPE: Object.values(this.PRODUCT_COUPON_TYPE),
  PRODUCT_COUPON_BARRIER: Object.values(this.PRODUCT_COUPON_BARRIER),
  TRADE_LIFECYCLE_STATUS: Object.values(this.TRADE_LIFECYCLE_STATUS),
  UNDERLYING_TYPE: Object.values(this.UNDERLYING_TYPE),
  VALUATION_AGENCIES: Object.values(this.VALUATION_AGENCIES),
  CLEARING_HOUSES: Object.values(this.CLEARING_HOUSES),
  RATING_AGENCIES: [
    {
      key: this.RATING_AGENCIES.STANDARD_AND_POORS,
      values: [
        'AAA',
        'AA+',
        'AA',
        'AA-',
        'A+',
        'A',
        'A-',
        'BBB+',
        'BBB',
        'BBB-',
        'BB+',
        'BB',
        'B',
        'CCC',
        'C',
        'D',
      ],
    },
    {
      key: this.RATING_AGENCIES.MOODYS,
      values: [
        'Aaa',
        'Aa1',
        'Aa2',
        'Aa3',
        'A1',
        'A2',
        'A3',
        'Baa1',
        'Baa2',
        'Baa3',
        'Ba1',
        'Ba2',
        'Ba3',
        'B1',
        'B2',
        'B3',
        'Caa1',
        'Caa2',
        'Caa3',
        'Ca',
        'C',
      ],
    },
    {
      key: this.RATING_AGENCIES.FITCH,
      values: [
        'AAA',
        'AAA-',
        'AA+',
        'AA',
        'AA-',
        'A+',
        'A',
        'A-',
        'BBB+',
        'BBB',
        'BBB-',
        'BB+',
        'BB',
        'BB-',
        'B+',
        'B',
        'B+',
        'CCC+',
        'CCC',
        'CCC-',
        'CC+',
        'CC',
        'CC-',
        'C+',
        'C',
        'C-',
      ],
    },
  ],
};
module.exports.WEBHOOKS = {
  CODEBUILD: 'CODEBUILD_WEBHOOK_PATH',
  ALERTS: 'WEBHOOK_ALERTS_PATH',
  AUDIT: 'WEBHOOK_AUDITS_PATH',
};
module.exports.TRADES_FILE_EXTENSIONS = ['PDF', 'DOC'];
module.exports.MIME_TYPE = {
  PDF: 'application/pdf',
  TEXT: 'text/plain',
  HTML: 'text/html',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
};
module.exports.AWS_EVENT_SOURCES = {
  AWS_APIGW: 'aws.apigw',
  AWS_EVENTS: 'aws.events',
  AWS_LAMBDA: 'aws.lambda',
};
module.exports.AWS_EVENT_TYPE = {
  SCHEDULED: 'Scheduled Event',
};
module.exports.S3_BUCKETS_NAME = {
  ORGANIZATIONS: `asn-organizations-${process.env.TENANT}`,
  MARKETSTACK: `asn-marketstack-${process.env.TENANT}`,
};
module.exports.TICKERS_LASTNAMES = {
  REUTERS: {
    XCBO: 'Z',
    XNYS: 'N',
    ARCX: 'P',
    XASE: ['A', 'NONE'],
    XNAS: 'O',
    XNMS: 'N',
    XNCM: 'OQ',
    XNGS: 'OQ',
    XETRA: 'DE',
    XPAR: 'PA',
    BMEX: 'MC',
    XMIL: 'IM',
    XBRU: 'BR',
    XAMS: 'AS',
    XHEL: 'HE',
    XWBO: 'VI',
    XDUB: 'IM',
    XLIS: 'LS',
    XLON: 'L',
    XSWX: 'S',
    XSTO: 'ST',
    XOSL: 'OL',
    XCSE: 'CO',
    XWAR: 'WA',
    XTAE: 'TA',
    XTKS: 'T',
    XHKG: 'HK',
    XTSE: 'TO',
    XASX: 'AX',
    XKRX: 'KS',
    XKOS: 'KQ',
    XSES: 'SI',
    XTAI: 'TW',
    XBKK: 'BK',
  },
  BLOOMBERG: {
    XCBO: ['US', 'UF'],
    XNYS: ['US', 'UN'],
    ARCX: ['US', 'UP'],
    XASE: ['US', 'UA'],
    XNAS: ['US', 'NONE'],
    XNMS: ['US', 'UQ'],
    XNCM: ['US', 'UR'],
    XNGS: ['US', 'UW'],
    XETRA: ['GR', 'GY'],
    XPAR: 'FP',
    BMEX: ['SM', 'SQ'],
    XMIL: 'IM',
    XBRU: 'BB',
    XAMS: 'NA',
    XHEL: 'FH',
    XWBO: 'AV',
    XDUB: 'ID',
    XLIS: 'PL',
    XLON: 'LN',
    XSWX: ['SW', 'SW', 'VX'],
    XSTO: 'SS',
    XOSL: 'NO',
    XCSE: 'DC',
    XWAR: 'PW',
    XTAE: 'IT',
    XTKS: ['JP', 'JT'],
    XHKG: 'HK',
    XTSE: ['CN', 'CT'],
    XASX: ['AU', 'AT'],
    XKRX: ['KS', 'KP'],
    XKOS: ['KS', 'KQ'],
    XSES: 'SP',
    XTAI: 'TT',
    XBKK: 'TB',
  },
};
module.exports.FREQUENCY = {
  IMMEDIATELY: 'general.frequency.inmmediately',
  DAILY: 'general.frequency.daily',
  WEEKLY: 'general.frequency.weekly',
  BIWEEKLY: 'general.frequency.biweekly',
  MONTHLY: 'general.frequency.monthly',
  BIMONTHLY: 'general.frequency.bimonthly',
  YEARLY: 'general.frequency.yearly',
};
module.exports.EVENTS_TYPES = {
  ASN: {
    ISSUER_TESTING_ERROR: 'event.asn.testing.issuerTestingError',
    QUOTE_ON_ERROR: 'event.asn.testing.quoteOnError',
    UNSUPPORTED_UNDERLYINGS: 'event.asn.testing.unsupportedUnderlyings',
  },
  SYSTEM: {
    NEW_FUNCTIONALITY_UPCOMING: 'event.system.newFunctionalityUpcoming',
    NEW_FUNCTIONALITY_AVAILABLE: 'event.system.newFunctionalityAvailable',
    NEW_MULTIMEDIA_AVAILABLE: 'event.system.newMultimediaAvailable',
    NEW_SUPPORT_MESSAGE: 'event.system.newSupportMessage',
    NEW_USER_ENROLLED: 'event.system.newUserEnrolled',
    NEW_USER_PROFILING_PENDING: 'event.system.newUserPendingProfiling',
    NEW_TRAINING: 'event.system.newTraining',
    ERROR: 'event.system.error',
  },
  MULTIPRICER: {
    NEW_QUOTE_RESULT: 'event.multipricer.newQuoteResult',
  },
  POST_TRADE: {
    PENDING_ACTION: 'event.postTrade.pendingAction',
    DOCUMENT_AVAILABLE: 'event.postTrade.documentAvailable',
  },
  PRODUCT_OBSERVATION: {
    METADATA_CALCULATIONS: 'event.observation.metadataCalculations',
    INITIAL_FIXING_LEVEL_CHANGE:
      'event.observation.corporate.initialFixingLevelChange',
    CANCEL_COUPON: 'event.observation.cancelCoupon', // No notifica, solo historifica
    EXTRA_CANCEL_COUPON: 'event.observation.extraCancelCoupon', // No notifica, solo historifica
    BARRIER_COUPON: 'event.observation.barrierCoupon', // No notifica, solo historifica
    GUARANTEED_COUPON: 'event.observation.guaranteedCoupon', // No notifica, solo historifica
    MIN_COUPON: 'event.observation.minCoupon', // No notifica, solo historifica
    NO_COUPONS_PAYMENT: 'event.observation.noCouponsPayment',
    COUPONS_PAYMENT: 'event.observation.couponsPayment',
    COUPONS_PAYMENT_AT_EARLY_REDEEM:
      'event.observation.couponsPaymentAtEarlyRedeem',
    COUPONS_PAYMENT_AT_MATURITY: 'event.observation.couponsPaymentAtMaturity',
    LOW_VALUATION: 'event.observation.lowValuation',
    OUTOF_RISK: 'notifiations.observation.outOfRisk',
    AT_RISK: 'event.observation.atRisk',
    RISK_CLUSTERING: 'event.observation.riskClustering',
  },
  PRODUCT_MANAGEMENT: {
    UPCOMING_COUPON: 'event.management.upcomingCoupon',
    UPCOMING_MATURITY: 'event.management.upcomingMaturity',
    UPCOMING_LAST_DAY_FOR_INCREASES:
      'event.management.upcomingLastDayForIncreases',
    HIGH_ISSUER_PRICE_DEVIATION: 'event.management.highIssuerPriceDeviation',
    LOW_ISSUER_PRICE_DEVIATION: 'event.management.lowIssuerPriceDeviation',
    RESTRUCTURING: 'event.management.restructuring',
    ROLO: 'event.management.rolo',
    REPORT: 'notifiations.management.report',
  },
  PRODUCT_IDEAS: {
    ISSUER_TESTING_ERROR: 'event.productIdeas.issuerTestingError',
    USER_NOTIFIATION_EXPIRED: 'event.productIdeas.userNotificationExpired',
    USER_NOTIFIATION_REMOVED: 'event.productIdeas.userNotificationRemoved',
    SINGLE_TARGET_PRICE_REACHED: 'event.productIdeas.singleTargetPriceReached',
    MULTI_TARGET_PRICE_REACHED: 'event.productIdeas.multiTargetPriceReached',
  },
  COMMERCIALS: {
    NEW_PRIMARY_VALUATION_REQUEST:
      'event.commercials.newPrimaryValuationRequest',
    NEW_SECONDARY_VALUATION_REQUEST:
      'event.commercials.newSecondaryValuationRequest',
    NEW_CAMPAINGN: 'event.commercials.campaingn.newCampaingn',
    CAMPAINGN_CLOSETO_EXPIRE: 'event.commercials.campaingn.closeToExpire',
    CAMPAINGN_EXPIRED: 'event.commercials.campaingn.expired',
    CAMPAINGN_CANCELED: 'event.commercials.campaingn.canceled',
  },
};
module.exports.NOTIFICATIONS_DEFAULT_SETTINGS = {
  PUSH: true,
  EMAIL: true,
  REPORT_AGGREGATION: true,
  FREQUENCY: exports.FREQUENCY.WEEKLY,
  OUTOF_RISK_THRESHOLD_PCT: 5,
};
module.exports.MULTIPRICER_DEFAULT_SETTINGS = {
  DEAL_PARAMS: {
    defCallabillity: false,
    defCouponTypeAutocall: 'multipricer.nominal',
    defCouponTypeReverse: 'multipricer.nominal',
    defSwitchOneStar: false,
    defOneStarLevelPct: 100,
    defAutocallBarrierPct: 100,
    defGuaranteed: 'multipricer.conditional',
    defCouponBarrierPct: 50,
    defStepDownPct: 0,
    defMinAutocallBarrierPct: 80,
    defReversePayment: 'multipricer.atExpiry',
    defCallParticipationPct: 100,
    defCapType: false,
    defCapLevelPct: 120,
    defSwitchBonus: false,
    defBonusLevelPct: 5,
    defCallLowStrikeLevelPct: 100,
    defPutHighStrikeLevelPct: 100,
    defCapFloorLevelPct: 100,
    defCallCapitalParticipationPct: 100,
    defPutParticipationPct: 100,
  },
  GENERAL_PARAMS: {
    defNotional: 1000000,
    defCurrency: 'EUR',
    defStrikeFixingType: 'multipricer.todayAtClose',
    defIssueDate: 5,
    defReoffer: 'multipricer.reoffer',
    defSettlement: 'multipricer.cash',
    defIssuePrice: 100,
    defBasket: 'multipricer.worst',
  },
  RISK_PARAMS: {
    defRiskStrikePct: 100,
    defLowStrikePutSpreadPct: 100,
    defRiskBarrierType: 'multipricer.european',
    defRiskBarrierStocksLevel: 50,
    defRiskBarrierIndexLevel: 50,
  },
};
