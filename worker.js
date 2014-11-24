var Q = require('q'),
    _ = require('underscore'),
    shell = require('shelljs');
//EC2 = require('./ec2');

var argv = require('optimist')
    .usage('Usage: $0 -i [TIME_SEC]')
    .demand(['i'])
    .alias('i', 'timesec')
    .describe('s', 'Idle Time in seconds')
    .argv;

var idleTime = argv.i;

var idleTimer = setTimeout(function () {
    console.log("Idle Timeout Expired, Shutting myself !!");
    shell.exec('sudo shutdown -h now', function (code, output) {
        console.log('Exit Code:', code);
        console.log('Program output:', output);
    });
}, idleTime * 1000);
