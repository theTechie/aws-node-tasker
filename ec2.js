var helper = require('./helper'),
    Q = require('q');

var EC2 = new helper.AWS.EC2();

// NOTE: wait until instance reaches 'status' provided and is ready to be used;
function waitFor(status, params, callback) {
    var deferred = Q.defer();

    var par = params || {};

    EC2.waitFor(status, par, function (err, data) {
        if (err) deferred.reject("ERROR : waitFor() : " + err + err.stack);
        else deferred.resolve(data);
    });

    return deferred.promise.nodeify(callback);
};

// NOTE: create new instances
exports.createInstances = function (count, userData, callback) {
    var deferred = Q.defer();

    var params = {
        // NOTE: my AMI with git, nodejs and npm pre-installed
        ImageId: 'ami-456d3975', //default 64-bit ubuntu 14: 'ami-37501207',
        InstanceType: 't1.micro',
        MaxCount: count,
        /* required */
        MinCount: count,
        /* required */
        InstanceInitiatedShutdownBehavior: 'terminate',
        KeyName: 'CS553',
        SecurityGroups: ['CS553'],
        IamInstanceProfile: {
            Name: 'dev'
        },
        UserData: userData
    };

    EC2.runInstances(params, function (err, data) {
        if (err) deferred.reject("ERROR : createInstances() : " + err + err.stack);
        else {
            var instanceIds = data.Instances.filter(function (instance, i) {
                return instance.State.Name == 'pending';
            }).map(function (instance, i) {
                return instance.InstanceId;
            });

            var par = {
                InstanceIds: instanceIds
            };

            waitFor('instanceRunning', par).then(function (data) {
                deferred.resolve(data);
            }, function (error) {
                deferred.reject(error);
            });
        }
    });

    return deferred.promise.nodeify(callback);
};

// NOTE: create spot instances
exports.createSpotInstances = function (instanceCount, userData, callback) {
    var deferred = Q.defer();

    var params = {
        SpotPrice: '0.0040',
        /* required */
        InstanceCount: instanceCount,
        LaunchSpecification: {
            IamInstanceProfile: {
                Name: 'dev'
            },
            ImageId: 'ami-456d3975',
            InstanceType: 't1.micro',
            KeyName: 'CS553',
            SecurityGroups: ['CS553'],
            UserData: userData
        },
        Type: 'one-time'
    };

    EC2.requestSpotInstances(params, function (err, data) {
        if (err) deferred.reject("ERROR : createSpotInstances() : " + err + err.stack);
        else {
            var instanceIds = data.SpotInstanceRequests.filter(function (instance, i) {
                return instance.State == 'open';
            }).map(function (instance, i) {
                return instance.SpotInstanceRequestId;
            });

            var par = {
                SpotInstanceRequestIds: instanceIds
            };

            waitFor('spotInstanceRequestFulfilled', par).then(function (data) {
                deferred.resolve(data);
            }, function (error) {
                deferred.reject(error);
            });
        }
    });

    return deferred.promise.nodeify(callback);
};

// NOTE: terminate instances using intsanceID
/*exports.terminateInstances = function (instanceIds, callback) {
    var deferred = Q.defer();

    var params = {
        InstanceIds: instanceIds
    };

    EC2.terminateInstances(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
    });
};*/
