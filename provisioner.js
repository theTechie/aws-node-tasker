var Q = require('q'),
    _ = require('underscore'),
    SQS = require('./sqs'),
    EC2 = require('./ec2');

SQS.getQueueLength('CS553').then(function (length) {
    console.log("Queue Length:", length);
}, function (error) {
    console.log(error);
});

var USER_DATA = 'I2Nsb3VkLWNvbmZpZw0KcnVuY21kOg0KIC0gWyBjZCwgIiRIT01FIiBdDQogLSBbIGdpdCwgY2xvbmUsICJodHRwczovL2dpdGh1Yi5jb20vdGhlVGVjaGllL2F3cy1ub2RlLXRhc2tlci5naXQiLCAiYXdzLW5vZGUtdGFza2VyIiBdDQogLSBbIGNkLCAiYXdzLW5vZGUtdGFza2VyIiBdDQogLSBbIG5wbSwgaW5zdGFsbCBdDQogLSBbIG5vZGVqcywgIndvcmtlci5qcyIsICItaSIsIDUgXQ0KZmluYWxfbWVzc2FnZTogIlRoZSBzeXN0ZW0gaXMgZmluYWxseSB1cCwgYWZ0ZXIgJFVQVElNRSBzZWNvbmRzIg==';

/*#cloud-config
runcmd:
 - [ cd, "$HOME" ]
 - [ git, clone, "https://github.com/theTechie/aws-node-tasker.git", "aws-node-tasker" ]
 - [ cd, "aws-node-tasker" ]
 - [ npm, install ]
 - [ nodejs, "worker.js", "-i", 5 ]
final_message: "The system is finally up, after $UPTIME seconds"*/

EC2.createInstances(1, USER_DATA).then(function (data) {
    console.log(data);
}, function (error) {
    console.error(error);
});
