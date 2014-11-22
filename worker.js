var Q = require('q'),
    _ = require('underscore'),
    EC2 = require('./ec2');

var argv = require('optimist')
    .usage('Usage: $0 -i [TIME_SEC]')
    .demand(['i'])
    .alias('i', 'timesec')
    .describe('s', 'Idle Time in seconds')
    .argv;

var idleTime = argv.i;

EC2.createInstances(1).then(function (data) {
    console.log(data);
}, function (error) {
    console.error(error);
});
