var Q = require('q'),
    EC2 = require('./ec2');

var argv = require('optimist')
    .usage('Usage: $0 -w [WORKER_COUNT] -i [IDLE_TIME_SECONDS]')
    .demand(['w'])
    .alias('w', 'workers')
    .describe('w', 'Number of Workers')
    .alias('i', 'idleTime')
    .describe('i', 'Idle Time in Seconds')
    .default('i', '0')
    .argv;

if (parseInt(argv.workers) != argv.workers) {
    console.log("Please provide valid value for worker count.");
    console.log("Usage: $0 -w [WORKER_COUNT] -i [IDLE_TIME_SECONDS]");
    process.exit();
}

if (parseInt(argv.idleTime) != argv.idleTime) {
    console.log("Please provide valid value for idle time (0 or 5).");
    console.log("Usage: $0 -w [WORKER_COUNT] -i [IDLE_TIME_SECONDS]");
    process.exit();
} else if (!(parseInt(argv.idleTime) == 0 || parseInt(argv.idleTime) == 5)) {
    console.log("Please provide valid value for idle time (0 or 5).");
    console.log("Usage: $0 -w [WORKER_COUNT] -i [IDLE_TIME_SECONDS]");
    process.exit();
}

var USER_DATA_5s_IDLE_TIME = 'I2Nsb3VkLWNvbmZpZw0KcnVuY21kOg0KIC0gWyBjZCwgIiRIT01FIiBdDQogLSBbIGdpdCwgY2xvbmUsICJodHRwczovL2dpdGh1Yi5jb20vdGhlVGVjaGllL2F3cy1ub2RlLXRhc2tlci5naXQiLCAiYXdzLW5vZGUtdGFza2VyIiBdDQogLSBbIGNkLCAiYXdzLW5vZGUtdGFza2VyIiBdDQogLSBbIG5wbSwgaW5zdGFsbCBdDQogLSBbIGdpdCwgY2hlY2tvdXQsICJhbmltb3RvLWNsb25lIiBdDQogLSBbIG5vZGVqcywgIndvcmtlci5qcyIsICItaSIsIDUgXQ0KZmluYWxfbWVzc2FnZTogIlRoZSBzeXN0ZW0gaXMgZmluYWxseSB1cCwgYWZ0ZXIgJFVQVElNRSBzZWNvbmRzIg==';

/*#cloud-config
runcmd:
 - [ cd, "$HOME" ]
 - [ git, clone, "https://github.com/theTechie/aws-node-tasker.git", "aws-node-tasker" ]
 - [ cd, "aws-node-tasker" ]
 - [ npm, install ]
 - [ git, checkout, "animoto-clone" ]
 - [ nodejs, "worker.js", "-i", 5 ]
final_message: "The system is finally up, after $UPTIME seconds"*/

/*EC2.createInstances(1, USER_DATA).then(function (data) {
    console.log(data);
}, function (error) {
    console.error(error);
});*/

var USER_DATA_0s_IDLE_TIME = 'I2Nsb3VkLWNvbmZpZw0KcnVuY21kOg0KIC0gWyBjZCwgIiRIT01FIiBdDQogLSBbIGdpdCwgY2xvbmUsICJodHRwczovL2dpdGh1Yi5jb20vdGhlVGVjaGllL2F3cy1ub2RlLXRhc2tlci5naXQiLCAiYXdzLW5vZGUtdGFza2VyIiBdDQogLSBbIGNkLCAiYXdzLW5vZGUtdGFza2VyIiBdDQogLSBbIG5wbSwgaW5zdGFsbCBdDQogLSBbIGdpdCwgY2hlY2tvdXQsICJhbmltb3RvLWNsb25lIiBdDQogLSBbIG5vZGVqcywgIndvcmtlci5qcyIsICItaSIsIDAgXQ0KZmluYWxfbWVzc2FnZTogIlRoZSBzeXN0ZW0gaXMgZmluYWxseSB1cCwgYWZ0ZXIgJFVQVElNRSBzZWNvbmRzIg==';

/*#cloud-config
runcmd:
 - [ cd, "$HOME" ]
 - [ git, clone, "https://github.com/theTechie/aws-node-tasker.git", "aws-node-tasker" ]
 - [ cd, "aws-node-tasker" ]
 - [ npm, install ]
 - [ git, checkout, "animoto-clone" ]
 - [ nodejs, "worker.js", "-i", 0 ]
final_message: "The system is finally up, after $UPTIME seconds"*/

var USER_DATA;

if (argv.idleTime == 0) {
    USER_DATA = USER_DATA_0s_IDLE_TIME;
} else {
    USER_DATA = USER_DATA_5s_IDLE_TIME;
}

EC2.createInstances(argv.workers, USER_DATA).then(function (data) {
    console.log("[Provisioner] : Provisioned " + argv.workers + " On-Demand Instances.");
}, function (error) {
    console.error("[Provisioner] : Error -> createSpotInstances() : ", error);
});

/*EC2.createSpotInstances(1, USER_DATA_0s_IDLE_TIME).then(function (data) {
    console.log("[Provisioner] : Provisioned 1 Spot Instance.");
}, function (error) {
    console.error("[Provisioner Error -> createSpotInstances()] : " + error);
});*/

// provisioner exited
process.on("SIGINT", function () {
    console.log('Exiting Provisioner !');
    process.exit();
});
