var Q = require('q'),
    _ = require('underscore'),
    shell = require('shelljs'),
    SQS = require('./sqs');

var argv = require('optimist')
    .usage('Usage: $0 -i [TIME_SEC]')
    .demand(['i'])
    .alias('i', 'timesec')
    .describe('s', 'Idle Time in seconds')
    .argv;

var idleTime = argv.i;

SQS.getQueueLength('CS553').then(function (length) {
    console.log("Queue Length:", length);
}, function (error) {
    console.log(error);
});

var idleTimer = setTimeout(function () {
    console.log("Idle Timeout Expired, Shutting myself !!");
    shell.exec('sudo shutdown -h now', function (code, output) {
        console.log('Exit Code:', code);
        console.log('Program output:', output);
    });
}, idleTime * 1000);
