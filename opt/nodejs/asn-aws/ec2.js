const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(catalog.LOG_PREFIX.EC2);
const sdk = require('../asn-aws/sdk');
const ec2 = sdk.getEC2Client();

/**
 * It looks up the EC2 Instance Identifier filtering by tag.
 * @param {string} tagkey tag key
 * @param {array} tagValues tag values
 * @returns ec2 instance identifier
 */
module.exports.getEC2InstanceIdsByTag = async (tagkey, tagValues) => {
  logger.info('Describing EC2 Instance with tag ', tagkey, '=', tagValues);

  let params = {
    Filters: [{ Name: 'tag:'.concat(tagkey), Values: tagValues }],
  };
  return ec2
    .describeInstances(params)
    .promise()
    .then(
      function (data) {
        let instanceids = [];
        data.Reservations.forEach(function (reservation) {
          reservation.Instances.forEach(function (instance) {
            instanceids.push(instance.InstanceId);
          });
        });
        logger.info('EC2 Instance IDs:', instanceids);
        return instanceids;
      },
      function (error) {
        logger.error(error.message);
      }
    );
};

/**
 * It stops some ec2 instance.
 * @param {*} instanceIds ec2 instance identifier
 * @returns operation result
 */
module.exports.stopInstances = async (instanceIds) => {
  logger.info('Stopping EC2 Instances:', instanceIds);
  let params = { InstanceIds: instanceIds };
  return ec2
    .stopInstances(params)
    .promise()
    .then(
      function (data) {
        logger.info('Response: ', JSON.stringify(data));
      },
      function (error) {
        logger.error(error, error.stack);
      }
    );
};

/**
 * It starts some ec2 instance.
 * @param {*} instanceIds ec2 instance identifier
 * @returns operation result
 */
module.exports.startInstances = async (instanceIds) => {
  logger.info('Starting EC2 Instances:', instanceIds);
  let params = { InstanceIds: instanceIds };
  return ec2
    .startInstances(params)
    .promise()
    .then(
      function (data) {
        logger.info('Response: ', JSON.stringify(data));
      },
      function (error) {
        logger.error(error, error.stack);
      }
    );
};
