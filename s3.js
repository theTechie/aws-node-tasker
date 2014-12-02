var S3 = new helper.AWS.S3(),
    BUCKET_NAME = 'animotovideos';

// NOTE: put object to datastore
exports.putObject = function (video, callback) {
    var deferred = Q.defer();

    var params = {
        Bucket: BUCKET_NAME,
        /* required */
        Key: Date.now(),
        /* required */
        ACL: 'public-read',
        Body: video
    };

    S3.putObject(params, function (err, data) {
        if (err) deferred.reject("ERROR: putObject() :" + err + err.stack);
        else deferred.resolve(data);
    });

    return deferred.promise.nodeify(callback);
};
