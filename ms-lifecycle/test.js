const index = require('./index.js');
const fs = require('fs');

let trades = fs.readFileSync('../collections/trades.json');

let event = {
  payload: {
    action: 'lifecycle',
    body: trades[0],
    sandbox: 'true',
    tracesMetadata: {
      traceId: 'Root=1-6228c221-3babd52f0ddfe1ee4bc1d802',
      lambdaRequestId: 'dd39685b-defa-489e-9e29-eee275756171',
    },
  },
};

let context = {
  callbackWaitsForEmptyEventLoop: false,
  functionVersion: '$LATEST',
  functionName: 'ms-test',
  awsRequestId: '259e13b3-876b-497a-9b15-848f55443b26',
};

index.handler(event, context, (result) => {
  console.info(JSON.stringify(result, null, 2));
});
