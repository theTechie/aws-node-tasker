var Q = require('q'),
    _ = require('underscore'),
    SQS = require('./sqs'),
    EC2 = require('./ec2'),
    QUEUE_NAME = 'CS553',
    QUEUE_LENGTH = 0,
    MAX_INSTANCE_COUNT = 1;

//NOTE : Monitor Queue Length using setInterval() and provision new workers dynamically

var USER_DATA = 'I2Nsb3VkLWNvbmZpZw0KcnVuY21kOg0KIC0gWyBjZCwgIiRIT01FIiBdDQogLSBbIGdpdCwgY2xvbmUsICJodHRwczovL2dpdGh1Yi5jb20vdGhlVGVjaGllL2F3cy1ub2RlLXRhc2tlci5naXQiLCAiYXdzLW5vZGUtdGFza2VyIiBdDQogLSBbIGNkLCAiYXdzLW5vZGUtdGFza2VyIiBdDQogLSBbIG5wbSwgaW5zdGFsbCBdDQogLSBbIG5vZGVqcywgIndvcmtlci5qcyIsICItaSIsIDUgXQ0KZmluYWxfbWVzc2FnZTogIlRoZSBzeXN0ZW0gaXMgZmluYWxseSB1cCwgYWZ0ZXIgJFVQVElNRSBzZWNvbmRzIg==';

/*#cloud-config
runcmd:
 - [ cd, "$HOME" ]
 - [ git, clone, "https://github.com/theTechie/aws-node-tasker.git", "aws-node-tasker" ]
 - [ cd, "aws-node-tasker" ]
 - [ npm, install ]
 - [ nodejs, "worker.js", "-i", 5 ]
final_message: "The system is finally up, after $UPTIME seconds"*/

/*EC2.createInstances(1, USER_DATA).then(function (data) {
    console.log(data);
}, function (error) {
    console.error(error);
});*/

// NOTE: Check for tasks on Master Q every 1 second
setInterval(function () {
    SQS.getQueueLength(QUEUE_NAME).then(function (length) {
        console.log("Queue Length:", length);

        // NOTE: get number of spot instances in 'pending' and 'running' state
        EC2.describeInstances().then(function (data) {
            var instanceCount = data.Reservations.length;

            console.log("[Provisioner] : Instance Count : ", instanceCount);

            // NOTE: if the number of tasks increased, start a worker
            if (length > QUEUE_LENGTH && instanceCount < MAX_INSTANCE_COUNT) {
                EC2.createSpotInstances(1, USER_DATA).then(function (data) {
                    console.log("[Provisioner] : Provisioned 1 Spot Instance.");
                }, function (error) {
                    console.error("[Provisioner Error -> createSpotInstances()] : " + error);
                });
            }
        }, function (err) {
            console.log("[Provisioner Error -> describeInstances()] : " + err);
        });
    }, function (error) {
        console.log("[Provisioner Error -> getQueueLength()] : " + error);
    });
}, 1000);

/*EC2.createSpotInstances(1, USER_DATA).then(function (data) {
    console.log("[Provisioner] : Provisioned 1 Spot Instance.", data);
}, function (error) {
    console.error(error);
});*/

// provisioner exited
process.on("SIGINT", function () {
    console.log('Exiting Provisioner !');
    process.exit();
});
