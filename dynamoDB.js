var helper = require('./helper'),
    Q = require('q');

var DynamoDB = new helper.AWS.DynamoDB(),
    TABLE_NAME = 'CS553';

// NOTE: create table
exports.createTable = function (tableName, callback) {
    var deferred = Q.defer();

    var params = {
        AttributeDefinitions: [ /* required */
            {
                AttributeName: 'taskId',
                /* required */
                AttributeType: 'S' /* required */
            }
        ],
        KeySchema: [ /* required */
            {
                AttributeName: 'taskId',
                /* required */
                KeyType: 'HASH' /* required */
            }
        ],
        ProvisionedThroughput: { /* required */
            ReadCapacityUnits: 1,
            /* required */
            WriteCapacityUnits: 1 /* required */
        },
        TableName: tableName || TABLE_NAME,
        /* required */
    };

    DynamoDB.createTable(params, function (err, data) {
        if (err) deferred.reject("createTable() : " + err + err.stack);
        else deferred.resolve(data);
    });

    return deferred.promise.nodeify(callback);
};

// NOTE: Add item to table (key : taskId)
exports.addItem = function (tableName, value, callback) {
    var deferred = Q.defer();

    var params = {
        Item: { /* required */
            taskId: {
                S: value
            }
        },
        TableName: tableName || TABLE_NAME,
        /* required */
        Expected: {
            taskId: {
                Exists: false
            }
        }
    };

    DynamoDB.putItem(params, function (err, data) {
        if (err) deferred.reject("putItem() : " + err + err.stack);
        else deferred.resolve(data);
    });

    return deferred.promise.nodeify(callback);
};

// NOTE: Get item from table (key : taskId)
exports.getItem = function (tableName, value, callback) {
    var deferred = Q.defer();

    var params = {
        Key: { /* required */
            taskId: {
                S: value
            }
        },
        TableName: tableName || TABLE_NAME
    };

    DynamoDB.getItem(params, function (err, data) {
        if (err) deferred.reject("getItem() : " + err + err.stack);
        else deferred.resolve(data);
    });

    return deferred.promise.nodeify(callback);
};
