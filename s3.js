var AWS = require('aws-sdk');

AWS.config.loadFromPath('./config.json');

var s3 = new AWS.S3();
s3.listBuckets(function (data, err) {
    if (err) {
        console.log(err);
    } else {
        console.log(data);
    }
});