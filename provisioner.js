var Q = require('q'),
    _ = require('underscore'),
    SQS = require('./sqs');

SQS.getQueueLength('CS553').then(function (length) {
    console.log("Queue Length:", length);
}, function (error) {
    console.log(error);
});
