const apiVersion = {
  s3: '2006-03-01',
  sm: '2017-10-17',
  ssm: '2014-11-06',
  sns: '2010-03-31',
  ses: '2010-12-01',
  ec2: '2016-11-15',
  ddb: '2012-08-10',
  docdb: '2014-10-31',
  appsync: '2017-07-25',
  cognito: '2016-04-19',
};

const region = process.env.AWS_REGION;
var ssm,
  sm,
  s3,
  ec2,
  sns,
  ses,
  docdb,
  ddb,
  ddbDocumentClient,
  appsync,
  lambda,
  cognito;

module.exports.getS3Client = () => {
  return (s3 = s3
    ? s3
    : new this.aws.S3({ apiVersion: apiVersion.s3, region: region }));
};

module.exports.getSESClient = () => {
  return (ses = ses
    ? ses
    : new this.aws.SES({ apiVersion: apiVersion.ses, region: region }));
};

module.exports.getLambdaClient = () => {
  return (lambda = lambda
    ? lambda
    : new this.aws.Lambda({ apiVersion: apiVersion.sm, region: region }));
};

module.exports.getSystemsManagerClient = () => {
  return (ssm = ssm
    ? ssm
    : new this.aws.SSM({ apiVersion: apiVersion.ssm, region: region }));
};

module.exports.getSecretsManagerClient = () => {
  return (sm = sm
    ? sm
    : new this.aws.SecretsManager({
        apiVersion: apiVersion.sm,
        region: region,
      }));
};

module.exports.getDynamoDocClient = () => {
  return (ddbDocumentClient = ddbDocumentClient
    ? ddbDocumentClient
    : new this.aws.DynamoDB.DocumentClient());
};

module.exports.getDynamoClient = () => {
  return (ddb = ddb
    ? ddb
    : new this.aws.DynamoDB({ apiVersion: apiVersion.ddb, region: region }));
};

module.exports.getDocumentDBClient = () => {
  return (docdb = docdb
    ? docdb
    : new this.aws.DocDB({ apiVersion: apiVersion.docdb, region: region }));
};

module.exports.getSNSClient = () => {
  return (sns = sns
    ? sns
    : new this.aws.SNS({ apiVersion: apiVersion.sns, region: region }));
};

module.exports.getEC2Client = () => {
  return (ec2 = ec2
    ? ec2
    : new this.aws.EC2({ apiVersion: apiVersion.ec2, region: region }));
};

module.exports.getAppSyncClient = () => {
  return (appsync = appsync ? appsync : new this.aws.AppSync());
};

module.exports.getCognitoClient = () => {
  return (cognito = cognito
    ? cognito
    : new this.aws.CognitoIdentityServiceProvider({
        apiVersion: apiVersion.cognito,
        region: region,
      }));
};
