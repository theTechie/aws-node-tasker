var helper = require('./helper'),
    Q = require('q');

var EC2 = new helper.AWS.EC2();

// NOTE: wait until instance passes health checks and is ready to be used; 'instanceStatusOk'
function waitFor(callback) {
    var deferred = Q.defer();

    var params = {};

    EC2.waitFor('instanceStatusOk', params, function (err, data) {
        if (err) deferred.reject("ERROR : waitFor() : " + err + err.stack);
        else deferred.resolve(data);
    });

    return deferred.promise.nodeify(callback);
};

// NOTE: create new instances
exports.createInstances = function (count, callback) {
    var deferred = Q.defer();

    var params = {
        ImageId: 'ami-37501207',
        InstanceType: 't1.micro',
        MaxCount: count,
        /* required */
        MinCount: count,
        /* required */
        KeyName: 'CS553',
        SecurityGroups: ['CS553']
    };

    EC2.runInstances(params, function (err, data) {
        if (err) deferred.reject("ERROR : createInstances() : " + err + err.stack);
        else {
            waitFor().then(function (data) {
                deferred.resolve(data);
            });
        }
    });

    return deferred.promise.nodeify(callback);
};
