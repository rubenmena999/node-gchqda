const catalog = require('../asn-common/catalog');
const logger = require('../asn-common/logger')(catalog.LOG_PREFIX.DOCUMENT_DB);
const promiseHandler = require('../asn-common/promiseHandler')(logger);
const apiError = require('../asn-api/apiError');
const utils = require('../asn-common/utils');
const sm = require('../asn-aws/sm');
const sdk = require('../asn-aws/sdk');
const docdb = sdk.getDocumentDBClient();

/** Environment Variables */
const mongoDatabaseName = process.env.MONGO_DB_NAME;
const mongoSecretName = process.env.MONGO_SECRET_NAME;
const rdsSSLCertificateFile = process.env.RDS_SSL_CA_FILE;

/** Mongo Database Errors */
const mongoErrors = {
  DuplicateEntry: { code: 'E11000', message: 'Duplicate entry.' },
};

/** Global Initialization */
var mongoConnectionPromise;
var sslCA, mongoConnection;

/**
 * It initializes the mongo connecto by creating a new MongoDB Connector Promise.
 */
async function getMongoConnectorPromise() {
  if (mongoConnectionPromise) {
    return mongoConnectionPromise;
  }

  logger.info('Creating a new mongo connection promise');
  let mongoClusterURI = await getMongoClusterURI();
  sslCA = await sm.lookupCertificate(rdsSSLCertificateFile, sslCA);
  mongoConnectionPromise = require('mongodb').MongoClient.connect(
    mongoClusterURI,
    {
      sslValidate: true,
      sslCA: sslCA,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
  return mongoConnectionPromise;
}

/**
 * It returns the MongoDB URI.
 * It builds the MongoDB URI if it is has not been initialized yet.
 * @returns MongoDB URI
 */
async function getMongoClusterURI() {
  logger.info('Looking up Mongo Cluster URI');

  let mongoSecret = await sm.getSecret(mongoSecretName);
  let mongoClusterURI = 'mongodb://'
    .concat(mongoSecret.username)
    .concat(':{PASSWORD}')
    .concat('@')
    .concat(mongoSecret.host)
    .concat(':')
    .concat(mongoSecret.port)
    .concat('/?')
    .concat('ssl=')
    .concat(mongoSecret.ssl)
    .concat('&retryWrites=false');

  logger.info('URI:', mongoClusterURI);
  mongoClusterURI = mongoClusterURI.replace('{PASSWORD}', mongoSecret.password);
  return mongoClusterURI;
}

/**
 * It connects with the mongo database returning the connection.
 * @returns mongodb connection
 */
async function getMongoDB() {
  let mongoConnectorPromise = getMongoConnectorPromise();
  mongoConnection = await promiseHandler.handle(mongoConnectorPromise);
  let mongodb = mongoConnection.db(mongoDatabaseName);
  return mongodb;
}

/**
 * It closes the Mongo Connection.
 */
async function closeConnection() {
  if (mongoConnection) {
    logger.info('Closing mongo connection');
    mongoConnection.close();
    mongoConnection = undefined;
  }
}

/**
 * It lists all the collections stored in the database.
 * @returns collections array
 */
async function listCollections() {
  let logId = logger.time(arguments.callee.name);

  logger.info('Listing all collections');

  let db = await promiseHandler.handle(getMongoDB());
  let result = await db
    .listCollections()
    .toArray()
    .then(function (result) {
      logger.info('Collections found:', result.length);
      return result;
    })
    .catch(function (error) {
      onError(error);
    });

  logger.trace('listCollections Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It creates a new collection within the database.
 * @param {string} name collection name
 * @returns created collection in JSON format
 */
async function createCollection(name) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Creating new collection:', name);

  let db = await promiseHandler.handle(getMongoDB());
  let result = await db
    .createCollection(name)
    .then(function (result) {
      logger.info('Collection created:', JSON.stringify(result.s.namespace));
      return result;
    })
    .catch(function (error) {
      onError(error);
    });

  logger.trace('createCollection Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It creates a collection index in database.
 * @param {string} collectionName collection name
 * @param {json} index index
 * @param {json} params index parameters
 * @returns created index in JSON format
 */
async function createCollectionIndex(collectionName, index, params) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Creating collection index for:', collectionName);
  logger.trace('Index:', JSON.stringify(index));
  logger.trace('Params:', JSON.stringify(params));

  let collection = await promiseHandler.handle(getCollection(collectionName));
  let result = await collection
    .createIndex(index, params)
    .then(function (result) {
      logger.info('Index created');
      return result;
    })
    .catch(function (error) {
      onError(error);
    });

  logger.trace('createIndex Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It lookus up a collection by name in the database.
 * @param {string} collectionName collection name
 * @returns collection in JSON format
 */
async function getCollection(collectionName) {
  let mongodbPromise = getMongoDB();
  let mongodb = await promiseHandler.handle(mongodbPromise);
  logger.info('Looking up collection:', collectionName);
  let result = await mongodb.collection(collectionName);
  if (!result) {
    throw new apiError.InternalServerError(
      `The collection ${collectionName} does not exists`
    );
  }
  return result;
}

/**
 * It looks up all the indexes of a collection in database.
 * @param {string} collectionName
 * @returns collection indexes in JSON format
 */
async function getCollectionIndexes(collectionName) {
  let logId = logger.time(arguments.callee.name);

  logger.info("Getting colletion '", collectionName, "' indexes");

  let collection = await promiseHandler.handle(getCollection(collectionName));
  let result = await collection
    .indexes()
    .then(function (result) {
      return result;
    })
    .catch(function (error) {
      onError(error);
    });

  logger.trace('indexes Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It removes a collection by name in the database
 * @param {string} collectionName collection name
 * @returns operation result in JSON format
 */
async function dropCollection(collectionName) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Deleting collection:', collectionName);

  let collection = await promiseHandler.handle(getCollection(collectionName));
  let result = await collection
    .drop()
    .then(function (result) {
      logger.info('Collection deleted');
      return result;
    })
    .catch(function (error) {
      onError(error);
    });

  logger.trace('drop Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It creates a new document within a collection in the database
 * @param {string} collectionName collection name
 * @param {json} data json document data to store
 * @returns operation result in JSON format
 */
async function insertDocument(collectionName, data) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Inserting document within the collection:', collectionName);

  let document = { ...data };
  delete document.uuid;
  document = {
    uuid: data.uuid ? data.uuid : utils.genRandomUuid(),
    creationDate: data.creationDate
      ? data.creationDate
      : utils.genDatabaseTimestamp(),
    ...document,
  };

  logger.trace('insertOne Document:', JSON.stringify(document));

  let collection = await promiseHandler.handle(getCollection(collectionName));
  let result = await collection
    .insertOne(document)
    .then(function (result) {
      logger.info('Document has been inserted successfully');
      result = result.ops[0];
      delete result['_id'];
      return result;
    })
    .catch(function (error) {
      onInsertError(error);
    });

  logger.trace('insertOne Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It creates many documents within a collection in the database
 * @param {string} collectionName collection name
 * @param {json} docs json document to store
 * @returns operation result in JSON format
 */
async function insertManyDocuments(collectionName, data) {
  let logId = logger.time(arguments.callee.name);

  logger.info(
    'Inserting many documents within the collection:',
    collectionName
  );

  let documentsArray = [];
  data.forEach((dataItem) => {
    let documentItem = { ...dataItem };
    delete documentItem.uuid;
    documentItem = {
      uuid: dataItem.uuid ? dataItem.uuid : utils.genRandomUuid(),
      creationDate: utils.genDatabaseTimestamp(),
      ...documentItem,
    };
    documentsArray.push(documentItem);
  });

  logger.trace('insertMany Documents:', JSON.stringify(documentsArray));

  let collection = await promiseHandler.handle(getCollection(collectionName));
  let result = await collection
    .insertMany(documentsArray)
    .then(function (result) {
      logger.info('Documents has been inserted successfully');
      let documents = [];
      result.ops.forEach((document) => {
        delete document['_id'];
        documents.push(document);
      });
      return documents;
    })
    .catch(function (error) {
      onInsertError(error);
    });

  logger.trace('insertMany Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It looks up one document within a colleciton in database
 * @param {string} collectionName colleciton name
 * @param {json} query query filter
 * @param {json} fields set of fields to retrieve
 * @returns operation result in JSON format
 */
async function findDocument(collectionName, query, fields) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Finding document within the collection:', collectionName);

  if (query && Object.keys(query).length > 0) {
    logger.trace('findOne Query:', JSON.stringify(query));
  } else {
    query = {};
  }

  if (fields && Object.keys(fields).length > 0) {
    logger.trace('findOne Fields:', JSON.stringify(fields));
    fields['_id'] = 0;
  } else {
    fields = { _id: 0 };
  }

  query = query ? query : {};
  fields = fields ? { projection: fields } : { projection: { _id: 0 } };

  let collection = await promiseHandler.handle(getCollection(collectionName));
  let result = await collection
    .findOne(query, fields)
    .then(function (result) {
      if (!result) {
        throw new apiError.ResourceNotFound();
      }
      logger.info('Document has been found successfully');
      return result;
    })
    .catch(function (error) {
      onError(error);
    });

  logger.trace('findOne Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 *
 * @param {string} collectionName collection name
 * @param {json} query query filter
 * @param {json} fields set of fields to retrieve
 * @param {json} sort sort criteria
 * @param {json} limit number of documents to retrieve
 * @returns operation result in JSON format
 */
async function findManyDocuments(
  collectionName,
  query,
  fields,
  sort,
  limit,
  page
) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Finding documents within the collection:', collectionName);
  let collection = await promiseHandler.handle(getCollection(collectionName));

  if (query && Object.keys(query).length > 0) {
    logger.trace('findMany Query:', JSON.stringify(query));
  } else {
    query = {};
  }

  if (fields && Object.keys(fields).length > 0) {
    logger.trace('findMany Fields:', JSON.stringify(fields));
    fields['_id'] = 0;
  } else {
    fields = { _id: 0 };
  }

  if (sort && Object.keys(sort).length > 0) {
    logger.trace('find Sort:', JSON.stringify(sort));
  } else {
    sort = {};
  }

  let startIndex, endIndex, totalDocumentsCount;
  if (page) {
    logger.info('Query will be paginated');
    logger.trace('Page:', page);
    limit = limit ? limit : catalog.DOCDB_DEFAULT_LIMIT;
    startIndex = page > 0 ? (page - 1) * limit : 0;
    endIndex = page * limit;
    totalDocumentsCount = await collection
      .countDocuments(query)
      .then(function (result) {
        return result;
      })
      .catch(function (error) {
        throw new apiError.InternalServerError(error.message);
      });
  }

  if (limit) {
    logger.trace('Limit:', limit);
  }

  let result = await collection.find(query);
  result = fields ? result.project(fields) : result;
  result = sort ? result.sort(sort) : result;
  result = startIndex ? result.skip(startIndex) : result;
  result = limit ? result.limit(limit) : result;

  result = await result
    .toArray()
    .then(function (result) {
      if (!result) {
        throw new apiError.ResourceNotFound();
      }
      logger.info('Documents has been found successfully:', result.length);
      return result;
    })
    .catch(function (error) {
      onError(error);
    });

  if (page) {
    result.pagination = {
      limit: limit,
      totalDocuments: totalDocumentsCount,
      totalPages: totalDocumentsCount / limit,
      currentPage: page,
      currentStartIndex: startIndex,
      currentEndIndex: endIndex,
    };
  }

  logger.trace('findMany Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It updates one document within a collection in database.
 * @param {string} collectionName collection name
 * @param {json} query query filter
 * @param {json} updates values to override
 * @param {json} filter filter
 * @param {boolean} returns true to return the updated document
 * @returns operation result in JSON format
 */
async function updateDocument(collectionName, query, updates, filter, returns) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Updating document within the collection:', collectionName);
  logger.trace('updateOne Query:', JSON.stringify(query));
  logger.trace('updateOne Values:', JSON.stringify(updates));
  if (filter) {
    logger.trace('updateOne Filter:', JSON.stringify(filter));
  }

  let collection = await promiseHandler.handle(getCollection(collectionName));
  let result = await collection
    .updateOne(query, updates, filter)
    .then(function (result) {
      logger.info(
        'Document matched:',
        result.matchedCount,
        'Documents modified:',
        result.modifiedCount
      );
    })
    .catch(function (error) {
      onError(error);
    });

  if (returns == undefined) {
    logger.info('Querying the updated document');
    result = await findDocument(collectionName, query).catch(function (error) {
      onError(error);
    });

    if (query && updates && updates['$push']) {
      let updateKey = Object.keys(updates['$push'])[0];
      let queryKey = Object.keys(query)[0];
      result = result[updateKey].find(
        (document) => document[queryKey] == updates['$push'][updateKey].uuid
      );
    }
    logger.trace('updateOne Result:', JSON.stringify(result));
  }

  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It updates many document within a collection in database.
 * @param {string} collectionName collection name
 * @param {json} query query filter
 * @param {json} values values to override
 * @returns operation result in JSON format
 */
async function updateManyDocuments(collectionName, query, values) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Updating many document within the collection:', collectionName);
  logger.trace('updateMany Query:', JSON.stringify(query));
  logger.trace('updateMany Values:', JSON.stringify(values));

  let collection = await promiseHandler.handle(getCollection(collectionName));
  await collection
    .updateMany(query, values)
    .then(function (result) {
      logger.info(
        'Document matched:',
        result.matchedCount,
        'Documents modified:',
        result.modifiedCount
      );
    })
    .catch(function (error) {
      onError(error);
    });

  logger.info('Querying the updated documents');
  let result = await findManyDocuments(collectionName, query).catch(function (
    error
  ) {
    onError(error);
  });

  logger.trace('updateMany Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It deletes one document within a collection in database.
 * @param {string} collectionName collection name
 * @param {json} query query filter
 * @returns operation result in JSON format
 */
async function deleteDocument(collectionName, query) {
  let logId = logger.time(arguments.callee.name);

  logger.info('deleteOne document within the collection:', collectionName);
  logger.trace('deleteOne Query:', JSON.stringify(query));

  let collection = await promiseHandler.handle(getCollection(collectionName));
  let result = await collection
    .deleteOne(query)
    .then(function (result) {
      if (result.deletedCount == 0) {
        throw new apiError.ResourceNotFound();
      }
      logger.info('Document has been deleted successfully');
      return result;
    })
    .catch(function (error) {
      onError(error);
    });

  logger.trace('deleteOne Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It deletes many document within a collection in database.
 * @param {string} collectionName collection name
 * @param {json} query query filter
 * @returns operation result in JSON format
 */
async function deleteManyDocuments(collectionName, query) {
  let logId = logger.time(arguments.callee.name);

  logger.info(
    'deleteMany many documents within the collection:',
    collectionName
  );
  logger.trace('deleteMany Query:', JSON.stringify(query));

  let collection = await promiseHandler.handle(getCollection(collectionName));
  let result = await collection
    .deleteMany(query)
    .then(function (result) {
      logger.info('Documents has been deleted successfully');
      return result;
    })
    .catch(function (error) {
      onError(error);
    });

  logger.trace('deleteMany Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It joins some collections in order to aggregate many documents.
 * @param {*} collectionName collection name
 * @param {*} pipeline aggregation pipeline in JSON format
 * @returns operation result in JSON format
 */
async function aggregateManyDocuments(collectionName, pipeline) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Aggregating collecionts documents on:', collectionName);
  logger.trace('aggregate Pipeline:', JSON.stringify(pipeline));

  let collection = await promiseHandler.handle(getCollection(collectionName));
  let result = await collection
    .aggregate(pipeline)
    .toArray()
    .then(function (result) {
      logger.info('Documents has been aggregated successfully');
      return result;
    })
    .catch(function (error) {
      onError(error);
    });

  logger.trace('aggregate Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It describes a cluster by its identifier.
 * @param {*} clusterId cluster identifier
 * @returns operation result in JSON format
 */
async function describeCluster(clusterId) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Describing DocumentDB Cluster:');
  let params = { DBClusterIdentifier: clusterId };

  let result = await docdb
    .describeDBClusters(params)
    .promise()
    .then(
      function (data) {
        return data;
      },
      function (error) {
        onError(error);
      }
    );

  logger.trace('describeDBClusters Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It translates a JSON Array formed by a set of documents to an array of uuids.
 * @param {array} array JSON Array of documents
 * @returns array of uuids
 */
function extractDocumentsUuids(array) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Retrieving documents uuids');
  let result = [];
  array.forEach(function (document) {
    result.push(document.uuid);
  });

  logger.trace('Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * Callback function used to handle erros on inserting documents.
 * @param {error} error
 */
function onInsertError(error) {
  logger.warn('Throwing exception:', error.message);
  let customerMessage = error.message;
  if (error.message.includes(mongoErrors.DuplicateEntry.code)) {
    customerMessage = mongoErrors.DuplicateEntry.message;
    throw new apiError.ResourceConflict(error.message, customerMessage);
  }
  throw new apiError.InternalServerError(customerMessage);
}

/**
 * Callback funcion used to handle generic errors.
 * @param {*} error
 */
function onError(error) {
  if (
    error instanceof apiError.APIError &&
    !(error instanceof apiError.InternalServerError)
  ) {
    logger.warn('Throwing exception:', error.message);
  } else {
    logger.warn('Throwing exception:', error.message);
  }

  if (error instanceof apiError.APIError) {
    throw error;
  } else {
    throw new apiError.InternalServerError(error.message);
  }
}

/**
 * It starts a cluster by its identifier.
 * @param {*} clusterId cluster identifer
 * @returns operation result in JSON format
 */
async function startCluster(clusterId) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Starting DocumentDB Cluster:', clusterId);
  let params = { DBClusterIdentifier: clusterId };
  let result = await docdb
    .startDBCluster(params)
    .promise()
    .then(
      function (data) {
        logger.trace('Result:', JSON.stringify(data));
      },
      function (error) {
        onError(error);
      }
    );

  logger.trace('Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
}

/**
 * It stops a cluster by its identifier.
 * @param {*} clusterId cluster identifer
 * @returns operation result in JSON format
 */
async function stopCluster(clusterId) {
  let logId = logger.time(arguments.callee.name);

  logger.info('Stopping DocumentDB Cluster:', clusterId);
  let params = { DBClusterIdentifier: clusterId };
  let result = await docdb
    .stopDBCluster(params)
    .promise()
    .then(
      function (data) {
        logger.trace('Result:', JSON.stringify(data));
      },
      function (error) {
        onError(error);
      }
    );

  logger.trace('Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
}

/**
 * It validate the existance of a specific document uuid within a collection.
 * @param {string} collectionName collection name
 * @param {uuid} query query to fit
 * @param {int} count expected amount of documents of given query
 * @param {string} errorMessage error message to be thrown in case of validation error
 * @returns operation result in JSON format
 */
async function validateDocumentExistence(
  collectionName,
  query,
  count,
  errorMessage,
  errorCode
) {
  let logId = logger.time(arguments.callee.name);

  logger.info(
    `Validating ${collectionName}: ${JSON.stringify(query)} if exists: ${count}`
  );

  let collection = await promiseHandler.handle(getCollection(collectionName));
  let result = await collection
    .countDocuments(query)
    .then(function (result) {
      return result == count;
    })
    .catch(function (error) {
      logger.warn(error);
    });

  if (!result) {
    errorCode = errorCode ? errorCode : 409;
    apiError.APIError.throw(errorCode, errorMessage, errorMessage);
  }

  logger.trace('CountDocuments Result:', JSON.stringify(result));
  logger.timeEnd(arguments.callee.name, logId);
  return result;
}

/**
 * It warms up the collection by retrieving them.
 */
async function warmup() {
  let logId = logger.time(arguments.callee.name);
  let promise, collection, documentsCount;
  for (var i in catalog.MONGO_COLLECTION) {
    promise = getCollection(catalog.MONGO_COLLECTION[i]);
    collection = await promiseHandler.handle(promise);
    documentsCount = await collection
      .countDocuments()
      .then(function (result) {
        return result;
      })
      .catch(function (error) {
        logger.warn(error);
      });
    logger.trace(
      'stats:',
      JSON.stringify({
        collection: catalog.MONGO_COLLECTION[i],
        documentsCount: documentsCount,
      })
    );
  }
  logger.timeEnd(arguments.callee.name, logId);
}

module.exports = {
  getMongoDB,
  closeConnection,
  listCollections,
  createCollection,
  createCollectionIndex,
  getCollection,
  getCollectionIndexes,
  dropCollection,
  insertDocument,
  insertManyDocuments,
  findDocument,
  findManyDocuments,
  updateDocument,
  updateManyDocuments,
  deleteDocument,
  deleteManyDocuments,
  aggregateManyDocuments,
  validateDocumentExistence,
  extractDocumentsUuids,
  describeCluster,
  startCluster,
  stopCluster,
  warmup,
};
